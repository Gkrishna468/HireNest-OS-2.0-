/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { safeQuery, safeInsert, safeUpdate, sanitizeClient } from './base';
import type { Client } from '@/types';

export async function getClients(): Promise<Client[]> {
  const data = await safeQuery(
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    []
  );
  return data.map(sanitizeClient);
}

export async function createClient(data: Partial<Client>) {
  return safeInsert('clients', {
    company: data.company || '',
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    location: data.location || '',
    industry: data.industry || '',
    budget: data.budget || '',
    contact_person: data.contactPerson || '',
    website: data.website || '',
    client_code: data.clientCode || '',
    notes: data.notes || '',
  });
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const payload: any = {};
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.website !== undefined) payload.website = updates.website;
  
  return safeUpdate('clients', id, payload);
}
