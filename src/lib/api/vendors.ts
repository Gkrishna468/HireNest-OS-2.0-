/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { safeQuery, safeInsert, safeUpdate, sanitizeVendor } from './base';
import type { Vendor } from '@/types';

export async function getVendors(): Promise<Vendor[]> {
  const data = await safeQuery(
    supabase.from('vendors').select('*').order('created_at', { ascending: false }),
    []
  );
  return data.map(sanitizeVendor);
}

export async function createVendor(data: any) {
  return safeInsert('vendors', {
    name: data.name || '',
    type: data.type || 'vendor',
    company: data.company || '',
    email: data.email || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    location: data.location || '',
    specialization: data.specialization || [],
    is_recruiter: data.isRecruiter || false,
    recruiter_company: data.recruiterCompany || '',
    vendor_code: data.vendorCode || '',
    website: data.website || '',
    spcos: data.spcos || []
  });
}

export async function updateVendor(id: string, updates: any) {
  const payload: any = { ...updates };
  
  // Map camelCase to snake_case if existing
  if (updates.isRecruiter !== undefined) payload.is_recruiter = updates.isRecruiter;
  if (updates.recruiterCompany !== undefined) payload.recruiter_company = updates.recruiterCompany;
  if (updates.vendorCode !== undefined) payload.vendor_code = updates.vendorCode;
  
  // Remove fields that shouldn't be updated or cause errors
  delete payload.id;
  delete payload.created_at;
  delete payload.isRecruiter;
  delete payload.recruiterCompany;
  delete payload.vendorCode;
  
  return safeUpdate('vendors', id, payload);
}
