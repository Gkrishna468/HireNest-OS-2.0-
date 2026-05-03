import { supabase } from '@/lib/supabase';
import { callAISecureProxy } from '@/lib/ai';

/**
 * WHATSAPP SERVICE: Neural Automation for Lead Gen & Recruitment
 * Integrates Meta Business API with Gemini AI for human-like engagement.
 */

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

const WHATSAPP_API_VERSION = 'v18.0';

export const WHATSAPP_PROMPT = `
You are "Hirenest Intelligence", a professional Recruiter for HireNest Workforce. 
Your goal is to be helpful, human-like, and efficient. 

PERSONALITY:
- Tone: Professional, warm, and consultative.
- Brevity: Use short, readable messages suitable for WhatsApp.
- Language: English (Indian/Global business style).

TASKS:
1. If the user is a prospective candidate: Ask for their key skills and experience if not provided.
2. If the user mentions a resume: Express interest and ask them to share the PDF or a LinkedIn link.
3. If they want to interview: Check if they have a preferred time.
4. Always update the recruitment intent in your metadata output.

OUTPUT FORMAT:
Always return a JSON object:
{
  "reply": "The message to send to the candidate",
  "intent": "greeting | scheduling | lead_extraction | support",
  "extractedData": { "name": "string?", "skills": "string[]?", "yearsOfExperience": "number?" },
  "suggestedStatus": "lead | active | interviewing | noise"
}
`;

export async function sendWhatsAppMessage(to: string, content: string) {
  // Production integration check
  const config = await getWhatsAppConfig();
  if (!config) {
    console.warn("WhatsApp API not configured. Simulating outgoing message.");
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: content },
        }),
      }
    );
    return await response.json();
  } catch (err) {
    console.error("WhatsApp API Error:", err);
    throw err;
  }
}

export async function processIncomingWhatsApp(from: string, name: string, message: string) {
  // 1. Get or create chat thread
  let { data: chat } = await supabase
    .from('whatsapp_chats')
    .select('*')
    .eq('phone_number', from)
    .single();

  if (!chat) {
    const { data: newChat } = await supabase
      .from('whatsapp_chats')
      .insert({ phone_number: from, contact_name: name, last_message: message })
      .select()
      .single();
    chat = newChat;
  } else {
    await supabase.from('whatsapp_chats').update({ last_message: message, last_activity_at: new Date() }).eq('id', chat.id);
  }

  // 2. Persist incoming message
  await supabase.from('whatsapp_messages').insert({
    chat_id: chat.id,
    sender_type: 'contact',
    content: message
  });

  // 3. AI Processing if in active mode
  if (chat.ai_engagement_mode === 'active') {
    const prompt = `
      User ${name} says: "${message}"
      Context: This contact is currently a ${chat.status}.
      ${WHATSAPP_PROMPT}
    `;

    const text = await callAISecureProxy(prompt);
    const aiResponse = JSON.parse(text.replace(/```json|```/g, ''));

    // 4. Send AI Reply
    await sendWhatsAppMessage(from, aiResponse.reply);

    // 5. Persist AI Message
    await supabase.from('whatsapp_messages').insert({
      chat_id: chat.id,
      sender_type: 'ai',
      content: aiResponse.reply,
      ai_intent: aiResponse.intent
    });

    // 6. Update Chat Status/Metadata
    await supabase.from('whatsapp_chats').update({
      status: aiResponse.suggestedStatus,
      metadata: { ...chat.metadata, ...aiResponse.extractedData }
    }).eq('id', chat.id);

    // 7. If Lead extracted, optionally create candidate
    if (aiResponse.intent === 'lead_extraction' && aiResponse.extractedData.name) {
       await supabase.from('candidates').insert({
         name: aiResponse.extractedData.name,
         phone: from,
         skills: aiResponse.extractedData.skills || [],
         experience: String(aiResponse.extractedData.yearsOfExperience || 0),
         source: 'whatsapp_ai_lead',
         stage: 'sourced'
       });
    }
    
    return aiResponse;
  }

  return null;
}

async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  const { data } = await supabase.from('agent_tasks').select('payload').eq('type', 'whatsapp_config').single();
  return data?.payload || null;
}
