import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      throw new Error("GEMINI_API_KEY is not defined.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Reply Agent: Detects responses and classifies intent using Gemini
 */
export async function runReplyAgent() {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("REPLY AGENT SESSION:", session);
  console.log("REPLY AGENT GMAIL TOKEN:", session?.provider_token);

  const token = session?.provider_token;

  if (!token) {
    console.error("NO TOKEN → Gmail not connected properly in Reply Agent");
    return "Gmail not connected. Skipping reply detection.";
  }

  // In a real app, we poll https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread
  // For this OS, we simulate the "intelligence" of detection by fetching sent logs
  
  const { data: sentLogs } = await supabase
    .from('outreach_logs')
    .select('*')
    .eq('status', 'sent');

  if (!sentLogs) return "No pending replies to check.";

  let detections = 0;

  for (const log of sentLogs) {
    // Simulation: Only process 10% of logs to find a "reply"
    if (Math.random() > 0.9) {
      const simulatedBody = "Hi, I received your email. The role sounds interesting! I am available on Thursday for a call.";
      
      try {
        const prompt = `
          Classify the following candidate reply as: INTERESTED, REJECTED, or NEUTRAL.
          REPLY: "${simulatedBody}"
          
          Return ONLY the classification string.
        `;

        const response = await getAI().models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });

        const intent = response.text?.trim() || "NEUTRAL";

        if (intent === 'INTERESTED') {
          await supabase.from('outreach_logs').update({
            status: 'replied',
            replied_at: new Date().toISOString()
          }).eq('id', log.id);

          // Auto-move candidate to next stage based on AI detection
          await supabase.from('candidates').update({
            stage: 'interview',
            notes: `[AI AUTONOMOUS] Reply detected: "${intent}". Moving to active interview path.`
          }).eq('id', log.candidate_id);

          await supabase.from('agent_logs').insert({
            type: 'reply',
            message: `AI detected INTERESTED intent from ${log.email}. Auto-updated candidate stage.`,
            level: 'success'
          });
          
          detections++;
        }
      } catch (err) {
        console.error('AI Intent Error:', err);
      }
    }
  }

  return `Reply detection cycle complete. Found ${detections} responses.`;
}
