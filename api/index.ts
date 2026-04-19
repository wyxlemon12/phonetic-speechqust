import express from "express";
import path from "path";
import chineseS2T from "chinese-s2t";

const t2s = (chineseS2T as any).t2s || (chineseS2T as any).default?.t2s || chineseS2T;

function countHanCharacters(text: string) {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

function buildTtsRequest(text: string, speed = 1.0) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { input: trimmed, speed };
  }

  if (countHanCharacters(trimmed) <= 3) {
    const spacedWord = Array.from(trimmed).join(" ");
    return {
      input: `請清楚、放慢一些，把每個字都讀完整，尤其最後一個字不要吞音。<|endofprompt|>${spacedWord}。`,
      speed: Math.min(speed, 0.82),
    };
  }

  return { input: trimmed, speed };
}

function sanitizeTtsText(text: string) {
  return String(text)
    .replace(/\(.*?\)/g, "")
    .replace(/pinyin:\s*[a-zA-Z1-5\s]*/gi, "")
    .replace(/instruction:\s*[^,.!?，。！？]*/gi, "")
    .replace(/[^\u4e00-\u9fff,.!?，。！？、“”‘’()（）\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function createApp() {
  const app = express();

  app.use(express.json());

  const siliconFlowApiKey = process.env.SILICONFLOW_API_KEY?.trim();
  const siliconFlowUrl =
    process.env.SILICONFLOW_TTS_URL?.trim() ||
    "https://api.siliconflow.cn/v1/audio/speech";

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
  });

  app.post("/api/tts", async (req: express.Request, res: express.Response) => {
    const { text, speed = 1.0 } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!siliconFlowApiKey) {
      return res.status(500).json({ error: "No TTS API Key configured" });
    }

    try {
      const cleanText = sanitizeTtsText(text);
      const ttsRequest = buildTtsRequest(t2s ? t2s(cleanText || text) : (cleanText || text), speed);
      const ttsInput = ttsRequest.input;

      console.log(`[Server TTS] Attempting SiliconFlow | Text: "${ttsInput.substring(0, 20)}..."`);
      console.log('[Server TTS] Payload', {
        originalText: text,
        cleanText,
        ttsInput,
        speed: ttsRequest.speed,
      });

      const sfResponse = await fetch(siliconFlowUrl, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${siliconFlowApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "FunAudioLLM/CosyVoice2-0.5B",
          input: ttsInput,
          voice: "FunAudioLLM/CosyVoice2-0.5B:anna",
          speed: ttsRequest.speed,
          response_format: "mp3",
        }),
      });

      if (!sfResponse.ok) {
        const errText = await sfResponse.text();
        console.error(`[Server TTS] SiliconFlow failed (Status ${sfResponse.status}):`, errText);
        return res.status(sfResponse.status).json({ error: "SiliconFlow failed", details: errText });
      }

      const buffer = await sfResponse.arrayBuffer();
      res.set("Content-Type", "audio/mpeg");
      return res.send(Buffer.from(buffer));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[Server TTS] Critical failure:", msg);
      return res.status(500).json({
        error: "TTS Service Error",
        details: msg,
        hint: "Ensure your API keys are valid and accounts have balance.",
      });
    }
  });

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
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  return app;
}

let appPromise: Promise<express.Express> | null = null;

export default async function handler(req: express.Request, res: express.Response) {
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  return app(req, res);
}
