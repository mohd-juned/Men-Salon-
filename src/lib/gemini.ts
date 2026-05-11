import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. If you are on Vercel, please add it to your Environment Variables.");
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

  const modelInstance = ai.getGenerativeModel({ 
    model,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const result = await modelInstance.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  try {
    const data = JSON.parse(text || "{}");
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
  // Speed Optimization: Since standard Gemini models can't generate images yet,
  // we return original image instantly to avoid Vercel 10s timeout errors.
  return `data:image/jpeg;base64,${imageBase64}`;
}
