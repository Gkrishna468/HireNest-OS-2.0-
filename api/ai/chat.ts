import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in environment' });
  }

  try {
    const { prompt, context } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Inject system instructions for the recruitment OS
    const systemPrompt = `You are HireNest AI, a high-performance recruitment assistant. 
    ${context ? `Context of current page: ${JSON.stringify(context)}` : ""}
    User Message: ${prompt}`;
    
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    res.status(200).json({ reply: text }); // Match common "reply" key
  } catch (error: any) {
    console.error("AI API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
}
