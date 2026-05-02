/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
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
  Linkedin
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { safeArray, safeString, safeDate } from '@/utils/safe';
import { broadcastJob } from '@/services/marketplaceService';

export default function Jobs() {
  const { jobs, loading, approveJobWithBudget, addJob } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [approvedBudget, setApprovedBudget] = useState('');
  const [newJob, setNewJob] = useState({
    title: '',
    clientName: '',
    clientId: '',
    location: '',
    type: 'Full-time',
    openings: 1,
    description: '',
    skills: ''
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addJob({
        ...newJob,
        skills: newJob.skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      toast.success('Job created successfully');
      setIsModalOpen(false);
      setNewJob({
        title: '',
        clientName: '',
        clientId: '',
        location: '',
        type: 'Full-time',
        openings: 1,
        description: '',
        skills: ''
      });
    } catch (err) {
      toast.error('Failed to create job');
    }
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
                  <button className="text-slate-300 hover:text-slate-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-2">
                    {job.title}
                    {job.approvalStatus === 'approved' && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium text-slate-700">{job.clientName || 'Direct Hire'}</span>
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
                <input
                  type="text"
                  required
                  value={newJob.clientName}
                  onChange={(e) => setNewJob({...newJob, clientName: e.target.value})}
                  placeholder="e.g. TechCorp Solutions"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
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
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
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
    </div>
  );
}
