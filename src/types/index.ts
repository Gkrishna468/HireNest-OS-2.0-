/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'client_manager' | 'vendor_manager' | 'recruiter' | 'manager' | 'vendor' | 'client' | 'viewer';

export interface Company {
  id: string;
  name: string;
  type: 'client' | 'vendor' | 'internal';
  createdAt: string;
}

export interface Agreement {
  id: string;
  companyId: string;
  type: 'MSA' | 'NDA';
  fileUrl: string;
  status: 'pending' | 'signed' | 'expired';
  signedAt?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId?: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  isVerified?: boolean;
}

export interface Client {
  id: string;
  company: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  industry?: string;
  budget?: string;
  contactPerson?: string;
  website?: string;
  clientCode?: string;
  notes?: string;
  userId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'vendor' | 'recruiter';
  company?: string;
  email?: string;
  phone?: string;
  location?: string;
  specialization?: string[];
  isRecruiter?: boolean;
  recruiterCompany?: string;
  vendorCode?: string;
  userId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary?: string;
  budget: number | any;
  adjustedBudget?: number;
  skills: string[];
  experienceRequired?: string;
  openings?: number;
  submissionsCount?: number;
  status: 'open' | 'closed' | 'filled' | 'pending';
  approvalStatus?: string;
  broadcastToVendors?: boolean;
  clientId?: string;
  clientName?: string;
  userId?: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  vendorCompanyId?: string;
  name: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: number | string;
  yearsExperience?: number;
  currentCompany?: string;
  currentTitle?: string;
  expectedSalary?: string;
  location?: string;
  status?: string;
  stage: string;
  vendorId?: string;
  vendorName?: string;
  vendorCode?: string;
  clientId?: string;
  jobId?: string;
  jobTitle?: string;
  resumeUrl?: string;
  notes?: string;
  source: string;
  aiMatchScore?: number;
  userId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  fileName: string;
  candidateId?: string;
  candidateName?: string;
  extractedText?: string;
  parsedData?: any;
  extractedSkills?: string[];
  source: 'direct' | 'gmail' | 'portal';
  url?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  entityType: 'client' | 'vendor' | 'candidate' | 'job' | 'recruiter';
  entityId: string;
  entityName?: string;
  message: string;
  status: 'pending' | 'completed';
  dueDate: string;
  userId?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  jobId: string;
  candidateId: string;
  vendorId?: string;
  clientId: string;
  clientName: string;
  jobTitle: string;
  candidateName: string;
  status: 'prospect' | 'sourcing' | 'submitted' | 'interview' | 'offered' | 'placed' | 'paid';
  offeredCtc?: number;
  finalCtc: number;
  commissionPercent: number;
  revenueAmount: number;
  vendorShare: number;
  payoutAmount: number;
  profitAmount: number;
  paymentReceived: boolean;
  joinedDate?: string;
  userId?: string;
  createdAt: string;
  revenue_amount?: number; // compat
}

export interface Submission {
  id: string;
  jobId: string;
  candidateId: string;
  vendorId?: string;
  candidateName: string;
  jobTitle: string;
  status: 'submitted' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected';
  notes?: string;
  userId?: string;
  createdAt: string;
}

export interface Collaboration {
  id: string;
  jobId: string;
  candidateId: string;
  vendorId: string;
  clientId: string;
  status: 'proposed' | 'collaborated' | 'interviewing' | 'rejected' | 'placed';
  matchScore: number;
  clientFeedback?: string;
  vendorNotes?: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  collaborationId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isAiAssisted: boolean;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  type: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  metadata?: any;
  createdAt: string;
}
