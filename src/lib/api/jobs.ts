/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { safeQuery, safeInsert, safeUpdate, sanitizeJob } from './base';
import type { Job } from '@/types';

export async function getJobs(): Promise<Job[]> {
  const data = await safeQuery(
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    []
  );
  return data.map(sanitizeJob);
}

export async function createJob(data: Partial<Job>) {
  return safeInsert('jobs', {
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
  });
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
