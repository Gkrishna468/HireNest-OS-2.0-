import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  ArrowRight, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Shortlist, Job } from '@/types';

const STAGES = [
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { id: 'interview', label: 'Interviews', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'selected', label: 'Selected', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-100' }
];

export default function RecruiterDashboard() {
  const [pipeline, setPipeline] = useState<Shortlist[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Subscribe to real-time changes
    const channel = supabase
      .channel('shortlist_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shortlist' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [shortlistRes, jobsRes] = await Promise.all([
        supabase.from('shortlist').select('*').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').eq('status', 'open')
      ]);

      if (shortlistRes.data) setPipeline(shortlistRes.data);
      if (jobsRes.data) setJobs(jobsRes.data);
    } catch (err) {
      toast.error('Failed to sync pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStage = async (id: string, stage: string) => {
    try {
      const { error } = await supabase
        .from('shortlist')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Candidate moved to ${stage}`);
    } catch (err) {
      toast.error('Failed to move candidate');
    }
  };

  const filteredPipeline = selectedJobId === 'all' 
    ? pipeline 
    : pipeline.filter(p => p.job_id === selectedJobId);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Recruiter <span className="text-indigo-600 italic">Dashboard</span>
          </h1>
          <p className="text-slate-400 font-medium mt-1">Live Pipeline & Neural Talent Tracking</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="all">All Active Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
        {STAGES.map(stage => {
          const items = filteredPipeline.filter(p => p.stage === stage.id);
          return (
            <div key={stage.id} className="flex flex-col gap-4">
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between font-black uppercase tracking-widest text-[10px]",
                stage.color
              )}>
                {stage.label}
                <span className="bg-white/50 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>

              <div className="flex-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-2 space-y-4">
                {items.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No profiles</p>
                  </div>
                ) : (
                  items.map(card => (
                    <div key={card.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {card.score}%
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                          card.source === 'crm' ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-500"
                        )}>
                          {card.source === 'crm' ? 'CRM' : 'Resume'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        ID: {card.candidate_id.substring(0, 8)}...
                      </h4>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                           <p className="text-[8px] text-slate-400 font-bold uppercase">Hiring Prob.</p>
                           <p className={cn(
                             "text-xs font-black",
                             (card.hiring_probability || 0) > 75 ? "text-emerald-600" : "text-amber-600"
                           )}>{card.hiring_probability || 0}%</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                           <p className="text-[8px] text-slate-400 font-bold uppercase">Offer Success</p>
                           <p className="text-xs font-black text-indigo-600">{card.offer_success_score || 0}%</p>
                        </div>
                      </div>

                      {card.ai_metadata?.risk_level && (
                        <div className="mt-2 flex items-center gap-1">
                          <AlertCircle className={cn(
                            "w-3 h-3",
                            card.ai_metadata.risk_level === 'Low' ? "text-emerald-500" : "text-amber-500"
                          )} />
                          <span className="text-[9px] font-bold text-slate-500 capitalize">{card.ai_metadata.risk_level} Risk Profile</span>
                        </div>
                      )}
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {card.matched_skills?.slice(0, 3).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded border border-green-100">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex -space-x-1">
                          {STAGES.filter(s => s.id !== stage.id).map(s => (
                            <button
                              key={s.id}
                              onClick={() => updateStage(card.id, s.id)}
                              className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                              title={`Move to ${s.label}`}
                            >
                              {s.id === 'selected' ? <CheckCircle2 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                        <button className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                          Preview <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { ChevronRight } from 'lucide-react';
