import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, haircut, beard } = req.body;
    const model = "gemini-1.5-flash";
    const prompt = `Groom the person in this image with a ${haircut} haircut and a ${beard} facial hair style. Maintain the person's facial features and identity perfectly. The output must be a single photorealistic, high-quality image of the person with the requested grooming. This is for a professional salon preview.`;

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(",")[1] || imageBase64,
      },
    };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return res.json({ image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
        }
      }
    }
    res.json({ image: imageBase64 });
  } catch (e) {
    console.error("Grooming Generation Error:", e);
    res.status(500).json({ error: "Generation failed" });
  }
}
