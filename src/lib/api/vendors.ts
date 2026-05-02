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

export async function createVendor(data: Partial<Vendor>) {
  return safeInsert('vendors', {
    name: data.name || '',
    type: data.type || 'vendor',
    company: data.company || '',
    email: data.email || '',
    phone: data.phone || '',
    location: data.location || '',
    specialization: data.specialization || [],
    is_recruiter: data.isRecruiter || false,
    recruiter_company: data.recruiterCompany || '',
    vendor_code: data.vendorCode || '',
  });
}

export async function updateVendor(id: string, updates: Partial<Vendor>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.isRecruiter !== undefined) payload.is_recruiter = updates.isRecruiter;
  
  return safeUpdate('vendors', id, payload);
}
