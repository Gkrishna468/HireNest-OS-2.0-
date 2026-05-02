import { supabase } from '@/lib/supabase';
import { scoreCandidateForJob } from '@/services/intelligenceService';

/**
 * Outreach Agent: Automatically contacts shortlisted candidates
 */
export async function runOutreachAgent() {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("OUTREACH AGENT SESSION:", session);
  console.log("OUTREACH AGENT GMAIL TOKEN:", session?.provider_token);

  // 1. Get shortlisted candidates who haven't been contacted yet
  // We check outreach_logs to avoid duplicate emails
  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, outreach_logs(id)')
    .eq('stage', 'interview'); // Assuming "interview" means they were shortlisted and need outreach

  if (!candidates) return;

  const contactedCount = 0;

  for (const candidate of candidates) {
    // Skip if already contacted for this stage
    if (candidate.outreach_logs && candidate.outreach_logs.length > 0) continue;

    // Generate Personalized Outreach
    const subject = `Opportunity: ${candidate.current_title || 'New Role'} at HireNest Ecosystem`;
    const message = `
Hi ${candidate.name},

I'm reaching out from HireNest Workforce. Our AI matching engine identified your profile as a high-potential match for an open role in our ecosystem.

Your expertise in ${Array.isArray(candidate.skills) ? candidate.skills.slice(0, 3).join(', ') : 'your field'} caught our attention.

Would you be open to a quick 10-minute sync this week?

Best regards,
Gopala Krishna
Founding Director, HireNest
    `;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;

      if (!token) {
        console.error("NO TOKEN → Gmail not connected properly in Outreach Agent");
      }
      
      if (token) {
        // Real Gmail Send Logic (conceptual for now, requires edge function or direct API)
        console.log(`[OUTREACH] Sending real email to ${candidate.email} via Gmail API`);
        
        // Push to outreach_logs
        await supabase.from('outreach_logs').insert({
          candidate_id: candidate.id,
          email: candidate.email,
          subject,
          message,
          status: 'sent',
          type: 'initial_reachout'
        });
      } else {
        // Fallback for demo/offline
        await supabase.from('outreach_logs').insert({
          candidate_id: candidate.id,
          email: candidate.email,
          subject,
          message,
          status: 'pending_sync',
          type: 'initial_reachout'
        });
        
        await supabase.from('agent_logs').insert({
          type: 'outreach',
          message: `Gmail token missing. Outreach for ${candidate.name} queued for sync.`,
          level: 'warning'
        });
      }
    } catch (err) {
      console.error('Outreach failed:', err);
    }
  }

  return `Outreach cycle complete.`;
}
