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
    You are Nestor, the HireNest Autonomous Agent.
    Analyze this inbound email:
    Subject: ${emailData.subject}
    From: ${emailData.from}
    Content: ${emailData.snippet}

    Decide the intent and necessary actions.
    If it's a resume or job application, 'create_candidate' and 'score_profile' are needed.
    If it's a client looking to hire, 'create_lead' is needed.
    If it's junk, return no actions.

    Return ONLY a JSON array of actions:
    [{"type": "create_candidate", "payload": {...}}, {"type": "send_auto_reply", "payload": {"template": "ack"}}]
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.match(/\[.*\]/s)?.[0] || '[]';
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("AI Decision failed:", err);
    return [];
  }
}

async function performAction(action: WorkflowAction, triggerData: any, executionId: string) {
  console.log(`[WorkflowEngine] Executing Action: ${action.type}`, action.payload);
  
  switch (action.type) {
    case 'create_candidate':
      await supabase.from('candidates').insert({
        full_name: action.payload.name || triggerData.from.split('<')[0].trim(),
        email: triggerData.sender_email || triggerData.from_email,
        source: 'Gmail Ingestion',
        status: 'new',
        experience: action.payload.summary || triggerData.snippet
      });
      break;
    case 'send_auto_reply':
      // Here you would call Gmail API to send
      console.log("Sending AI Auto-Reply...");
      break;
    default:
      console.log("Unknown action type:", action.type);
  }
}

async function logRevenueAction(trigger: string, steps: number) {
  const cost = steps * 0.15; // Simulated GPU cost
  const value = 25.00; // Simulated automation value saved

  await supabase.from('usage_logs').insert({
    action_type: `Workflow: ${trigger}`,
    units: steps,
    estimated_cost: cost,
    revenue_delta: value,
    created_at: new Date().toISOString()
  });
}
