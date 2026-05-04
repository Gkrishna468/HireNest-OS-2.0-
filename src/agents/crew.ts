import { runDecisionAgent } from '@/services/intelligenceService';
import { runOutreachAgent } from './outreachAgent';
import { runReplyAgent } from './replyAgent';
import { runLearningAgent } from './learningAgent';
import { supabase } from '@/lib/supabase';

/**
 * Crew: The multi-agent orchestrator
 */
export async function runCrew() {
  const startTime = Date.now();
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log("CREW SESSION:", session);
  console.log("CREW GMAIL TOKEN:", session?.provider_token);

  await supabase.from('agent_logs').insert({
    type: 'crew',
    message: 'Autonomous Crew mission initiated.',
    level: 'info',
    status: 'pending'
  });

  try {
    // 1. Decisions (Matching & Shortlisting)
    const decisionRes = await runDecisionAgent();
    
    // 2. Outreach (Communicating)
    const outreachRes = await runOutreachAgent();
    
    // 3. Replies (Listening)
    const replyRes = await runReplyAgent();
    
    // 4. Learning (Improving)
    const learningRes = await runLearningAgent();

    const duration = Date.now() - startTime;
    
    await supabase.from('agent_logs').insert({
      type: 'crew',
      message: `Mission Complete. Decisions: ${decisionRes} | Responses: ${replyRes} | Knowledge: ${learningRes}`,
      level: 'success',
      status: 'success',
      metadata: { duration_ms: duration }
    });

    return "All agents successfully completed their cycles.";
  } catch (err: any) {
    console.error('Crew Failure:', err);
    await supabase.from('agent_logs').insert({
      type: 'crew',
      message: `Mission aborted: ${err.message}`,
      level: 'error',
      status: 'failed'
    });
    throw err;
  }
}
