// src/lib/claude.ts (or wherever it currently lives)

import { PlantAnalysis, HealthStatus, Language } from "../types";

const extractMime = (base64: string) =>
  base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] || "image/jpeg";

const stripHeader = (base64: string) =>
  base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

const CLAUDE_MODEL = "claude-3-5-sonnet-latest";
// In dev we proxy /api/claude to Anthropic via Vite proxy
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

export const analyzePlantImage = async (
  base64Image: string,
  language: Language = "fr"
): Promise<PlantAnalysis> => {
  try {
    const mimeType = extractMime(base64Image);
    const cleanBase64 = stripHeader(base64Image);

    const langInstruction =
      language === "fr"
        ? "Réponds en français. Les valeurs JSON doivent être en français (commonName, diagnosis, symptoms, treatment, careInstructions, funFact), SAUF 'healthStatus' qui DOIT être STRICTEMENT l'une de ['Healthy', 'Sick', 'Unknown'] (ne traduis pas cette valeur)."
        : "Respond in English.";

    const systemPrompt = `
You are a plant identification and health analysis assistant.
Given a plant image, you must:
1) Identify the plant (scientific and common name if possible).
2) Assess its health: diseases, pests, and nutrient deficiencies if any.
3) Provide practical care instructions.
4) If it's not a plant or you're uncertain, set "healthStatus" to "Unknown".

Return a STRICT JSON object with the following shape (and nothing else):

{
  "scientificName": string,
  "commonName": string,
  "confidence": number, // between 0 and 1
  "healthStatus": "Healthy" | "Sick" | "Unknown",
  "diagnosis": string,
  "symptoms": string[],
  "treatment": string[],
  "careInstructions": {
    "water": string,
    "light": string,
    "temperature": string,
    "humidity": string
  },
  "funFact": string
}

Do not include markdown, backticks, or explanations outside of this JSON.
${langInstruction}
    `.trim();

    // 💡 Important: this matches Anthropic's /v1/messages format
    const response = await fetch(CLAUDE_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType, // e.g. image/jpeg
                  data: cleanBase64, // base64 without data:... header
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Anthropic messages response:
    // data.content is an array of content blocks, usually [{ type: "text", text: "..." }]
    const textBlock =
      data?.content?.find((c: any) => c.type === "text")?.text ??
      data?.content?.[0]?.text ??
      data?.text;

    if (!textBlock) {
      throw new Error("No response text from Claude");
    }

    const parsed = JSON.parse(textBlock);

    return {
      ...parsed,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      healthStatus: parsed.healthStatus as HealthStatus,
    };
  } catch (error) {
    console.error("Plant analysis failed:", error);
    // Optionnel : fallback mock en dev
    // return buildMockAnalysis(language);
    throw error;
  }
};
