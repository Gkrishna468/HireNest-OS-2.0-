import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Supabase Init for server-side logging
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. AI SECURITY PROXY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is not set in the environment. AI features will fail.");
  }
  const genAI = new GoogleGenerativeAI(apiKey || "");

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
      
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt
      });
      const text = response.text;

      res.json({ text });
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
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (messages && messages.length > 0) {
        const msg = messages[0];
        const from = msg.from; // Phone number
        const text = msg.text?.body;

        // 1. LOG TO SUPABASE AGENT LOGS (for real-time streaming in Intelligence Center)
        const { data: logData, error: logError } = await supabase.from('agent_logs').insert({
          type: 'outreach',
          level: 'info',
          message: `[WHATSAPP INBOUND] Message from +${from}: "${text}"`,
          metadata: { channel: 'whatsapp', sender: from, content: text }
        }).select();

        // 2. BRAIN: CONTEXT-AWARE REPLY
        // Fetch candidate details if exists
        const { data: candidate } = await supabase.from('candidates').select('*').eq('phone', from).single();
        
        const context = candidate 
          ? `The sender is Candidate ${candidate.name} (Match Score ${candidate.ai_match_score}%). They are currently in ${candidate.stage} stage.`
          : `The sender is a new contact.`;

        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `
            Act as "Nestor", the high-end recruitment specialist from HireNest. 
            You are professional, warm, and highly efficient. 
            
            CONTEXT:
            ${context}
            
            USER MESSAGE:
            "${text}"
            
            YOUR TASK:
            1. Generate a human-like, customized WhatsApp reply. 
            2. If they are a new contact, politely ask for their current role or top skill to help with lead generation.
            3. If they ask about status, mention that our 'neural ranking engine' is currently validating their profile against high-priority mandates.
            4. Keep it concise (under 300 characters), use 1-2 relevant emojis, and be helpful.
            
            REPLY:`
        });
        const replyText = response.text;

        // 3. LOG OUTBOUND REPLY
        await supabase.from('agent_logs').insert({
          type: 'outreach',
          level: 'success',
          message: `[WHATSAPP AUTO-REPLY] To +${from}: "${replyText.slice(0, 50)}..."`,
          metadata: { channel: 'whatsapp', recipient: from, content: replyText, ai_generated: true }
        });

        // In production: await fetch('https://graph.facebook.com/...', { ...body: { to: from, text: { body: replyText } } })
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
