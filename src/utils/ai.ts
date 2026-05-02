/**
 * SECURE AI UTILITY
 * 
 * This utility sends prompts to the /api/ai/chat endpoint.
 * Benefits:
 * 1. API Key is hidden on the server.
 * 2. Server-side rate limiting prevents abuse.
 * 3. All prompts can be logged for security auditing.
 */

export async function callAIQuietly(prompt: string, context: any = {}) {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "AI Service Error");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Secure AI Fetch Error:", error);
    throw error;
  }
}
