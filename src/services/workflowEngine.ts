import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export enum WorkflowTrigger {
  EMAIL_RECEIVED = 'email_received',
  CANDIDATE_INGESTED = 'candidate_ingested',
  JOB_CREATED = 'job_created',
  MANUAL = 'manual'
}

export interface WorkflowAction {
  type: string;
  payload: any;
}

export async function handleWorkflowTrigger(data: { type: string; data: any }) {
  await executeWorkflow(data.type as WorkflowTrigger, data.data);
}

export async function executeWorkflow(trigger: WorkflowTrigger, data: any) {
  console.log(`[WorkflowEngine] Triggered: ${trigger}`, data);
  const startTime = Date.now();
  
  // 1. Create Initial Agent Log
  const { data: logEntry, error: logError } = await supabase
    .from('agent_logs')
    .insert({
      type: 'workflow',
      agent_name: 'Nestor Autonomous Engine',
      message: `Initiating ${trigger} workflow chain...`,
      status: 'pending',
      input: { trigger, data },
      level: 'info',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (logError) {
    console.error("Workflow logging error:", logError);
    // Fallback to non-logged execution if metadata table is missing
  }

  try {
    let resultActions: WorkflowAction[] = [];

    // 2. AI Decision Layer (Autonomous)
    if (trigger === WorkflowTrigger.EMAIL_RECEIVED) {
      resultActions = await handleEmailDecision(data);
    }

    // 3. Execution Layer
    for (const action of resultActions) {
      await performAction(action, data, logEntry?.id);
    }

    // 4. Update Log with Results
    if (logEntry) {
      await supabase
        .from('agent_logs')
        .update({ 
          status: 'success', 
          decision: { actions_found: resultActions.length, actions: resultActions },
          execution_time_ms: Date.now() - startTime,
          message: `Autonomous workflow completed. Executed ${resultActions.length} steps.`
        })
        .eq('id', logEntry.id);
    }

    // 5. Log Revenue Intelligence
    await logRevenueAction(trigger, resultActions.length);

  } catch (err: any) {
    console.error("Workflow Execution Failed:", err);
    if (logEntry) {
      await supabase
        .from('agent_logs')
        .update({ 
          status: 'error', 
          level: 'error',
          message: `Workflow failed: ${err.message}`,
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', logEntry.id);
    }
  }
}

async function handleEmailDecision(emailData: any): Promise<WorkflowAction[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    You are Nestor v3, the HireNest Autonomous Intelligence.
    Analyze this inbound signal:
    Subject: ${emailData.subject}
    From: ${emailData.from}
    Snippet: ${emailData.snippet}

    Your goal is to extract high-fidelity intent and map out the recruitment workflow.
    
    Classification Tiers:
    1. candidate_application: Person applying for a job.
    2. client_inquiry: Potential client asking for services or fees.
    3. collaboration_request: Vendor or partner reaching out.
    4. junk: Spam, automated notifications, or irrelevant.

    Extraction Requirements:
    - Candidate Name, Skills (Top 3), Role Title.
    - Urgency Level (High/Med/Low).
    - Sentiment (Positive/Neutral/Aggressive).

    Output Schema (JSON Array of Actions):
    - create_candidate: { name, skills, role, experience_summary }
    - create_deal: { company, value_estimate, urgency }
    - send_auto_reply: { template_name, priority }
    - notify_team: { channel, alert_level }

    RESPONSE RULES:
    - Return ONLY valid JSON.
    - If intent is 'junk', return [].
    - Be aggressive in identifying leads.

    [Actions JSON Array Only]:
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.match(/\[.*\]/s)?.[0] || '[]';
    const actions = JSON.parse(jsonStr);
    
    // Safety check: ensure 'notify_team' is added for high-value leads
    const isLead = text.toLowerCase().includes('client_inquiry');
    if (isLead && !actions.some((a: any) => a.type === 'notify_team')) {
      actions.push({ type: 'notify_team', payload: { channel: 'deal_room', alert_level: 'high' } });
    }

    return actions;
  } catch (err) {
    console.error("AI Decision failed:", err);
    return [];
  }
}

async function performAction(action: WorkflowAction, triggerData: any, logId?: string) {
  console.log(`[WorkflowEngine] Executing Action: ${action.type}`, action.payload);
  
  // Log sub-action start
  await supabase.from('agent_logs').insert({
    type: 'workflow',
    agent_name: 'Nestor Sub-Agent',
    message: `Executing sub-action: ${action.type}`,
    level: 'info',
    input: action.payload,
    status: 'success'
  });

  switch (action.type) {
    case 'create_candidate':
      await supabase.from('candidates').insert({
        full_name: action.payload.name || triggerData.from.split('<')[0].trim(),
        email: triggerData.from.match(/<(.+)>/)?.[1] || triggerData.from,
        source: 'Autonomous Ingestion',
        status: 'new',
        experience: action.payload.experience_summary || triggerData.snippet,
        metadata: { extracted_skills: action.payload.skills }
      });
      break;
    case 'create_deal':
      await supabase.from('deals').insert({
        title: `Lead from ${action.payload.company || triggerData.from}`,
        client_name: action.payload.company || 'Unknown Enterprise',
        value: action.payload.value_estimate || 0,
        status: 'prospecting',
        urgency: action.payload.urgency || 'medium'
      });
      break;
    case 'notify_team':
      console.log(`[ALERT] ${action.payload.alert_level.toUpperCase()} Priority: ${action.payload.channel}`);
      break;
    default:
      console.log("Unknown action type:", action.type);
  }
}

async function logRevenueAction(trigger: string, steps: number) {
  const cost = steps * 0.08; // Real Gemini 1.5 Flash pricing proxy
  const value = steps > 0 ? (steps * 12.50) : 0; // Estimated value of automated recruiter tasks

  await supabase.from('usage_logs').insert({
    action_type: `Autonomous Engine: ${trigger}`,
    units: steps,
    estimated_cost: cost,
    revenue_delta: value,
    status: 'success',
    created_at: new Date().toISOString()
  });
}
