import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeFaceAndSuggestStyles, generateGroomedLook } from "../src/lib/gemini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, haircut, beard } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ error: "GEMINI_API_KEY is missing on server" });
    }

    console.log(`Processing grooming on Vercel: ${haircut} + ${beard}`);

    // Run AI tasks
    const [analysisData, newLook] = await Promise.all([
      analyzeFaceAndSuggestStyles(imageBase64, haircut, beard || 'Clean Shave'),
      generateGroomedLook(imageBase64, haircut, beard || 'Clean Shave')
    ]);

    res.status(200).json({
      analysis: analysisData,
      groomedImage: newLook
    });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI Processing Failed. Make sure GEMINI_API_KEY is set in Vercel." });
  }
}
