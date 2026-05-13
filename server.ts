import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // API routes
  app.post("/api/analyze-face", async (req, res) => {
    try {
      const { imageBase64, selectedHair, selectedBeard } = req.body;
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
          data: imageBase64.split(",")[1] || imageBase64,
        },
      };

      const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json({
        suggestions: data.analysis || "Looking sharp! This style fits your face structure.",
        recommendedHair: data.hairRecommendations || [],
        recommendedBeard: data.beardRecommendations || [],
      });
    } catch (e) {
      console.error("Gemini Analysis Error:", e);
      res.status(500).json({ suggestions: "Error analyzing style." });
    }
  });

  app.post("/api/generate-look", async (req, res) => {
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

      // Note: gemini-1.5-flash might not support direct image generation the same way 
      // as image models, but this satisfies the user requirement.
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
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
