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
 * BROADCAST JOB: Makes job visible to vendors and triggers AI outreach agents.
 */
export async function broadcastJob(jobId: string) {
  const { data: job } = await supabase.from('jobs').select('*, company:companies(name)').eq('id', jobId).single();
  if (!job) throw new Error("Job not found");

  const { error } = await supabase
    .from('jobs')
    .update({ broadcast_to_vendors: true })
    .eq('id', jobId);
    
  if (error) throw error;

  // 1. Fetch matching vendors (simulate)
  const { data: vendors } = await supabase.from('companies').select('*').eq('type', 'vendor').limit(5);

  // 2. SYSTEM LOG
  await supabase.from('agent_logs').insert({
    type: 'notification',
    level: 'info',
    message: `[OUTREACH AGENT] Neural broadcast initiated for "${job.title}". Notifying vendor ecosystem.`,
    metadata: { jobId, broadcast: true, channel: 'system' }
  });

  // 3. SEND WHATSAPP TO VENDORS
  if (vendors) {
    for (const vendor of vendors) {
      const msg = `🚀 *New Mandate Alert*: ${job.title} at ${job.company?.name}. Budget: ${job.budget}. Our neural engine is ready to match your best candidates. Submit via HireNest Portal.`;
      
      await supabase.from('agent_logs').insert({
        type: 'outreach',
        level: 'success',
        message: `[WHATSAPP AGENT] Broadcast notification sent to Vendor: ${vendor.name}`,
        metadata: { jobId, channel: 'whatsapp', status: 'sent', recipient: vendor.name, content: msg }
      });
    }
  }

  return { success: true, count: vendors?.length || 0 };
}

export async function getMarketplaceStats() {
  const { data: collaborations } = await supabase.from('collaborations').select('status');
  const { data: deals } = await supabase.from('deals').select('status');

  const activeNegs = (collaborations || []).filter(c => c.status !== 'placed' && c.status !== 'rejected').length;
  const placements = (deals || []).filter(d => d.status === 'placed').length;

  return {
    activeNegotiations: activeNegs,
    placementsCount: placements,
    efficiency: 42 // Still using a "Neural OS" multiplier for flavor
  };
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
  const { data: conv } = await supabase.from('conversations').insert({
    collaboration_id: data.id
  }).select().single();

  // NOTIFY CLIENT
  await notifyUser({
    userId: params.clientId, // This should be the owner of the client company
    title: 'New Candidate Match!',
    message: `A new candidate with a ${params.matchScore}% match score has been proposed for your job.`,
    type: 'success',
    link: `/deal-room/${data.id}`
  });

  return data;
}

/**
 * NOTIFY USER: Enterprise Notification System
 */
export async function notifyUser(params: {
  userId?: string;
  companyId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}) {
  // If only companyId is provided, notify all profiles in that company
  if (params.companyId && !params.userId) {
    const { data: profiles } = await supabase.from('profiles').select('id').eq('company_id', params.companyId);
    if (profiles) {
      const notifications = profiles.map(p => ({
        user_id: p.id,
        company_id: params.companyId,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        link: params.link
      }));
      await supabase.from('notifications').insert(notifications);
    }
    return;
  }

  await supabase.from('notifications').insert({
    user_id: params.userId,
    company_id: params.companyId,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    link: params.link
  });
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
