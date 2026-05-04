import { supabase } from '@/lib/supabase';
import { JobType, updateJobStatus } from './queueService';
import { runUnifiedBrain } from './brainService';

export enum WorkflowTrigger {
  EMAIL_RECEIVED = 'email_received',
  CANDIDATE_INGESTED = 'candidate_ingested',
  JOB_CREATED = 'job_created',
  MANUAL = 'manual'
}

export async function processWorkflowStep(jobId: string, type: JobType, payload: any) {
  console.log(`[Nestor Engine] Brain Activation: ${type}`, payload);

  try {
    switch (type) {
      case JobType.GMAIL_EVENT:
        await handleGmailIngress(jobId, payload);
        break;
      case JobType.AI_CLASSIFY:
      case JobType.AI_EXTRACT:
      case JobType.AI_DECIDE:
        // Unified Brain handles these in one pass
        await updateJobStatus(jobId, { status: 'processing', message: 'Core Brain engaging...' });
        const result = await runUnifiedBrain(payload.snippet || payload.text || 'No content', 'email', payload.from);
        await updateJobStatus(jobId, { status: 'success', message: 'Brain processing complete.', decision: result });
        break;
      default:
        await updateJobStatus(jobId, { status: 'success', message: 'Step bypassed.' });
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!profile) throw new Error(`Profile not found for ${email}`);

    const { google } = await import("googleapis");
    const auth = new google.auth.OAuth2();
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

          // Trigger Brain Directly
          await runUnifiedBrain(emailData.snippet, 'email', emailData.from);
          processedCount++;
        }
      }
    }

    await supabase.from('profiles').update({
      metadata: { ...profile.metadata, history_id: historyId }
    }).eq('id', profile.id);

    await updateJobStatus(jobId, { status: 'success', message: `Brain autonomously processed ${processedCount} new messages.` });

  } catch (err: any) {
    console.error("[Ingress] Sync Failed:", err);
    await updateJobStatus(jobId, { status: 'failed', message: err.message });
  }
}

