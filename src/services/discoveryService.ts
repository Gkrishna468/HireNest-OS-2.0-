import { supabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface DiscoveryLead {
  id: string;
  company_name: string;
  signal_type: 'hiring_surge' | 'content_engagement' | 'tech_shift';
  intent_score: number;
  decision_makers: { name: string; role: string; tenure: string }[];
  tool_stack: string[];
  recent_events: string[];
  status: string;
}

/**
 * DISCOVERY SERVICE: Implements the "Gojiberry + Claude" high-intent workflow.
 */
export async function discoverIntentLeads() {
  // 1. SIMULATE EXTERNAL SIGNALS (Gojiberry finding warm signals)
  const simulatedSignals = [
    { company: 'Acme Corp', signal: 'hiring_surge', description: 'Just posted 14 vacancies for Java Engineers on LinkedIn.' },
    { company: 'GlobalTech', signal: 'tech_shift', description: 'Moving from legacy Oracle to Cloud-Native PostgreSQL stack.' },
    { company: 'SwiftScale', signal: 'content_engagement', description: 'Found 3 VP Eng following your recent content on AI Talent.' }
  ];

  let foundCount = 0;

  for (const signal of simulatedSignals) {
    // 2. NEURAL FILTERING (The "Claude" step from your image)
    // Deep research into micro decision makers, tool stacks, and recent events.
    const researchModel = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const extraction = await researchModel.generateContent(`
      Act as a high-tier executive researcher. Research "${signal.company}" based on signal: "${signal.description}".
      
      Extract:
      1. Micro Decision Makers (Names/Roles/Tenure)
      2. Tool Stacks (Current vs Target)
      3. Recent organizational events (funding, launches)
      
      OUTPUT JSON:
      {
        "decision_makers": [{"name": "string", "role": "string", "tenure": "string"}],
        "tool_stack": ["string"],
        "recent_events": ["string"],
        "intent_score": number (0-100)
      }
    `);

    try {
      const data = JSON.parse(extraction.response.text().replace(/```json|```/g, ''));

      // 3. STORE IN NEURAL OS
      const { error } = await supabase.from('leads').insert({
        company_name: signal.company,
        signal_type: signal.signal,
        intent_score: data.intent_score || 75,
        decision_makers: data.decision_makers || [],
        tool_stack: data.tool_stack || [],
        recent_events: data.recent_events || [],
        status: 'warm',
        metadata: { source_signal: signal.description }
      });

      if (!error) foundCount++;

      // LOG TO INTELLIGENCE CENTER STREAM
      await supabase.from('agent_logs').insert({
        type: 'discovery',
        level: 'info',
        message: `[NEURAL DISCOVERY] High-Intent Match: ${signal.company} (${data.intent_score}%). Researching decision makers...`,
        metadata: { company: signal.company, score: data.intent_score }
      });

    } catch (e) {
      console.error("Discovery extraction failed", e);
    }
  }

  return { success: true, count: foundCount };
}

export async function getWarmLeads() {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('intent_score', { ascending: false });
  return data || [];
}
