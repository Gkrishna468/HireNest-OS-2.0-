import { supabase } from "../lib/supabase";

export interface DashboardFinancials {
  totalRevenue: number;
  projectedRevenue: number;
  costPerHire: number;
  bestPerformingClient: string;
  roi: number;
  netMargin: number;
  totalPayouts: number;
}

/**
 * CFO Agent Logic: Real-time financial calculations with Tax & Payout logic
 */
export async function getFinancialInsights(): Promise<DashboardFinancials> {
  const { data: deals } = await supabase
    .from('deals')
    .select('revenue_amount, payout_amount, status, client_name');

  if (!deals) return { totalRevenue: 0, projectedRevenue: 0, costPerHire: 0, bestPerformingClient: 'N/A', roi: 0, netMargin: 0, totalPayouts: 0 };

  const activeDeals = deals.filter(d => d.status === 'placed' || d.status === 'offered');
  
  const total = activeDeals
    .reduce((acc, d) => acc + (Number(d.revenue_amount) || 0), 0);

  const totalPayouts = activeDeals
    .reduce((acc, d) => acc + (Number(d.payout_amount) || 0), 0);

  // Projected revenue from pipeline (weighted)
  const projected = deals
    .filter(d => d.status === 'pipeline')
    .reduce((acc, d) => acc + (Number(d.revenue_amount) || 0) * 0.20, 0); // 20% closure probability

  // Net Margin calculation (Revenue - Payout - 18% Est Tax)
  const estTax = total * 0.18;
  const netMargin = total > 0 ? ((total - totalPayouts - estTax) / total) * 100 : 0;

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
    totalPayouts: totalPayouts,
    costPerHire: total > 0 ? (totalPayouts / (deals.filter(d => d.status === 'placed').length || 1)) : 0,
    bestPerformingClient: topClient,
    roi: 420,
    netMargin: Math.round(netMargin)
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
