/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabase';
import { safeArray, safeString, safeNumber, safeSkills } from '@/utils/safe';
import type { Client, Vendor, Job, Candidate, User, Resume, FollowUp, Deal, Submission } from '@/types';

export async function safeQuery<T>(promise: PromiseLike<any>, fallback: T): Promise<T> {
  try {
    const { data, error } = await (promise as Promise<any>);
    if (error) {
      console.error('Supabase Query Error:', error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.error('Unexpected Supabase Error:', err);
    return fallback;
  }
}

export async function safeInsert(table: string, payload: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let profile = null;
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      profile = data;
    }

    const cleanPayload = { ...payload };
    
    // Only inject if not the companies table itself and we have the values
    if (table !== 'companies') {
      if (user && !cleanPayload.user_id) cleanPayload.user_id = user.id;
      if (profile?.company_id && !cleanPayload.company_id) cleanPayload.company_id = profile.company_id;
    }

    const { data, error } = await supabase.from(table).insert(cleanPayload).select();
    
    if (error) {
      console.error(`Supabase Insert Error [${table}]:`, error.message, error.details);
      // In a real app, you might want to re-throw or handle this specifically
      throw error; 
    }
    
    return data ?? [];
  } catch (err) {
    console.error(`Unexpected error inserting into ${table}:`, err);
    throw err;
  }
}

export async function safeUpdate(table: string, id: string, payload: any) {
  return safeQuery(
    supabase.from(table).update(payload).eq('id', id).select(),
    []
  );
}

export async function safeDelete(table: string, id: string) {
  return safeQuery(
    supabase.from(table).delete().eq('id', id),
    null
  );
}

// Sanitizers
export const sanitizeClient = (c: any): Client => ({
  id: safeString(c.id),
  company: safeString(c.company),
  name: safeString(c.name),
  email: safeString(c.email),
  phone: safeString(c.phone),
  location: safeString(c.location),
  industry: safeString(c.industry),
  budget: safeString(c.budget),
  contactPerson: safeString(c.contact_person || c.contactPerson),
  website: safeString(c.website),
  clientCode: safeString(c.client_code || c.clientCode),
  notes: safeString(c.notes),
  userId: safeString(c.user_id || c.userId),
  companyId: safeString(c.company_id || c.companyId),
  createdAt: safeString(c.created_at || c.createdAt),
  updatedAt: safeString(c.updated_at || c.updatedAt),
});

export const sanitizeVendor = (v: any): Vendor => ({
  id: safeString(v.id),
  name: safeString(v.name),
  type: (v.type === 'recruiter' ? 'recruiter' : 'vendor'),
  company: safeString(v.company),
  email: safeString(v.email),
  phone: safeString(v.phone),
  location: safeString(v.location),
  specialization: safeSkills(v.specialization),
  isRecruiter: v.is_recruiter === true,
  recruiterCompany: safeString(v.recruiter_company),
  vendorCode: safeString(v.vendor_code),
  userId: safeString(v.user_id),
  companyId: safeString(v.company_id),
  createdAt: safeString(v.created_at),
  updatedAt: safeString(v.updated_at),
});

export const sanitizeJob = (j: any): Job => ({
  id: safeString(j.id),
  title: safeString(j.title),
  description: safeString(j.description),
  location: safeString(j.location),
  type: safeString(j.type),
  salary: safeString(j.salary),
  budget: j.budget || 0,
  skills: safeSkills(j.skills),
  experienceRequired: safeString(j.experience_required),
  openings: safeNumber(j.openings),
  submissionsCount: safeNumber(j.submissions_count),
  status: (j.status || 'open') as any,
  approvalStatus: (j.approval_status || 'pending') as any,
  clientId: safeString(j.client_id),
  clientName: safeString(j.client_name),
  userId: safeString(j.user_id),
  companyId: safeString(j.company_id),
  closedDate: safeString(j.closed_date),
  createdAt: safeString(j.created_at),
  updatedAt: safeString(j.updated_at),
});

export const sanitizeCandidate = (c: any): Candidate => ({
  id: safeString(c.id),
  name: safeString(c.name),
  email: safeString(c.email),
  phone: safeString(c.phone),
  skills: safeSkills(c.skills),
  experience: safeNumber(c.experience),
  yearsExperience: safeNumber(c.years_experience || c.experience),
  currentCompany: safeString(c.current_company),
  currentTitle: safeString(c.current_title),
  expectedSalary: safeString(c.expected_salary),
  location: safeString(c.location),
  status: (c.status || 'active') as any,
  stage: (c.stage || 'sourced') as any,
  vendorId: safeString(c.source_vendor_id || c.vendor_id),
  vendorName: safeString(c.vendor_name),
  vendorCode: safeString(c.vendor_code),
  clientId: safeString(c.client_id),
  jobId: safeString(c.job_id),
  jobTitle: safeString(c.job_title),
  resumeUrl: safeString(c.resume_url),
  notes: safeString(c.notes),
  source: safeString(c.source || 'portal'),
  userId: safeString(c.user_id),
  companyId: safeString(c.company_id),
  createdAt: safeString(c.created_at),
  updatedAt: safeString(c.updated_at),
});
