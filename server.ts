import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. AI SECURITY PROXY
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // Simple Rate Limiting for AI Endpoints
  const requestCounts = new Map<string, { count: number; lastReset: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 10;

  const checkRateLimit = (ip: string) => {
    const now = Date.now();
    const stats = requestCounts.get(ip) || { count: 0, lastReset: now };

    if (now - stats.lastReset > RATE_LIMIT_WINDOW) {
      stats.count = 1;
      stats.lastReset = now;
    } else {
      stats.count++;
    }
    requestCounts.set(ip, stats);
    return stats.count <= MAX_REQUESTS;
  };

  app.post("/api/ai/chat", async (req, res) => {
    const clientIp = req.ip || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many AI requests. Please slow down." });
    }

    try {
      const { prompt, context } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const fullPrompt = `${context ? `Context: ${JSON.stringify(context)}\n\n` : ""}User: ${prompt}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt
      });

      res.json({ text: response.text });
    } catch (error) {

      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // 2. WHATSAPP WEBHOOK HANDLER
  app.get("/api/webhooks/whatsapp", (req, res) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "hirenest_verify_token";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WhatsApp Webhook Verified");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  });

  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      console.log("📩 WhatsApp Event:", JSON.stringify(body, null, 2));
      
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (messages && messages.length > 0) {
        const msg = messages[0];
        const from = msg.from;
        const text = msg.text?.body;

        console.log(`[WHATSAPP] From ${from}: ${text}`);
        
        // AUTO-RESPONSE LOGIC (AI AGENT IN ENTERPRISE MODE)
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Act as a helpful professional recruitment assistant for HireNest. A candidate/vendor messaged: "${text}". Reply in a natural, helpful way. Keep it under 50 words.`
        });

        // In production, you would call Meta Graph API here to send response
        console.log(`[WHATSAPP] Suggested AI Reply: ${response.text}`);
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("WhatsApp Webhook Error:", err);
      res.status(500).send("INTERNAL_ERROR");
    }
  });

  // 3. HEALTH CHECK
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.0.0-enterprise",
      whatsapp_status: "listening",
      neural_engine: "active"
    });
  });

  // 3. VITE MIDDLEWARE
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 HireNest Secure OS running on http://localhost:${PORT}`);
  });
}

startServer();
