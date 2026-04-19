import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import chineseS2T from "chinese-s2t";
import { buildTtsInput } from "./src/utils/ttsInput.ts";
// Robust t2s binding for different environments
const t2s = (chineseS2T as any).t2s || (chineseS2T as any).default?.t2s || chineseS2T;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  app.use(express.json());

  // API keys from environment (Prefer env for security and validity)
  const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY?.trim();
  const SILICONFLOW_URL =
    process.env.SILICONFLOW_TTS_URL?.trim() ||
    "https://api.siliconflow.cn/v1/audio/speech";
  
  if (SILICONFLOW_API_KEY?.startsWith("AIzaSy")) {
    console.error("[Server] CRITICAL: You are using a Google (Gemini) API Key for SiliconFlow! SiliconFlow keys must start with 'sk-'.");
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
  });

  // API route for TTS
  app.post("/api/tts", async (req: express.Request, res: express.Response) => {
    const { text, speed = 1.0 } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!SILICONFLOW_API_KEY) {
      return res.status(500).json({ error: "No TTS API Key configured" });
    }

    try {
      // Intensive cleaning for TTS engines
      let cleanText = text
        .replace(/\(.*\)/g, "")
        .replace(/（.*）/g, "")
        .replace(/pinyin:\s*[a-zA-Z1-5\s]*/gi, "")
        .replace(/instruction:\s*[^，。！？]*/gi, "")
        // Allow ONLY base CJK Unified Ideographs and standard Simplified punctuation.
        .replace(/[^\u4e00-\u9fa5，。！？；：“”‘’（）、]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Ensure absolutely NO Traditional Chinese characters are sent to the engines
      const ttsInput = buildTtsInput(t2s ? t2s(cleanText || text) : (cleanText || text));
      
      // --- ONLY TTS PROVIDER: SiliconFlow ---
      console.log(`[Server TTS] Attempting SiliconFlow | Text: "${ttsInput.substring(0, 20)}..."`);
      
      try {
        const sfResponse = await fetch(SILICONFLOW_URL, {
          method: "POST",
          signal: AbortSignal.timeout(15000), 
          headers: {
            "Authorization": `Bearer ${SILICONFLOW_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "FunAudioLLM/CosyVoice2-0.5B",
            input: ttsInput,
            voice: "FunAudioLLM/CosyVoice2-0.5B:anna",
            speed: speed,
            response_format: "mp3"
          })
        });

        if (sfResponse.ok) {
          const buffer = await sfResponse.arrayBuffer();
          res.set("Content-Type", "audio/mpeg");
          return res.send(Buffer.from(buffer));
        } else {
          const errText = await sfResponse.text();
          console.error(`[Server TTS] SiliconFlow failed (Status ${sfResponse.status}):`, errText);
          return res.status(sfResponse.status).json({ error: "SiliconFlow failed", details: errText });
        }
      } catch (sfErr) {
        console.error(`[Server TTS] SiliconFlow connection error:`, sfErr);
        return res.status(502).json({ error: "SiliconFlow unreachable" });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[Server TTS] Critical failure:", msg);
      
      // If we already sent headers, we can't send a JSON response
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "TTS Service Error", 
          details: msg,
          hint: "Ensure your API keys are valid and accounts have balance." 
        });
      }
    }
  });

  // Vite middleware for development (Only if NOT on Vercel)
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  return app;
}

// Only start the server if this file is run directly
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isDirectRun || (!process.env.VERCEL && process.env.NODE_ENV !== 'test')) {
  createApp().then(app => {
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
  });
}
