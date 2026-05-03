import { supabase } from '@/lib/supabase';
import { logBillingEvent, PRICING_LOGIC } from '@/lib/billing';

export async function initiateAutonomousClosing(candidateId: string, jobId: string) {
  try {
    // 1. Fetch details
    const { data: candidate } = await supabase.from('candidates').select('*').eq('id', candidateId).single();
    const { data: job } = await supabase.from('jobs').select('*, clients(*)').eq('id', jobId).single();

    if (!candidate || !job) throw new Error("Closing data missing");

    // 2. Log closing sequence start
    await supabase.from('agent_logs').insert({
      agent_name: 'Closer Agent',
      status: 'success',
      action: 'INITIATING_CLOSING_SEQUENCE',
      message: `[CLOSER] Target candidate ${candidate.name} is showing high-intent signals for ${job.title}.`,
      metadata: { candidateId, jobId }
    });

    // 3. Automated Follow-up via WhatsApp (Simulation)
    await supabase.from('agent_logs').insert({
      agent_name: 'Closer Agent',
      status: 'success',
      action: 'WHATSAPP_FOLLOWUP',
      message: `[OUTREACH] Auto-sent closing nudge to ${candidate.name}: "Hey ${candidate.name.split(' ')[0]}, the hiring manager at ${job.clients?.name || 'the client'} was very impressed. Are you available for a final sync tomorrow?"`,
      metadata: { channel: 'whatsapp', recipient: candidate.phone }
    });

    // 4. Log high-value billing event
    await logBillingEvent({
      agent_type: 'closer',
      action_type: 'CLOSING_SEQUENCE_ACTIVATED',
      value_generated: PRICING_LOGIC.MEETING_BOOKED,
      metadata: { candidateId, jobId }
    });

    return { success: true, message: "Closing sequence engaged." };
  } catch (err) {
    console.error("Closing sequence failed:", err);
    return { success: false, error: err };
  }
}
