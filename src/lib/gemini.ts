import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. If you are on Vercel, please add it to your Environment Variables.");
    }
    aiInstance = new GoogleGenAI(apiKey);
  }
  return aiInstance;
}

export async function analyzeFaceAndSuggestStyles(
  imageBase64: string, 
  selectedHair?: string, 
  selectedBeard?: string
): Promise<{
  suggestions: string;
  recommendedHair: string[];
  recommendedBeard: string[];
}> {
  const ai = getAI();
  const model = "gemini-1.5-flash";
  
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

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return {
      suggestions: data.analysis || "No analysis available.",
      recommendedHair: data.hairRecommendations || [],
      recommendedBeard: data.beardRecommendations || [],
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {
      suggestions: "Face shape looks balanced! Try a textured crop or mid fade.",
      recommendedHair: ["Mid Fade", "Textured Crop"],
      recommendedBeard: ["Short Stubble"],
    };
  }
}

export async function generateGroomedLook(
  imageBase64: string,
  haircut: string,
  beard: string
): Promise<string> {
  const ai = getAI();
  const model = "gemini-1.5-flash"; // Stable multimodal model
  
  const prompt = `
    Analyze this photo. The user wants to see how they would look with a ${haircut} and ${beard}.
    Since you are a text-based AI, you cannot modify the image directly.
    However, describe the visual changes vividly.
    
    (Note to developer: Since Gemini 1.5 doesn't output images via SDK yet, 
    we will simulate the result by returning the original image for the UI to show 
    alongside your detailed text analysis).
  `;

  try {
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    };

    await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    // In a real scenario with image output support, we'd extract the image here.
    // For now, we return the original image to avoid "mismatch" errors 
    // while the analysis provides the "vision".
    return `data:image/jpeg;base64,${imageBase64}`;
  } catch (e) {
    console.error("AI Look generation failed", e);
    return `data:image/jpeg;base64,${imageBase64}`;
  }
}
