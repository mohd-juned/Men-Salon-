import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
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
  // Use gemini-2.5-flash-image for image editing/generation
  const model = "gemini-2.5-flash-image";
  
  const prompt = `
    Apply a professional grooming transformation to this person's photo.
    Change their hairstyle to a "${haircut}" and their beard to "${beard}".
    MAINTAIN THEIR ORIGINAL FACE, FEATURES, AND SKIN TONE.
    The transformation must look photorealistic and seamless, as if they just had a haircut at a premium salon.
    Preserve same lighting and background. Result must be ONLY the modified image.
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
  });

  // Extract the image from candidates
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No response from AI");

  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image was generated");
}
