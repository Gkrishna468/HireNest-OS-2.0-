import { supabase } from "../lib/supabase";
import { Job, Company, Collaboration } from "../types";

/**
 * ADJUST BUDGET: Calculates HireNest margin based on client tier
 */
export async function calculateAdjustedBudget(companyId: string, budget: number): Promise<number> {
  const { data: profile } = await supabase
    .from('client_profiles')
    .select('margin_preferred')
    .eq('company_id', companyId)
    .single();

  const margin = profile?.margin_preferred || 20; // Default 20%
  return budget * (1 - margin / 100);
}

/**
 * BROADCAST JOB: Makes job visible to vendors
 */
export async function broadcastJob(jobId: string) {
  const { data: job } = await supabase.from('jobs').select('*, company:companies(name)').eq('id', jobId).single();

  const { error } = await supabase
    .from('jobs')
    .update({ broadcast_to_vendors: true })
    .eq('id', jobId);
    
  if (error) throw error;

  // SYSTEM LOG
  await supabase.from('agent_logs').insert({
    type: 'notification',
    level: 'info',
    message: `[OUTREACH AGENT] Job broadcasted to marketplace: "${job?.title}". Initiating vendor-partner awareness sequence.`,
    metadata: { jobId, broadcast: true, channel: 'system' }
  });

  // SIMULATE OUTREACH IN Intelligence Center
  await supabase.from('agent_logs').insert({
    type: 'outreach',
    level: 'success',
    message: `[WHATSAPP AGENT] Sent notification to 12 Top-Tier Vendors regarding new requisition: ${job?.title}. AI logic predicts 3-5 immediate submissions.`,
    metadata: { jobId, channel: 'whatsapp', status: 'sent', recipientCount: 12 }
  });
}

/**
 * PROPOSE COLLABORATION: AI or Vendor initiates a match
 */
export async function proposeCollaboration(params: {
  jobId: string;
  candidateId: string;
  vendorId: string;
  clientId: string;
  matchScore: number;
}) {
  const { data, error } = await supabase
    .from('collaborations')
    .insert({
      job_id: params.jobId,
      candidate_id: params.candidateId,
      vendor_id: params.vendorId,
      client_id: params.clientId,
      match_score: params.matchScore,
      status: 'proposed'
    })
    .select()
    .single();

  if (error) throw error;

  // Create conversation for this collaboration
  await supabase.from('conversations').insert({
    collaboration_id: data.id
  });

  return data;
}

/**
 * SEND MESSAGE: Group communication
 */
export async function sendMessage(conversationId: string, content: string, senderId: string, isAi: boolean = false) {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      is_ai_assisted: isAi
    });

  if (error) throw error;

  await supabase
    .from('collaborations')
    .update({ last_activity_at: new Date().toISOString() })
    .match({ id: (await supabase.from('conversations').select('collaboration_id').eq('id', conversationId).single()).data?.collaboration_id });
}
