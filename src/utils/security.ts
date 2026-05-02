import { supabase } from '@/lib/supabase';

export enum SecurityEvent {
  AUTH_FAILURE = 'AUTH_FAILURE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ABUSE_DETECTED = 'ABUSE_DETECTED',
  DATA_EXPORT = 'DATA_EXPORT',
  AI_PROXY_ERROR = 'AI_PROXY_ERROR'
}

/**
 * Logs security-sensitive events to the database for auditing.
 */
export async function logSecurityEvent(type: SecurityEvent, message: string, metadata: any = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('agent_logs').insert({
      type: 'security',
      level: 'warning',
      message: `[SECURITY] ${type}: ${message}`,
      metadata: {
        ...metadata,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });

    console.warn(`🔒 Security Audit Logged: ${type} - ${message}`);
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}
