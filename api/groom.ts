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

    console.log(`Vercel Grooming Task Start: ${haircut} - ${beard}`);

    // Parallel calls are essential to stay under 10s Vercel Hobby timeout
    const [analysisData, newLook] = await Promise.all([
      analyzeFaceAndSuggestStyles(imageBase64, haircut, beard || 'Clean Shave'),
      generateGroomedLook(imageBase64, haircut, beard || 'Clean Shave')
    ]);

    console.log("Vercel Grooming Task Success");

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
