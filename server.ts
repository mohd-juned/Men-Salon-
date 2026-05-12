import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing with higher limit for image uploads
  app.use(express.json({ limit: '10mb' }));

  // AI API Route (Secure Proxy)
  app.post("/api/groom", async (req, res) => {
    try {
      const { imageBase64, haircut, beard } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image" });
      }

      console.log(`Processing grooming: ${haircut} + ${beard}`);

      // Dynamically import the gemini lib to access API key on server
      const { analyzeFaceAndSuggestStyles, generateGroomedLook } = await import("./src/lib/gemini");

      // Run AI tasks
      const [analysisData, newLook] = await Promise.all([
        analyzeFaceAndSuggestStyles(imageBase64, haircut, beard || 'Clean Shave'),
        generateGroomedLook(imageBase64, haircut, beard || 'Clean Shave')
      ]);

      res.json({
        analysis: analysisData,
        groomedImage: newLook
      });
    } catch (error) {
      console.error("AI API Error:", error);
      res.status(500).json({ error: "AI Processing Failed. Check your GEMINI_API_KEY on the server." });
    }
  });

  // vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
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
