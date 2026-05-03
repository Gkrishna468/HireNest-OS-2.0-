
/**
 * AI SECURE PROXY UTILITY
 * Routes AI calls through the backend to protect sensitive keys.
 */
export async function callAISecureProxy(prompt: string, context: any = {}) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "AI Proxy Error");
  }

  const data = await response.json();
  return data.text;
}
