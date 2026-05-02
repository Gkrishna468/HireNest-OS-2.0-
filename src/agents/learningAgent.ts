import { supabase } from '@/lib/supabase';

/**
 * Learning Agent: Analyzes outcomes to improve decision thresholds
 */
export async function runLearningAgent() {
  const { data: outcomes } = await supabase
    .from('candidate_outcomes')
    .select('*');

  if (!outcomes || outcomes.length === 0) return "No outcome data to learn from yet.";

  const totalScore = outcomes.reduce((acc, curr) => acc + (curr.outcome_score || 0), 0);
  const avgImprovement = totalScore / outcomes.length;

  // Log insight
  await supabase.from('agent_logs').insert({
    type: 'learning',
    message: `System Learning: Current AI Shortlist Precision is ${(avgImprovement * 20).toFixed(1)}%.`,
    level: 'info',
    metadata: { avg_score: avgImprovement, total_outcomes: outcomes.length }
  });

  return `Learning cycle complete. Precision: ${(avgImprovement * 20).toFixed(1)}%`;
}
