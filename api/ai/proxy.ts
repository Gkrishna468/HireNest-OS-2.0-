import type { VercelRequest, VercelResponse } from "@vercel/node";

const RATE_LIMIT = 30; // 30 requests per minute
const WINDOW_MS = 60 * 1000;
const ipStore = new Map<string, { count: number; start: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record) {
    ipStore.set(ip, { count: 1, start: now });
    return { allowed: true };
  }

  if (now - record.start > WINDOW_MS) {
    ipStore.set(ip, { count: 1, start: now });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, retry: WINDOW_MS - (now - record.start) };
  }

  record.count++;
  return { allowed: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const start = Date.now();
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";

  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return res.status(429).json({ error: "Too many requests", retry_after_ms: rl.retry });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${req.body.config?.model || "gemini-1.5-pro"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return res.status(500).json({ error: "AI proxy failed" });
  }
}
