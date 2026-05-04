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

// 1. INGRESS AGENT: Fetches the real data from Gmail using historyId
async function handleGmailIngress(jobId: string, payload: any) {
  const { email, historyId } = payload;
  
  await updateJobStatus(jobId, { status: 'processing', message: 'Synchronizing history...' });

  try {
    // 1. Fetch Profile for History Context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      console.warn(`[Ingress] Profile not found for ${email}. Creating a guest profile or returning.`);
      // If profile missing, we might want to return or create one
      // But for now let's just abort to avoid null pointer
      throw new Error(`Profile not found for ${email}`);
    }

    // 2. Get Access Token (assuming stored in metadata)
    // In a real production app, we would use a refresh token here.
    // For this environment, we retrieve the token captured during login.
    
    // FETCHING VIA GOOGLE API
    const { google } = await import("googleapis");
    const auth = new google.auth.OAuth2();
    // We need a valid token. In a real app, you'd store refresh tokens in a secure table.
    // For this context, we'll try to find any recently active token or return error.
    const token = profile.metadata?.google_token; 
    if (!token) throw new Error("GMAIL_TOKEN_MISSING: User must re-authenticate.");

    auth.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth });

    const historyRes = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: profile.metadata?.history_id || historyId
    });

    const records = historyRes.data.history || [];
    let processedCount = 0;

    for (const record of records) {
      if (record.messagesAdded) {
        for (const msgEntry of record.messagesAdded) {
          if (!msgEntry.message?.id) continue;

          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: msgEntry.message.id,
            format: 'full'
          });

          const headers = msg.data.payload?.headers || [];
          const emailData = {
            id: msg.data.id,
            threadId: msg.data.threadId,
            subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
            from: headers.find(h => h.name === 'From')?.value || 'Unknown',
            snippet: msg.data.snippet || '',
            internalDate: msg.data.internalDate
          };

          // Route each email to classification
          await enqueueJob(JobType.AI_CLASSIFY, emailData);
          processedCount++;
        }
      }
    }

    // Update profile historyId
    await supabase.from('profiles').update({
      metadata: { ...profile.metadata, history_id: historyId }
    }).eq('id', profile.id);

    await updateJobStatus(jobId, { status: 'success', message: `Processed ${processedCount} new messages.` });

  } catch (err: any) {
    console.error("[Ingress] Sync Failed:", err);
    await updateJobStatus(jobId, { status: 'failed', message: err.message });
  }
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
        name: action.payload.name,
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

