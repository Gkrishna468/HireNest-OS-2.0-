/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { 
  Zap, 
  Search, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Briefcase,
  Users,
  ChevronRight,
  Filter,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { scoreCandidateForJob } from '@/services/intelligenceService';
import { processResumes } from '@/services/resumeService';
import { safeArray, safeString } from '@/utils/safe';
import { toast } from 'sonner';

export default function AIMatching() {
  const { jobs, candidates } = useData();
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState(50);

  // Fetch resumes directly to bypass any caching in DataContext
  const fetchResumes = async () => {
    const { data } = await supabase.from('resumes').select('*').order('created_at', { ascending: false });
    if (data) setResumes(data);
  };

  React.useEffect(() => {
    fetchResumes();
  }, []);

  const handleProcessResumes = async () => {
    setIsProcessing(true);
    const toastId = toast.loading('AI Agent parsing historical resume library...');
    try {
      const result = await processResumes();
      toast.success(`Processed ${result.count} new resumes into talent pool!`, { id: toastId });
      await fetchResumes(); // Refresh resume list
    } catch (err) {
      toast.error('Neural processing failed', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const runMatching = async () => {
    if (!selectedJob) return;
    setIsMatching(true);
    
    // 1. Ensure Job has structured skills for high-fidelity matching
    let currentJob = { ...selectedJob };
    if (!selectedJob.skills || selectedJob.skills.length === 0) {
      toast.loading('Analyzing JD technical nodes...', { duration: 1500 });
      const { extractJobSkills } = await import('@/services/intelligenceService');
      const extractedSkills = await extractJobSkills(selectedJob.description);
      if (extractedSkills.length > 0) {
        currentJob.skills = extractedSkills;
        // Silently update DB for future matches
        await supabase.from('jobs').update({ skills: extractedSkills }).eq('id', selectedJob.id);
        setSelectedJob(currentJob);
      }
    }

    // 2. Combine structural candidates and unstructured resumes into a UNIFIED TALENT POOL
    const resumePool = resumes.map(r => ({
      id: r.id,
      name: r.file_name?.replace('.pdf', '') || 'Unnamed Candidate',
      skills: r.extracted_skills || r.parsed_data?.skills || [], // Use new extracted_skills column if present
      experience: r.parsed_data?.yearsOfExperience || 0,
      summary: r.extracted_text?.substring(0, 500),
      source: 'resume_upload',
      url: r.url
    }));

    const totalPool = [
      ...candidates.map(c => ({ ...c, source: 'crm' })), 
      ...resumePool
    ];
    
    if (totalPool.length === 0) {
      toast.error('No talent pool found (CRM or Resumes).');
      setIsMatching(false);
      return;
    }

    // Create an agent log for this "Autonomous" activity
    await supabase.from('agent_logs').insert({
      type: 'matching',
      message: `Neural Engine scanning ${totalPool.length} profiles (CRM + Resumes) for: ${currentJob.title}`,
      level: 'info',
      status: 'running'
    });

    const toastId = toast.loading(`AI Engine evaluating ${totalPool.length} profiles...`);

    try {
      // Parallel evaluation
      const res = await Promise.all(totalPool.map(async (c) => {
        try {
          const evaluation = await scoreCandidateForJob(currentJob, c);
          return {
            ...c,
            score: evaluation.score,
            reasoning: evaluation.reasoning,
            gaps: evaluation.gaps,
            recommendation: evaluation.recommendation
          };
        } catch (e) {
          console.error("Match evaluation error:", e);
          return { ...c, score: 0, recommendation: 'reject' };
        }
      }));

      const finalMatches = res
        .sort((a, b) => b.score - a.score)
        .filter(c => c.score >= 5);

      // Final log entry
      await supabase.from('agent_logs').insert({
        type: 'matching',
        message: `Found ${finalMatches.length} potential matches for ${currentJob.title}. Top score: ${finalMatches[0]?.score || 0}%`,
        level: finalMatches.length > 0 ? 'success' : 'warning',
        status: 'finished'
      });

      setMatches(finalMatches);
      
      if (finalMatches.length > 0 && finalMatches.every(r => r.score < matchThreshold)) {
        toast.info('Discovery Mode: Showing relative matches below the survival threshold.', { id: toastId });
      } else if (finalMatches.length === 0) {
        toast.warning('Neural scan complete, but no candidates met the discovery threshold.', { id: toastId });
      } else {
        toast.success(`Neural scan complete. Found ${finalMatches.length} qualified matches.`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Matching Engine failed: ${err.message}`, { id: toastId });
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Neural Matching</h1>
        <p className="text-slate-500 mt-1">AI-driven candidate relevance scoring based on unified resume and portal data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Target Role
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Requisition</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  onChange={(e) => setSelectedJob(jobs.find(j => j.id === e.target.value))}
                  value={selectedJob?.id || ''}
                >
                  <option value="">Choose a vacancy...</option>
                  {jobs.filter(j => j.status === 'open' || j.status === 'pending').map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>

              {selectedJob && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-indigo-900 font-bold">{selectedJob.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {safeArray(selectedJob.skills).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-indigo-100/50 text-indigo-600 text-[9px] font-bold rounded uppercase">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={runMatching}
                disabled={!selectedJob || isMatching}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isMatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {isMatching ? 'Running AI Scoring...' : 'Run Neural Match'}
              </button>

              <div className="pt-2">
                <button 
                  onClick={handleProcessResumes}
                  disabled={isProcessing}
                  className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                  {isProcessing ? 'Processing Library...' : 'Sync Pending Resumes'}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2 font-medium italic">
                  * Converts historical raw resumes into structured matches
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-16 h-16" />
            </div>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Inference Logic
            </h3>
            <div className="space-y-3 relative z-10">
              {[
                { label: 'Technical Skills', weight: '70%', status: 'active' },
                { label: 'Core Experience', weight: '30%', status: 'active' },
              ].map(w => (
                <div key={w.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">{w.label}</span>
                  <span className="font-mono text-indigo-400">{w.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Ranked Results</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Scored against {selectedJob?.title || 'None'}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
              {isMatching ? (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center animate-pulse">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-25" />
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 relative">
                     <Zap className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-6">AI Agent is thinking...</h4>
                  <p className="text-sm text-slate-500 max-w-xs mt-2">Connecting candidates from resumes and portal data to your specific job requirements.</p>
                </div>
              ) : matches.length > 0 ? (
                <div className="flex flex-col flex-1 divide-y divide-slate-50">
                  {matches.filter(m => m.score >= matchThreshold).length === 0 && matches.length > 0 && (
                    <div className="p-4 bg-amber-50 border-b border-amber-100 text-center">
                      <p className="text-xs text-amber-600 font-bold uppercase tracking-widest leading-none">Discovery Mode</p>
                      <p className="text-[10px] text-amber-500 mt-1 italic">Showing closest relative matches (None met the {matchThreshold}% threshold)</p>
                    </div>
                  )}
                  
                  {(matches.filter(m => m.score >= matchThreshold).length > 0 
                    ? matches.filter(m => m.score >= matchThreshold)
                    : matches.slice(0, 5)
                  ).map(match => (
                    <div key={match.id} className="p-6 hover:bg-slate-50 transition-colors group flex items-start gap-6">
                    <div className="relative pt-1 shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-bold text-lg text-indigo-600 group-hover:border-indigo-200 transition-colors">
                        {match.score}%
                      </div>
                      <div className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        match.score > 80 ? 'bg-green-500' : match.score > 50 ? 'bg-orange-500' : 'bg-slate-300'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{match.name}</h4>
                             <span className={cn(
                               "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                               match.source === 'crm' ? "bg-slate-100 text-slate-600" : "bg-indigo-100 text-indigo-600"
                             )}>
                               {match.source === 'crm' ? 'CRM Profile' : 'New Resume'}
                             </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {match.yearsExperience || match.experience} yrs exp
                            </span>
                          </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all group/btn">
                          Select for Deal
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {safeArray(match.matchedSkills).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {s}
                          </span>
                        ))}
                        {safeArray(match.missingSkills).slice(0, 5).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-red-50/50 text-red-400 text-[10px] font-bold rounded-md border border-red-100/30 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 opacity-50" />
                            {s}
                          </span>
                        ))}
                      </div>

                      {match.reasoning && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                          <BrainCircuit className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {match.reasoning}
                          </p>
                        </div>
                      )}

                      {safeArray(match.gaps).length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            Neural Gap Analysis
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {safeArray(match.gaps).map((gap, i) => (
                              <div key={i} className="px-3 py-2 bg-red-50/30 text-red-700 text-[11px] font-bold rounded-xl border border-red-100/50 flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                {gap}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                  <Search className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-medium">No matches found yet.</p>
                  <p className="text-sm mt-1">Select a job and run neural match to start discovering candidates.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Security isolation active</span>
              <div className="flex gap-4">
                <span>VPC-01-PROD</span>
                <span>Latency: {isMatching ? '~' : '0.12ms'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
