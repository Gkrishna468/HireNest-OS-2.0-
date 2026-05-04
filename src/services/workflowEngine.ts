import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JobType, enqueueJob, updateJobStatus } from './queueService';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export enum WorkflowTrigger {
  EMAIL_RECEIVED = 'email_received',
  CANDIDATE_INGESTED = 'candidate_ingested',
  JOB_CREATED = 'job_created',
  MANUAL = 'manual'
}

// NESTOR v4: Specialized Agent Definitions
const AGENT_CONFIG = {
  CLASSIFIER: { name: 'Nestor Classifier', model: 'gemini-1.5-flash' },
  EXTRACTOR: { name: 'Nestor Extractor', model: 'gemini-1.5-flash' },
  DECISION: { name: 'Nestor Decision Maker', model: 'gemini-1.5-flash' },
  EXECUTOR: { name: 'Nestor Execution Agent', model: 'gemini-1.5-flash' }
};

export async function processWorkflowStep(jobId: string, type: JobType, payload: any) {
  const startTime = Date.now();
  console.log(`[Nestor Engine] Agent Activation: ${type}`, payload);

  try {
    switch (type) {
      case JobType.GMAIL_EVENT:
        await handleGmailIngress(jobId, payload);
        break;
      case JobType.AI_CLASSIFY:
        await agentClassify(jobId, payload);
        break;
      case JobType.AI_EXTRACT:
        await agentExtract(jobId, payload);
        break;
      case JobType.AI_DECIDE:
        await agentDecide(jobId, payload);
        break;
      case JobType.EXECUTE_ACTION:
        await agentExecute(jobId, payload);
        break;
    }
  } catch (err: any) {
    console.error(`[Nestor Engine] Error in ${type}:`, err);
    await updateJobStatus(jobId, { status: 'error', message: err.message });
  }
}

// 1. INGRESS AGENT: Fetches the data and kicks off classification
async function handleGmailIngress(jobId: string, emailData: any) {
  // Check Idempotency
  const { data: existing } = await supabase
    .from('agent_logs')
    .select('id')
    .eq('input->message_id', emailData.id)
    .eq('status', 'success')
    .maybeSingle();

  if (existing && existing.id !== jobId) {
    await updateJobStatus(jobId, { status: 'success', message: 'Deduplicated: Already processed.' });
    return;
  }

  await updateJobStatus(jobId, { status: 'processing', message: 'Signal Ingested. Routing to Classifier...' });
  await enqueueJob(JobType.AI_CLASSIFY, emailData);
  await updateJobStatus(jobId, { status: 'success' });
}

// 2. CLASSIFIER AGENT: Determines Intent
async function agentClassify(jobId: string, emailData: any) {
  const model = genAI.getGenerativeModel({ model: AGENT_CONFIG.CLASSIFIER.model });
  
  const prompt = `Classify this email intent: 
    Subject: ${emailData.subject}
    Content: ${emailData.snippet}
    
    Choose ONE: [candidate_application, client_inquiry, partner_outreach, junk]
    Return ONLY the category name.`;

  const result = await model.generateContent(prompt);
  const category = result.response.text().trim().toLowerCase();

  if (category === 'junk') {
    await updateJobStatus(jobId, { status: 'success', message: 'Ignored: Classified as Junk.' });
    return;
  }

  await updateJobStatus(jobId, { status: 'success', decision: { category } });
  await enqueueJob(JobType.AI_EXTRACT, { ...emailData, category });
}

// 3. EXTRACTOR AGENT: Structured Data Extraction
async function agentExtract(jobId: string, data: any) {
  const model = genAI.getGenerativeModel({ model: AGENT_CONFIG.EXTRACTOR.model });
  
  const prompt = `Extract entities from this ${data.category}:
    Content: ${data.snippet}
    Return JSON: { "name": "", "skills": [], "company": "", "urgency": "low|med|high" }`;

  const result = await model.generateContent(prompt);
  const entities = JSON.parse(result.response.text().match(/\{.*\}/s)?.[0] || '{}');

  await updateJobStatus(jobId, { status: 'success', decision: { entities } });
  await enqueueJob(JobType.AI_DECIDE, { ...data, entities });
}

// 4. DECISION AGENT: Mapping Intents to Actions
async function agentDecide(jobId: string, data: any) {
  const actions = [];
  
  if (data.category === 'candidate_application') {
    actions.push({ type: 'create_candidate', payload: data.entities });
    actions.push({ type: 'notify_team', payload: { message: `New applicant: ${data.entities.name}` } });
  } else if (data.category === 'client_inquiry') {
    actions.push({ type: 'create_deal', payload: data.entities });
  }

  for (const action of actions) {
    await enqueueJob(JobType.EXECUTE_ACTION, { action, original_data: data });
  }

  await updateJobStatus(jobId, { status: 'success', message: `Planned ${actions.length} actions.` });
}

// 5. EXECUTION AGENT: Performing the CRM updates
async function agentExecute(jobId: string, payload: any) {
  const { action, original_data } = payload;
  
  switch (action.type) {
    case 'create_candidate':
      await supabase.from('candidates').insert({
        full_name: action.payload.name,
        email: original_data.from.match(/<(.+)>/)?.[1] || original_data.from,
        source: 'Nestor Ingestion',
        experience: action.payload.experience_summary || original_data.snippet
      });
      break;
    case 'create_deal':
      await supabase.from('deals').insert({
        title: `Client Lead: ${action.payload.company}`,
        client_name: action.payload.company,
        status: 'prospecting'
      });
      break;
  }

  await updateJobStatus(jobId, { status: 'success', message: `Executed ${action.type}` });
  
  // Track Revenue Savings
  await supabase.from('usage_logs').insert({
    action_type: `Agent: ${action.type}`,
    units: 1,
    estimated_cost: 0.05,
    revenue_delta: 15.00
  });
}

