import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeFaceAndSuggestStyles, generateGroomedLook } from '../src/lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers for basic safety
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
      return res.status(400).json({ error: "No image data received" });
    }

    // Check key before calling functions
    if (!process.env.GEMINI_API_KEY) {
      console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables.");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY missing. Please add it to your Environment Variables on Vercel/Railway.",
        code: "MISSING_KEY"
      });
    }

    console.log(`Vercel Grooming Start: ${haircut} - ${beard}`);

    // Speed Optimization for Vercel Hobby (10s timeout)
    const analysisData = await analyzeFaceAndSuggestStyles(imageBase64, haircut, beard || 'Clean Shave');
    const newLook = `data:image/jpeg;base64,${imageBase64}`;

    console.log("Vercel Grooming Success");

    return res.status(200).json({
      analysis: analysisData,
      groomedImage: newLook
    });
  } catch (error: any) {
    console.error("Grooming Error:", error);
    const message = error.message || "AI Service Timeout or Failure";
    
    // Check for specific Gemini errors
    if (message.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: "Invalid GEMINI_API_KEY. Please check your key." });
    }
    
    return res.status(500).json({ error: `AI Failed: ${message}` });
  }
}
