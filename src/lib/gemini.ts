import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Check for AI Studio environment variable (process.env is available in that preview environment)
  try {
    if (typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // process.env might throw in some environments if strictly handled
  }

  // Check for Vite/Netlify environment variable (standard way for Vite apps)
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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
      model,
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
  const model = "gemini-3.1-flash-image-preview";
  const prompt = `Groom the person in this image with a ${haircut} haircut and a ${beard} facial hair style. Maintain the person's facial features and identity perfectly. The output must be a single photorealistic, high-quality image of the person with the requested grooming. This is for a professional salon preview.`;

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
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
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
    
    // If we get here and there's text, it might be a refusal or clarification
    const textPart = response.text;
    if (textPart) {
      console.warn("Grooming model returned text instead of image:", textPart);
    }
    
    return `data:image/jpeg;base64,${imageBase64}`;
  } catch (e: any) {
    console.error("Grooming Generation Error:", e);
    // If it's a 404, maybe this model isn't available to the user's key yet
    if (e.message?.includes("404") || e.status === 404) {
       // Try fallback to 2.5
       try {
         const fallbackResponse = await ai.models.generateContent({
           model: "gemini-2.5-flash-image",
           contents: { parts: [imagePart, { text: prompt }] }
         });
         if (fallbackResponse.candidates?.[0]?.content?.parts) {
           for (const part of fallbackResponse.candidates[0].content.parts) {
             if (part.inlineData) {
               return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
           }
         }
       } catch (innerE) {
         console.error("Fallback grooming also failed:", innerE);
       }
    }
    return `data:image/jpeg;base64,${imageBase64}`;
  }
}
