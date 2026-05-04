
/**
 * AI SECURE PROXY UTILITY
 * Routes AI calls through the backend to protect sensitive keys.
 */
export async function callAISecureProxy(prompt: string, config: any = {}) {
  const endpoint = "/api/ai/proxy";
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      prompt, 
      config: {
        model: config.model || "gemini-1.5-pro",
        ...config
      },
      context: config.context
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "AI Proxy Error");
  }

  const data = await response.json();
  // Support both response formats ({text: ""} or just "")
  return typeof data === 'string' ? data : data.text;
}
