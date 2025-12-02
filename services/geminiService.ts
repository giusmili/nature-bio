import { PlantAnalysis, HealthStatus, Language } from "../types";

const extractMime = (base64: string) =>
  base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] || "image/jpeg";

const stripHeader = (base64: string) =>
  base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

const CLAUDE_MODEL = "claude-3-5-sonnet-latest";
// In dev we proxy /api/claude to Anthropics via Vite proxy; in prod we hit the Vercel serverless function
const CLAUDE_ENDPOINT = "/api/claude";

const buildMockAnalysis = (language: Language = "fr"): PlantAnalysis => {
  const isFr = language === "fr";
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    scientificName: "Epipremnum aureum",
    commonName: isFr ? "Pothos doré" : "Golden pothos",
    confidence: 0.92,
    healthStatus: HealthStatus.HEALTHY,
    diagnosis: isFr ? "Plante en bonne santé" : "Plant appears healthy",
    symptoms: isFr ? ["Aucun symptôme visible"] : ["No visible stress"],
    treatment: isFr ? ["Pas de traitement nécessaire"] : ["No treatment required"],
    careInstructions: {
      water: isFr ? "Arroser quand le premier cm de terre est sec" : "Water when top inch of soil is dry",
      light: isFr ? "Lumière indirecte vive" : "Bright, indirect light",
      temperature: isFr ? "18-27°C" : "65-80°F",
      humidity: isFr ? "Humidité modérée" : "Moderate humidity",
    },
    funFact: isFr
      ? "Le pothos est un purificateur d'air populaire et très tolérant."
      : "Pothos is a popular, forgiving air-purifying houseplant.",
  };
};

export const analyzePlantImage = async (base64Image: string, language: Language = "fr"): Promise<PlantAnalysis> => {
  try {
    const mimeType = extractMime(base64Image);
    const cleanBase64 = stripHeader(base64Image);

    const langInstruction =
      language === "fr"
        ? "Analyze in French. Return JSON string values in French (commonName, diagnosis, symptoms, treatment, careInstructions, funFact), EXCEPT for 'healthStatus' which MUST strictly be one of ['Healthy', 'Sick', 'Unknown'] (do not translate the enum value)."
        : "Analyze in English.";

    const response = await fetch(CLAUDE_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        langInstruction: `Identify this plant, assess its health (diseases, pests, deficiencies), and provide care instructions. If it is not a plant, set healthStatus to Unknown. ${langInstruction} Return a strict JSON object with keys: scientificName, commonName, confidence (0-1), healthStatus (Healthy|Sick|Unknown), diagnosis, symptoms (array of strings), treatment (array of strings), careInstructions { water, light, temperature, humidity }, funFact.`,
        imageBase64: cleanBase64,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const textBlock =
      data?.content?.find((c: any) => c.type === "text")?.text ||
      data?.content?.[0]?.text ||
      data?.text;
    if (!textBlock) throw new Error("No response text from Claude");

    const parsed = JSON.parse(textBlock);

    return {
      ...parsed,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      healthStatus: parsed.healthStatus as HealthStatus,
    };
  } catch (error) {
    console.error("Plant analysis failed:", error);
    throw error;
  }
};
