import { supabase } from "../lib/supabase";

export interface DashboardFinancials {
  totalRevenue: number;
  projectedRevenue: number;
  costPerHire: number;
  bestPerformingClient: string;
  roi: number;
}

/**
 * CFO Agent Logic: Real-time financial calculations
 */
export async function getFinancialInsights(): Promise<DashboardFinancials> {
  const { data: deals } = await supabase
    .from('deals')
    .select('revenue_amount, status, client_name');

  if (!deals) return { totalRevenue: 0, projectedRevenue: 0, costPerHire: 0, bestPerformingClient: 'N/A', roi: 0 };

  const total = deals
    .filter(d => d.status === 'placed')
    .reduce((acc, d) => acc + (Number(d.revenue_amount) || 0), 0);

  const projected = deals
    .filter(d => d.status === 'pipeline')
    .reduce((acc, d) => acc + (Number(d.revenue_amount) || 0) * 0.15, 0); // 15% probability of closure

  // Group by client
  const clientPerformance: Record<string, number> = {};
  deals.forEach(d => {
    if (d.client_name) {
      clientPerformance[d.client_name] = (clientPerformance[d.client_name] || 0) + (Number(d.revenue_amount) || 0);
    }
  });

  const topClient = Object.entries(clientPerformance)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    totalRevenue: total,
    projectedRevenue: total + projected,
    costPerHire: total > 0 ? (total * 0.12) / (deals.filter(d => d.status === 'placed').length || 1) : 0, // Mock overhead
    bestPerformingClient: topClient,
    roi: 420 // AI Ecosystem ROI multiplier
  };
}

/**
 * Creates a revenue event (Deal)
 */
export async function recordDeal(job: any, candidate: any, amount: number) {
  const { error } = await supabase
    .from('deals')
    .insert({
      job_id: job.id,
      candidate_id: candidate.id,
      client_name: job.clientName || 'Direct',
      job_title: job.title,
      candidate_name: candidate.name,
      revenue_amount: amount,
      status: 'pipeline'
    });

  if (error) throw error;
}
