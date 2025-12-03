// src/lib/claude.ts (or wherever it currently lives)

import { PlantAnalysis, HealthStatus, Language } from '../types'

const extractMime = (base64: string) =>
    base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] || 'image/jpeg'

const stripHeader = (base64: string) => base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')

const CLAUDE_MODEL = 'claude-3-haiku-20240307'
// In dev we proxy /api/claude to Anthropic via Vite proxy
const CLAUDE_ENDPOINT = '/api/claude'

const buildMockAnalysis = (language: Language = 'fr'): PlantAnalysis => {
    const isFr = language === 'fr'
    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        scientificName: 'Epipremnum aureum',
        commonName: isFr ? 'Pothos doré' : 'Golden pothos',
        confidence: 0.92,
        healthStatus: HealthStatus.HEALTHY,
        diagnosis: isFr ? 'Plante en bonne santé' : 'Plant appears healthy',
        symptoms: isFr ? ['Aucun symptôme visible'] : ['No visible stress'],
        treatment: isFr ? ['Pas de traitement nécessaire'] : ['No treatment required'],
        careInstructions: {
            water: isFr
                ? 'Arroser quand le premier cm de terre est sec'
                : 'Water when top inch of soil is dry',
            light: isFr ? 'Lumière indirecte vive' : 'Bright, indirect light',
            temperature: isFr ? '18-27°C' : '65-80°F',
            humidity: isFr ? 'Humidité modérée' : 'Moderate humidity',
        },
        funFact: isFr
            ? "Le pothos est un purificateur d'air populaire et très tolérant."
            : 'Pothos is a popular, forgiving air-purifying houseplant.',
    }
}

// Small helper: try to extract the JSON object from a messy string
const extractJsonObject = (text: string): any => {
    // Find the first `{` and the last `}` and parse that slice
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
        throw new Error('No JSON object found in Claude response')
    }
    const jsonSlice = text.slice(start, end + 1)
    return JSON.parse(jsonSlice)
}

export const analyzePlantImage = async (
    base64Image: string,
    language: Language = 'fr'
): Promise<PlantAnalysis> => {
    try {
        const mimeType = extractMime(base64Image)
        const cleanBase64 = stripHeader(base64Image)

        const langInstruction =
            language === 'fr'
                ? "Tu dois répondre en français. Les valeurs du JSON (commonName, diagnosis, symptoms, treatment, careInstructions, funFact) doivent être en français, SAUF 'healthStatus' qui DOIT être STRICTEMENT 'Healthy', 'Sick' ou 'Unknown' (ne traduis PAS cette valeur)."
                : "You must respond in English. JSON values (commonName, diagnosis, symptoms, treatment, careInstructions, funFact) must be in English, EXCEPT 'healthStatus' which MUST be exactly 'Healthy', 'Sick', or 'Unknown'."

        const systemPrompt = `
You are a plant identification and health analysis assistant.

Given an image of a plant (or something that might not be a plant), you MUST ALWAYS return a SINGLE JSON object with EXACTLY this shape, and NOTHING else:

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

Rules:
- Do NOT add any text before or after the JSON.
- Do NOT wrap the JSON in markdown or backticks.
- If the image does not contain a plant or you are unsure, set "healthStatus" to "Unknown" but STILL return a FULL JSON object.
${langInstruction}
    `.trim()

        const userPrompt =
            language === 'fr'
                ? 'Analyse cette image de plante et remplis le JSON demandé.'
                : 'Analyze this plant image and fill in the requested JSON.'

        const response = await fetch(CLAUDE_ENDPOINT, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 800,
                system: systemPrompt, // 👈 top-level system, NOT a message
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mimeType,
                                    data: cleanBase64,
                                },
                            },
                            {
                                type: 'text',
                                text: userPrompt,
                            },
                        ],
                    },
                ],
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            try {
                const errJson = JSON.parse(errorText)
                const msg = errJson?.error?.message || ''
                if (msg.includes('model:')) {
                    console.warn('Model not found, falling back to mock analysis')
                    return buildMockAnalysis(language)
                }
            } catch {
                // ignore parse errors here
            }
            throw new Error(`Claude API error: ${response.status} ${errorText}`)
        }

        const data = await response.json()

        const textBlock =
            data?.content?.find((c: any) => c.type === 'text')?.text ??
            data?.content?.[0]?.text ??
            data?.text

        if (!textBlock) {
            throw new Error('No response text from Claude')
        }

        console.log('Claude raw response text:', textBlock)

        let parsed
        try {
            // Ideal case: whole reply is JSON
            parsed = JSON.parse(textBlock)
        } catch {
            try {
                // Second chance: extract {...} from chatty reply
                parsed = extractJsonObject(textBlock)
            } catch {
                // Final fallback: surface Claude's explanation directly to the UI
                // (e.g. "L'image ne représente pas une plante...")
                throw new Error(textBlock)
            }
        }

        return {
            ...parsed,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            healthStatus: parsed.healthStatus as HealthStatus,
        }
    } catch (error) {
        console.error('Plant analysis failed:', error)
        throw error
    }
}
