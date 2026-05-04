/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { safeQuery, safeInsert, safeUpdate, safeDelete, sanitizeJob } from './base';
import type { Job } from '@/types';

export async function getJobs(): Promise<Job[]> {
  const data = await safeQuery(
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    []
  );
  return data.map(sanitizeJob);
}

export async function createJob(data: Partial<Job>) {
  const payload: any = {
    title: data.title || '',
    description: data.description || '',
    location: data.location || '',
    type: data.type || '',
    salary: data.salary || '',
    skills: data.skills || [],
    experience_required: data.experienceRequired || '',
    openings: data.openings || 1,
    status: 'pending',
    approval_status: 'pending',
    client_id: data.clientId,
    client_name: data.clientName,
  };

  if (data.vendorName) payload.vendor_name = data.vendorName;

  try {
    return await safeInsert('jobs', payload);
  } catch (err: any) {
    if (err.message?.includes('vendor_name')) {
      delete payload.vendor_name;
      return await safeInsert('jobs', payload);
    }
    throw err;
  }
}

export async function updateJob(jobId: string, data: Partial<Job>) {
  const payload: any = {
    title: data.title,
    description: data.description,
    location: data.location,
    type: data.type,
    salary: data.salary,
    skills: data.skills,
    experience_required: data.experienceRequired,
    openings: data.openings,
    status: data.status,
    approval_status: data.approvalStatus,
    client_id: data.clientId,
    client_name: data.clientName,
    updated_at: new Date().toISOString(),
  };

  // Only include vendor_name if it was provided and we want to try it
  // We wrap this in a protective layer because some schemas might be missing this column
  if (data.vendorName) {
    payload.vendor_name = data.vendorName;
  }

  try {
    return await safeUpdate('jobs', jobId, payload);
  } catch (err: any) {
    if (err.message?.includes('vendor_name')) {
      console.warn("DB Schema Alert: 'vendor_name' column missing. Saving without vendor assignment.");
      delete payload.vendor_name;
      return await safeUpdate('jobs', jobId, payload);
    }
    throw err;
  }
}

export async function deleteJob(jobId: string) {
  return safeDelete('jobs', jobId);
}

export async function approveJob(jobId: string, budget: string) {
  return safeUpdate('jobs', jobId, {
    approval_status: 'approved',
    budget,
    status: 'open',
    updated_at: new Date().toISOString(),
  });
}

export async function rejectJob(jobId: string) {
  return safeUpdate('jobs', jobId, {
    approval_status: 'rejected',
    status: 'closed',
    updated_at: new Date().toISOString(),
  });
}

export async function updateJobStatus(jobId: string, status: Job['status']) {
  return safeUpdate('jobs', jobId, {
    status,
    updated_at: new Date().toISOString(),
  });
}
