import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL = "gemini-3.1-flash-lite";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export async function analyzeFaceAndSuggestStyles(
  imageBase64: string, 
  selectedHair?: string, 
  selectedBeard?: string
) {
  const prompt = `
    You are a professional expert barber at Shabnam Men's Salon. 
    The user is considering a "${selectedHair || 'default'}" haircut and "${selectedBeard || 'default'}" beard style.
    Analyze their face photo and tell them how this combination will look.
    Be encouraging, professional, and explain why it suits their face shape.
    
    Structure the response as JSON with keys: "analysis", "hairRecommendations", "beardRecommendations".
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
      },
    });
    
    let data;
    try {
      data = JSON.parse(response.text || "{}");
    } catch (e) {
      data = { analysis: response.text || "Looking sharp!" };
    }

    return {
      suggestions: data.analysis || "Looking sharp!",
      recommendedHair: data.hairRecommendations || [],
      recommendedBeard: data.beardRecommendations || [],
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message?.includes('403') || error.status === 403) {
      throw new Error("API Permission Denied. Please check your Gemini API key in Settings > Secrets or choose a Different model.");
    }
    return {
      suggestions: "Looking sharp! This style fits your face structure.",
      recommendedHair: [],
      recommendedBeard: [],
    };
  }
}

export async function generateGroomedLook(
  imageBase64: string,
  haircut: string,
  beard: string
): Promise<string> {
  const prompt = `Groom the person in this image with a ${haircut} haircut and a ${beard} style. Maintain the person's facial features and identity perfectly. This is for a professional salon preview. The output MUST be a new image.`;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return `data:image/jpeg;base64,${imageBase64}`; 
  } catch (e: any) {
    console.error("Grooming Generation Error:", e);
    return `data:image/jpeg;base64,${imageBase64}`;
  }
}
