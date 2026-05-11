import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, haircut, beard } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Vercel Error: GEMINI_API_KEY is missing");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on Vercel.",
        code: "MISSING_KEY"
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are a professional expert barber at Shabnam Men's Salon. 
      The user is considering a "${haircut || 'default'}" haircut and "${beard || 'default'}" beard style.
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

    console.log(`AI Task Start: ${haircut} - ${beard}`);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    let analysisData;
    try {
      analysisData = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response", text);
      analysisData = {
        analysis: "Your face shape is versatile! This style will emphasize your features well.",
        hairRecommendations: [],
        beardRecommendations: []
      };
    }

    return res.status(200).json({
      analysis: {
        suggestions: analysisData.analysis,
        recommendedHair: analysisData.hairRecommendations || [],
        recommendedBeard: analysisData.beardRecommendations || []
      },
      groomedImage: `data:image/jpeg;base64,${imageBase64}` // Return original as preview
    });

  } catch (error: any) {
    console.error("Vercel AI Error:", error);
    const message = error.message || "An unexpected error occurred during AI processing.";
    
    if (message.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: "Invalid GEMINI_API_KEY. Please verify your API key in Vercel settings." });
    }

    return res.status(500).json({ 
      error: `AI Processing Failed: ${message}`,
      details: error.toString()
    });
  }
}
