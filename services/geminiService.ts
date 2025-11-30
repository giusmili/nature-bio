
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlantAnalysis, HealthStatus, Language } from "../types";

const apiKey =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY;

// Initialize the client only if we have a key
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const buildMockAnalysis = (language: Language = "en"): PlantAnalysis => {
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
    treatment: isFr
      ? ["Pas de traitement nécessaire"]
      : ["No treatment required"],
    careInstructions: {
      water: isFr
        ? "Arroser quand le premier cm de terre est sec"
        : "Water when top inch of soil is dry",
      light: isFr ? "Lumière indirecte vive" : "Bright, indirect light",
      temperature: isFr ? "18-27°C" : "65-80°F",
      humidity: isFr ? "Humidité modérée" : "Moderate humidity",
    },
    funFact: isFr
      ? "Le pothos est un purificateur d'air populaire et très tolérant."
      : "Pothos is a popular, forgiving air-purifying houseplant.",
  };
};

const plantSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scientificName: { type: Type.STRING, description: "Scientific name of the plant" },
    commonName: { type: Type.STRING, description: "Common name of the plant" },
    confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
    healthStatus: { 
      type: Type.STRING, 
      enum: ["Healthy", "Sick", "Unknown"],
      description: "General health assessment" 
    },
    diagnosis: { type: Type.STRING, description: "Name of the disease or 'Healthy'" },
    symptoms: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of visual symptoms detected"
    },
    treatment: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step by step treatment recommendations"
    },
    careInstructions: {
      type: Type.OBJECT,
      properties: {
        water: { type: Type.STRING, description: "Watering frequency and amount" },
        light: { type: Type.STRING, description: "Light requirements" },
        temperature: { type: Type.STRING, description: "Ideal temperature range" },
        humidity: { type: Type.STRING, description: "Humidity requirements" }
      },
      required: ["water", "light", "temperature", "humidity"]
    },
    funFact: { type: Type.STRING, description: "An interesting fact about this plant" }
  },
  required: ["scientificName", "commonName", "confidence", "healthStatus", "diagnosis", "treatment", "careInstructions", "symptoms"]
};

export const analyzePlantImage = async (base64Image: string, language: Language = 'en'): Promise<PlantAnalysis> => {
  try {
    // Remove header from base64 string if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const langInstruction = language === 'fr' 
      ? "Analyze in French. Return JSON string values in French (commonName, diagnosis, symptoms, treatment, careInstructions, funFact), EXCEPT for 'healthStatus' which MUST strictly be one of ['Healthy', 'Sick', 'Unknown'] (do not translate the enum value)." 
      : "Analyze in English.";

    if (!ai) {
      console.warn(
        "Gemini API key is missing; returning mock analysis instead of calling the API."
      );
      return buildMockAnalysis(language);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Identify this plant, assess its health (look for diseases, pests, deficiencies), and provide care instructions. If it is not a plant, set healthStatus to Unknown. ${langInstruction}`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: plantSchema,
        systemInstruction: "You are an expert botanist and plant pathologist. Analyze images carefully for subtle signs of stress or disease.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    return {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      // Map string enum from JSON to Typescript Enum if needed, usually direct mapping works if strings match
      healthStatus: data.healthStatus as HealthStatus
    };

  } catch (error) {
    console.error("Plant analysis failed:", error);
    throw error;
  }
};
