import { supabase } from '@/lib/supabase';

export enum JobType {
  GMAIL_EVENT = 'gmail_event',
  AI_CLASSIFY = 'ai_classify',
  AI_EXTRACT = 'ai_extract',
  AI_DECIDE = 'ai_decide',
  EXECUTE_ACTION = 'execute_action',
  GMAIL_REPLY = 'gmail_reply'
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface Job {
  id: string;
  type: JobType;
  payload: any;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_at: string;
  metadata?: any;
}

export async function enqueueJob(type: JobType, payload: any, delaySeconds = 0) {
  const runAt = new Date();
  runAt.setSeconds(runAt.getSeconds() + delaySeconds);

  const { data, error } = await supabase
    .from('agent_logs') // Re-using agent_logs as a job store for metadata visibility
    .insert({
      type: 'workflow',
      agent_name: 'Job Dispatcher',
      message: `Enqueued ${type} job`,
      status: 'pending',
      input: { type, payload, run_at: runAt.toISOString(), attempts: 0 },
      level: 'info'
    })
    .select()
    .single();

  if (error) console.error("[QueueService] Enqueue Error:", error);
  return data;
}

export async function fetchPendingJobs(limit = 5) {
  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'workflow')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function updateJobStatus(id: string, updates: Partial<Job> | any) {
  return await supabase
    .from('agent_logs')
    .update(updates)
    .eq('id', id);
}
