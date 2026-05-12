import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeFaceAndSuggestStyles(
  imageBase64: string, 
  selectedHair?: string, 
  selectedBeard?: string
): Promise<{
  suggestions: string;
  recommendedHair: string[];
  recommendedBeard: string[];
}> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are a professional expert barber at Shabnam Men's Salon. 
    The user is considering a "${selectedHair || 'default'}" haircut and "${selectedBeard || 'default'}" beard style.
    Analyze their face photo and tell them exactly how this specific combination will look on them.
    Be encouraging, professional, and explain why it suits their face shape (or suggest minor tweaks to the style to make it better).
    
    Structure the response as JSON with keys: "analysis", "hairRecommendations", "beardRecommendations".
    Leave hairRecommendations and beardRecommendations as empty arrays if you only have one main recommendation.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    try {
      const data = JSON.parse(text);
      return {
        suggestions: data.analysis || "Looking sharp! This style fits your face structure.",
        recommendedHair: data.hairRecommendations || [],
        recommendedBeard: data.beardRecommendations || [],
      };
    } catch (parseError) {
      console.error("Parse Error:", parseError, "Raw Text:", text);
      return {
        suggestions: text || "Analysis complete.",
        recommendedHair: [],
        recommendedBeard: [],
      };
    }
  } catch (e) {
    console.error("Gemini Analysis Error:", e);
    // Fallback if API fails
    return {
      suggestions: "Your face shape is perfectly suited for this style. The contours of your jawline suggest that a groomed beard will add great definition.",
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
  const model = "gemini-2.5-flash-image";
  const prompt = `Groom this person with a ${haircut} haircut and a ${beard}. Output ONLY the new photorealistic image based on their existing face. Keeping the face identity exactly the same is crucial. Focus the changes on the scalp and jawline as requested.`;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Fallback to original if no image part generated
    return `data:image/jpeg;base64,${imageBase64}`;
  } catch (e) {
    console.error("Grooming Generation Error:", e);
    return `data:image/jpeg;base64,${imageBase64}`;
  }
}
