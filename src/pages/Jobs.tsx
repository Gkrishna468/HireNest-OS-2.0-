/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  MapPin, 
  Briefcase as BriefcaseIcon, 
  BadgeCheck,
  Building2,
  Clock,
  Zap,
  ArrowRight,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Globe,
  Copy,
  Share2,
  MessageCircle,
  Linkedin,
  Edit2,
  Trash2,
  AlertCircle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { safeArray, safeString, safeDate } from '@/utils/safe';
import { broadcastJob } from '@/services/marketplaceService';
import { scoreCandidateForJob } from '@/services/intelligenceService';
import { supabase } from '@/lib/supabase';

export default function Jobs() {
  const { user } = useAuth();
  const { jobs, loading, approveJobWithBudget, addJob, updateJob, deleteJob, clients, vendors, userProfile } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState(70);
  const [isMatching, setIsMatching] = useState(false);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [approvedBudget, setApprovedBudget] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [newJob, setNewJob] = useState({
    title: '',
    clientName: '',
    clientId: '',
    location: '',
    type: 'Full-time',
    openings: 1,
    description: '',
    skills: '',
    vendorName: ''
  });

  const [editJob, setEditJob] = useState<any>(null);

  // Derived user type
  const isAdmin = user?.role === 'admin' || user?.email === 'gopal@hirenestworkforce.com';
  const isClient = userProfile?.type === 'client';

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Data Cleaning for UUID fields
      const jobData = {
        ...newJob,
        clientId: newJob.clientId === '' ? null : newJob.clientId,
        skills: newJob.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      await addJob(jobData);
      setIsModalOpen(false);
      setNewJob({
        title: '',
        clientName: '',
        clientId: '',
        location: '',
        type: 'Full-time',
        openings: 1,
        description: '',
        skills: '',
        vendorName: ''
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create job');
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJob) return;
    
    try {
      const jobData = {
        ...editJob,
        skills: typeof editJob.skills === 'string' 
          ? editJob.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : editJob.skills
      };

      await updateJob(editJob.id, jobData);
      setIsEditModalOpen(false);
      setIsViewDetailOpen(false);
      setEditJob(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update job');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(id);
        setActiveMenuId(null);
      } catch (err) {
        toast.error('Failed to delete job');
      }
    }
  };

  const runNeuralMatch = async (job: any) => {
    if (!job) return;
    setIsMatching(true);
    setJobMatches([]);
    
    try {
      const { data: candidatesPool, error } = await supabase
        .from('candidates')
        .select('*')
        .limit(20); // Small batch for live detail

      if (error) throw error;

      const results = [];
      for (const candidate of safeArray(candidatesPool)) {
        const match = await scoreCandidateForJob(job, candidate);
        results.push({
          candidate,
          ...match
        });
      }

      setJobMatches(results.sort((a, b) => b.score - a.score));
    } catch (err) {
      toast.error('AI Matching failed');
    } finally {
      setIsMatching(false);
    }
  };

  const alertVendor = (candidateName: string, vendorName: string, gaps: string[]) => {
    toast.info(`Alerting ${vendorName} about skill gaps for ${candidateName}`);
    // Real logic would enqueue an email/WhatsApp alert
    setTimeout(() => {
      toast.success(`Vendor ${vendorName} notified to upgrade ${candidateName}'s profile.`);
    }, 1500);
  };

  const filteredJobs = safeArray(jobs).filter(job => 
    safeString(job.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
    safeString(job.clientName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (!selectedJob || !approvedBudget) {
      toast.error('Please enter a budget');
      return;
    }
    
    try {
      if (typeof approveJobWithBudget === 'function') {
        await approveJobWithBudget(selectedJob.id, approvedBudget);
        toast.success(`Job approved with budget: ${approvedBudget}`);
        setIsApproveOpen(false);
        setSelectedJob(null);
        setApprovedBudget('');
      }
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700 border-green-200';
      case 'filled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Job Ecosystem</h1>
          <p className="text-slate-500 mt-1">Manage active vacancies, client approvals, and hiring progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Create New Job
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by role or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          Filters
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white h-48 rounded-2xl border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("px-2.5 py-1 text-xs font-bold rounded-full border", getStatusColor(job.status))}>
                    {job.status.toUpperCase()}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === job.id ? null : job.id)}
                      className="text-slate-300 hover:text-slate-600 transition-colors p-1"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenuId === job.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => {
                            setSelectedJob(job);
                            setIsViewDetailOpen(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                          View Details
                        </button>
                        <button 
                          onClick={() => {
                            setEditJob({
                              ...job,
                              skills: safeArray(job.skills).join(', ')
                            });
                            setIsEditModalOpen(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                          Edit Job
                        </button>
                        <button 
                          onClick={() => {
                            // Quick status update toggle logic
                            const nextStatus = job.status === 'open' ? 'closed' : 'open';
                            updateJob(job.id, { status: nextStatus });
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4 text-slate-400" />
                          {job.status === 'open' ? 'Close Job' : 'Open Job'}
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 
                    onClick={() => { setSelectedJob(job); setIsViewDetailOpen(true); }}
                    className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {job.title}
                    {job.approvalStatus === 'approved' && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium text-slate-700">
                      {isAdmin || isClient ? (job.clientName || 'Direct Hire') : `ORG-${job.clientId?.slice(0, 8).toUpperCase() || 'PRIVATE'}`}
                    </span>
                    {job.vendorName && (
                      <>
                        <span className="text-slate-300">•</span>
                        <Zap className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-orange-600 text-[10px] font-bold uppercase tracking-wider">{job.vendorName}</span>
                      </>
                    )}
                    <span className="text-slate-300">•</span>
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {safeArray(job.skills).slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                      {skill}
                    </span>
                  ))}
                  {safeArray(job.skills).length > 3 && (
                    <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded">
                      +{safeArray(job.skills).length - 3} MORE
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Openings</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <span className="text-sm font-bold text-slate-900">{job.openings} Positions</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Budget</p>
                    <p className="text-sm font-bold text-slate-900">{job.budget || 'Pending Approval'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-slate-50" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{job.submissionsCount} Candidates</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setSelectedJob(job); setIsViewDetailOpen(true); }}
                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {job.approvalStatus === 'pending' ? (
                    <button 
                      onClick={() => { setSelectedJob(job); setIsApproveOpen(true); }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                  ) : !job.broadcast_to_vendors ? (
                    <button 
                      onClick={async () => {
                        try {
                          await broadcastJob(job.id);
                          toast.success('Broadcasted to Marketplace');
                        } catch (err) {
                          toast.error('Failed to broadcast');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Broadcast
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Live
                    </div>
                  )}
                  <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 text-center rounded-2xl border border-slate-200 border-dashed">
          <BriefcaseIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Jobs Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-1">
            Start the recruitment flow by creating your first job requisition or client position.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Create Job
          </button>
        </div>
      )}

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Post New Job Requisition</h2>
                <p className="text-slate-400 text-xs mt-1">Fill in the details to start sourcing candidates.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateJob} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Client / Company</label>
                {isAdmin ? (
                  <select
                    required
                    value={newJob.clientId}
                    onChange={(e) => {
                      const selectedClient = clients.find(c => c.id === e.target.value);
                      setNewJob({
                        ...newJob, 
                        clientId: e.target.value,
                        clientName: selectedClient?.company || ''
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select a Client Partner</option>
                    {safeArray(clients).map(c => (
                      <option key={c.id} value={c.id}>{c.company} ({c.clientCode || 'PRO'})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    disabled={isClient}
                    value={isClient ? userProfile.company_name : newJob.clientName}
                    onChange={(e) => setNewJob({...newJob, clientName: e.target.value})}
                    placeholder="e.g. TechCorp Solutions"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Location</label>
                <input
                  type="text"
                  required
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  placeholder="e.g. Remote, Mumbai, Bangalore"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Job Type</label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                >
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                  <option>Internship</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Vendor</label>
                <select
                  value={newJob.vendorName}
                  onChange={(e) => setNewJob({...newJob, vendorName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">No vendor (Internal)</option>
                  {safeArray(vendors).map(v => (
                    <option key={v.id} value={v.company || v.name}>{v.company || v.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Skills (comma separated)</label>
                <input
                  type="text"
                  required
                  value={newJob.skills}
                  onChange={(e) => setNewJob({...newJob, skills: e.target.value})}
                  placeholder="React, TypeScript, Node.js, AWS"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Job Description</label>
                <textarea
                  required
                  rows={4}
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  placeholder="Paste details about the role, responsibilities, and requirements..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {isApproveOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Approve Job Listing</h2>
                <p className="text-slate-400 text-xs mt-1">Reviewing: {selectedJob?.title}</p>
              </div>
              <button 
                onClick={() => setIsApproveOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-4">
                <DollarSign className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Set Approved Budget</h4>
                  <p className="text-indigo-700/70 text-xs leading-relaxed">
                    Set the official budget for this role. This will be visible to vendors and recruiters.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Budget Amount (₹)</label>
                  <input
                    type="text"
                    value={approvedBudget}
                    onChange={(e) => setApprovedBudget(e.target.value)}
                    placeholder="e.g. 12-15L CTC"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsApproveOpen(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApprove}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
                >
                  Confirm Approval
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Job Detail Modal */}
      {isViewDetailOpen && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                <p className="text-slate-400 text-xs mt-1">{selectedJob.clientName} • {selectedJob.location}</p>
              </div>
              <button 
                onClick={() => setIsViewDetailOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Job Description</h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {selectedJob.description || 'No description provided.'}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Sourcing Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shareable Short URL</p>
                      <p className="text-sm font-mono text-indigo-600 mt-1 font-medium truncate">
                        {`https://hirenest.io/j/${selectedJob.id?.substring(0, 8)}?src=ext`}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Source Tracking</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">EXTERNAL / SHARED</p>
                    </div>
                  </div>
                </section>

                <section className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-indigo-600 animate-pulse" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Neural Match Engine</h3>
                    </div>
                    <button 
                      onClick={() => runNeuralMatch(selectedJob)}
                      disabled={isMatching}
                      className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isMatching ? 'Scanning...' : 'Run New AI Scan'}
                    </button>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Match Threshold: {matchThreshold}%</span>
                        <input 
                          type="range" 
                          min="70" 
                          max="100" 
                          step="5"
                          value={matchThreshold}
                          onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
                          className="w-32 accent-indigo-500 bg-slate-800 rounded-lg"
                        />
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality Logic</span>
                        <span className="text-xs font-bold text-white italic">"Prioritizing Niche Skills & Tenure"</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {jobMatches.length === 0 && !isMatching && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                          <p className="text-slate-500 text-xs font-medium">Click "Run AI Scan" to find qualified candidates.</p>
                        </div>
                      )}

                      {isMatching && (
                        <div className="space-y-3">
                          {[1, 2].map(i => (
                            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      )}

                      {jobMatches.filter(m => m.score >= matchThreshold).map((match, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                                {match.score}%
                              </div>
                              <h4 className="text-sm font-bold text-white tracking-tight">{match.candidate.name}</h4>
                            </div>
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                              match.recommendation === 'shortlist' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            )}>
                              {match.recommendation}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 leading-relaxed italic mb-3">"{match.reasoning}"</p>
                          
                          {safeArray(match.gaps).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Identified Gaps:</span>
                                <div className="flex flex-wrap gap-1">
                                  {safeArray(match.gaps).slice(0, 2).map((gap, gIdx) => (
                                    <span key={gIdx} className="text-[8px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{gap}</span>
                                  ))}
                                </div>
                              </div>
                              <button 
                                onClick={() => alertVendor(match.candidate.name, selectedJob.vendorName || "Associated Agency", match.gaps)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all"
                              >
                                <AlertCircle className="w-3 h-3" />
                                Alert Vendor
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditJob({
                      ...selectedJob,
                      skills: safeArray(selectedJob.skills).join(', ')
                    });
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-transparent rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Job
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedJob.description);
                    toast.success('Job Description copied to clipboard');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all font-bold text-sm text-slate-700 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy JD
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 cursor-default">Share via:</span>
                <button 
                  onClick={() => {
                    const text = encodeURIComponent(`Check out this job opening: ${selectedJob.title} at ${selectedJob.clientName}. Apply here: https://hirenest.io/j/${selectedJob.id?.substring(0, 8)}?src=ext`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all group"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(`https://hirenest.io/j/${selectedJob.id?.substring(0, 8)}?src=ext`);
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                  }}
                  className="p-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    const text = `Job: ${selectedJob.title}\nClient: ${selectedJob.clientName}\nLink: https://hirenest.io/j/${selectedJob.id?.substring(0, 8)}?src=ext`;
                    if (navigator.share) {
                      navigator.share({
                        title: selectedJob.title,
                        text: text,
                        url: `https://hirenest.io/j/${selectedJob.id?.substring(0, 8)}?src=ext`
                      }).catch(() => toast.error('Sharing failed'));
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success('Share link copied to clipboard');
                    }
                  }}
                  className="p-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all"
                  title="More options"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {isEditModalOpen && editJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-sans">Edit Job Assignment</h2>
                <p className="text-indigo-200 text-xs mt-1">Modify terms, vendors, or position details.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateJob} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={editJob.title}
                  onChange={(e) => setEditJob({...editJob, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Partner</label>
                <select
                  required
                  value={editJob.clientId || ''}
                  onChange={(e) => {
                    const client = clients.find((c: any) => c.id === e.target.value);
                    setEditJob({
                      ...editJob, 
                      clientId: e.target.value,
                      clientName: client?.company || ''
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Client</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>{client.company}</option>
                  ))}
                  <option value="direct">Direct Hire (No Client)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Vendor / Agency</label>
                <div className="relative">
                  <select
                    value={editJob.vendorName || ''}
                    onChange={(e) => setEditJob({...editJob, vendorName: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                  >
                    <option value="">Select Vendor / Agency</option>
                    {safeArray(vendors).map((v: any) => (
                      <option key={v.id} value={v.company || v.name}>{v.company || v.name} ({v.vendorCode || 'VEN'})</option>
                    ))}
                    <option value="internal">Internal Team</option>
                  </select>
                  <Zap className="absolute left-3 top-3 w-4 h-4 text-orange-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                <input
                  type="text"
                  required
                  value={editJob.location}
                  onChange={(e) => setEditJob({...editJob, location: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Type</label>
                <select
                  value={editJob.type}
                  onChange={(e) => setEditJob({...editJob, type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                >
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                  <option>Internship</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Skills</label>
                <input
                  type="text"
                  value={editJob.skills}
                  onChange={(e) => setEditJob({...editJob, skills: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <select
                  value={editJob.status}
                  onChange={(e) => setEditJob({...editJob, status: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="filled">Filled</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requirement Details</label>
                <textarea
                  required
                  rows={4}
                  value={editJob.description}
                  onChange={(e) => setEditJob({...editJob, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed font-sans"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  Save Updates
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
