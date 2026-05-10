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
      return res.status(500).json({ error: "GEMINI_API_KEY is not set on Vercel Dashboard" });
    }

    console.log(`Vercel Grooming Task: ${haircut} - ${beard}`);

    // Run AI tasks sequentially if needed to avoid memory/timeout issues on Hobby plan
    const analysisData = await analyzeFaceAndSuggestStyles(imageBase64, haircut, beard || 'Clean Shave');
    const newLook = await generateGroomedLook(imageBase64, haircut, beard || 'Clean Shave');

    return res.status(200).json({
      analysis: analysisData,
      groomedImage: newLook
    });
  } catch (error: any) {
    console.error("Vercel AI Error:", error);
    const message = error.message || "Unknown Server Error";
    return res.status(500).json({ error: `Server Error: ${message}` });
  }
}
