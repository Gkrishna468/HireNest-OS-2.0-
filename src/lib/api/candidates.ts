/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { safeQuery, safeInsert, safeUpdate, safeDelete, sanitizeCandidate } from './base';
import type { Candidate, Resume } from '@/types';
import { safeString, safeSkills } from '@/utils/safe';

export async function getCandidates(): Promise<Candidate[]> {
  const data = await safeQuery(
    supabase.from('candidates').select('*').order('created_at', { ascending: false }),
    []
  );
  return data.map(sanitizeCandidate);
}

export async function getAllCandidates(): Promise<Candidate[]> {
  const [candidates, resumes] = await Promise.all([
    getCandidates(),
    safeQuery(supabase.from('resumes').select('*').order('created_at', { ascending: false }), []),
  ]);

  const resumeCandidates: Candidate[] = resumes.map((r: any) => ({
    id: `resume-${r.id}`,
    name: safeString(r.candidate_name || r.name || 'Resume Candidate'),
    email: safeString(r.candidate_email || ''),
    phone: safeString(r.candidate_phone || ''),
    skills: safeSkills(r.extracted_skills || r.skills),
    experience: 0,
    yearsExperience: 0,
    status: 'active',
    stage: 'sourced',
    resumeUrl: r.url || '',
    notes: `From resume: ${r.file_name}`,
    source: 'resume',
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.created_at || new Date().toISOString(),
  }));

  return [...candidates, ...resumeCandidates];
}

export async function createCandidate(data: Partial<Candidate>) {
  return safeInsert('candidates', {
    name: data.name || '',
    email: data.email || null,
    phone: data.phone || null,
    skills: data.skills || [],
    experience: data.experience?.toString() ?? '0',
    current_title: data.currentTitle || null,
    stage: data.stage || 'sourced',
    vendor_company_id: data.vendorCompanyId || null,
    resume_url: data.resumeUrl || null,
    source: data.source || 'vendor',
    ai_match_score: data.aiMatchScore || 0,
  } as any);
}

export async function updateCandidate(id: string, updates: Partial<Candidate>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.skills !== undefined) payload.skills = updates.skills;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.stage !== undefined) payload.stage = updates.stage;
  
  return safeUpdate('candidates', id, payload);
}

export async function deleteCandidate(id: string) {
  return safeDelete('candidates', id);
}
