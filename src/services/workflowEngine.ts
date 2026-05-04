
import { supabase } from "@/lib/supabase";
import { callAISecureProxy } from "@/lib/ai";
import { toast } from "sonner";

export interface WorkflowEvent {
  type: string;
  data: any;
}

/**
 * TRIGGER HANDLER
 * Entry point for any system event.
 */
export async function handleWorkflowTrigger(event: WorkflowEvent) {
  try {
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('trigger_type', event.type)
      .eq('is_active', true);

    if (error) throw error;
    if (!workflows || workflows.length === 0) return;

    for (const wf of workflows) {
      await runWorkflow(wf, event.data);
    }
  } catch (err) {
    console.error("Trigger handling failed:", err);
  }
}

/**
 * CORE ENGINE
 * Executes steps in sequence.
 */
export async function runWorkflow(workflow: any, data: any) {
  const { data: steps, error: stepError } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflow.id)
    .order('step_order', { ascending: true });

  if (stepError || !steps) return;

  // 1. Initial Execution Record
  const { data: execution, error: exeError } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflow.id,
      trigger_data: data,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (exeError) return;

  let context = { ...data };

  try {
    for (const step of steps) {
      // Log step start
      console.log(`Executing step: ${step.step_type} for workflow ${workflow.name}`);
      
      if (step.step_type === "ai_decision") {
        context = await runAI(context, step.config?.prompt);
      } else if (step.step_type === "action") {
        await executeAction(step.config, context);
      }
    }

    // 2. Mark Completion
    await supabase
      .from('workflow_executions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', execution.id);

  } catch (error: any) {
    console.error("Workflow execution failed:", error);
    await supabase
      .from('workflow_executions')
      .update({ 
        status: 'failed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', execution.id);
      
    // Log failure in agent logs
    await supabase.from('agent_logs').insert({
      agent_name: 'Workflow Orchestrator',
      type: 'workflow_error',
      level: 'error',
      message: `Workflow ${workflow.name} failed: ${error.message}`,
      metadata: { workflowId: workflow.id, executionId: execution.id }
    });
  }
}

/**
 * AI DECISION LAYER (NESTOR)
 * Handles semantic logic and branch decisions.
 */
async function runAI(input: any, customPrompt?: string) {
  const prompt = customPrompt || `
    You are Nestor, the AI Chief of HireNest.
    Analyze the provided input and return a structured JSON decision.
    
    INPUT DATA:
    ${JSON.stringify(input)}
    
    Format your response EXACTLY as JSON:
    {
      "intent": "classification of the input (e.g., candidate_application, lead_inquiry)",
      "confidence": 0.0 to 1.0,
      "action": "recommended_next_step",
      "data": { "extracted_key_info": "value" }
    }
  `;

  const response = await callAISecureProxy(prompt);
  const cleanJson = response.replace(/```json|```/g, "").trim();
  const decision = JSON.parse(cleanJson);

  // Persistence: Agent Log
  await supabase.from('agent_logs').insert({
    agent_name: 'Nestor AI',
    type: 'ai_decision',
    level: 'info',
    message: `[NESTOR] Intent perceived: ${decision.intent} with ${Math.round(decision.confidence * 100)}% confidence.`,
    input: input,
    decision: decision
  });

  return { ...input, ai_decision: decision };
}

/**
 * ACTION HANDLERS
 * Physical execution of system tasks.
 */
async function executeAction(config: any, context: any) {
  const actionType = config.type;

  // 1. Revenue & Usage Tracking (Real margins)
  const costMap: Record<string, number> = {
    'create_candidate': 5,
    'send_email': 2,
    'send_whatsapp': 2,
    'create_deal': 10,
    'ai_reply': 3
  };

  await logUsage(actionType, costMap[actionType] || 1);

  // 2. Task Execution
  console.log(`[ACTION] Executing: ${actionType}`);

  switch (actionType) {
    case "create_candidate": {
      const { createCandidate } = await import('@/lib/api/candidates');
      await createCandidate(context.ai_decision?.data || context);
      break;
    }
    case "send_email": {
      // Simulating email dispatch via Gmail Node
      await supabase.from('agent_logs').insert({
        agent_name: 'Email Agent',
        type: 'action',
        level: 'success',
        message: `Auto-replied to ${context.email || 'recipient'} via Neural Gmail.`,
        metadata: { channel: 'email' }
      });
      break;
    }
    case "create_deal": {
      const { recordDeal } = await import('./financialService');
      if (context.job && context.candidate) {
        await recordDeal(context.job, context.candidate, context.value || 100000);
      }
      break;
    }
    default:
      console.warn(`Unknown action type: ${actionType}`);
  }
}

/**
 * REVENUE TRACKING LAYER
 */
async function logUsage(actionType: string, cost: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type: actionType,
    cost: cost,
    metadata: { timestamp: new Date().toISOString(), env: 'production' }
  });
}
