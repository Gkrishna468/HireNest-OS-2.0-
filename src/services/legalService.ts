import { supabase } from "@/lib/supabase";
import { notifyUser } from "./marketplaceService";

/**
 * LEGAL SERVICE: Enterprise Agreement Management
 * Handles MSA (Master Service Agreement) and NDA (Non-Disclosure Agreement) workflows.
 */

export interface AgreementParams {
  dealId: string;
  recipientEmail: string;
  recipientName: string;
  type: 'MSA' | 'NDA';
}

export async function sendAgreement(params: AgreementParams) {
  // 1. Log simulation
  await supabase.from('agent_logs').insert({
    type: 'notification',
    level: 'info',
    message: `[LEGAL AGENT] Generating digital ${params.type} for ${params.recipientName} (${params.recipientEmail}).`,
    metadata: { dealId: params.dealId, type: params.type, channel: 'system' }
  });

  // 2. Simulate delay (Generating PDF + E-signature link)
  await new Promise(r => setTimeout(r, 2000));

  // 3. Update Deal Record
  const updateData: any = {};
  if (params.type === 'MSA') updateData.msa_signed = false; // Pending
  if (params.type === 'NDA') updateData.nda_signed = false; // Pending
  
  await supabase.from('deals').update(updateData).eq('id', params.dealId);

  // 4. Notify Recipient (if user exists)
  // In a real app, this sends an email/WhatsApp via external API
  
  await supabase.from('agent_logs').insert({
    type: 'notification',
    level: 'success',
    message: `[WHATSAPP AGENT] Secure partnership link for ${params.type} delivered to ${params.recipientName}. Link: nest.hire/sign/${params.dealId.slice(0,8)}`,
    metadata: { dealId: params.dealId, type: params.type, channel: 'whatsapp' }
  });

  return { success: true, trackingId: params.dealId.slice(0,8) };
}

export async function signAgreement(dealId: string, type: 'MSA' | 'NDA') {
  const updateData: any = {};
  if (type === 'MSA') updateData.msa_signed = true;
  if (type === 'NDA') updateData.nda_signed = true;

  await supabase.from('deals').update(updateData).eq('id', dealId);

  // Notify Admin
  await notifyUser({
    title: 'Agreement Signed!',
    message: `The ${type} for Deal ${dealId.slice(0,4)} has been digitally signed by the partner.`,
    type: 'success',
    link: `/deal-room`
  });

  return { success: true };
}
