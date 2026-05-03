import { supabase } from './supabase';

export type AgentType = 'scout' | 'engager' | 'closer';

export interface BillingEvent {
  agent_type: AgentType;
  action_type: string;
  value_generated: number;
  metadata?: any;
}

export async function logBillingEvent(event: BillingEvent) {
  try {
    const { error } = await supabase.from('billing_events').insert({
      agent_type: event.agent_type,
      action_type: event.action_type,
      value_generated: event.value_generated,
      metadata: event.metadata || {},
      status: 'pending',
      is_billable: true
    });

    if (error) throw error;
    
    // Also log to agent_logs for visibility
    await supabase.from('agent_logs').insert({
      agent_name: `${event.agent_type.toUpperCase()} Agent`,
      status: 'success',
      action: `REVENUE_EVENT: ${event.action_type}`,
      result: { value: event.value_generated },
      message: `[BILLING] Generated $${event.value_generated} in automation value via ${event.action_type}`,
      type: 'system',
      level: 'success'
    });

  } catch (err) {
    console.error('Failed to log billing event:', err);
  }
}

export const PRICING_LOGIC = {
  RESUME_PARSED: 5.00,
  LEAD_DISCOVERED: 10.00,
  MATCH_FOUND: 25.00,
  MEETING_BOOKED: 150.00,
  PLACEMENT_IDENTIFIED: 5000.00
};
