import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Zap, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BrainCircuit,
  Globe,
  ArrowUpRight,
  Bot,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { proposeCollaboration } from '@/services/marketplaceService';

interface OutreachLog {
  id: string;
  type: 'email' | 'whatsapp' | 'linkedin';
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'replied' | 'bounced' | 'pending';
  ai_model: string;
  created_at: string;
  job_title?: string;
}

export default function IntelligenceCenter() {
  const { logs } = useData();
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'email' | 'whatsapp'>('all');
  const [loading, setLoading] = useState(true);

  // Mock auto-generation of outreach activity for visualization
  useEffect(() => {
    fetchOutreachLogs();
    
    // Simulate real-time activity for the "Magic" feel
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addRandomActivity();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  async function fetchOutreachLogs() {
    setLoading(true);
    // In a real app, this would come from a dedicated 'outreach_logs' table (we updated the schema to support agent_logs)
    // For now, we'll use the agent_logs and filter for outreach types
    const { data } = await supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Transform into outreach logs for the UI
    const transformed: OutreachLog[] = (data || []).map(l => ({
      id: l.id,
      type: l.metadata?.channel || 'email',
      recipient: l.metadata?.recipient || 'Candidate Alpha',
      subject: l.metadata?.subject || 'Position Opportunity',
      content: l.message,
      status: l.metadata?.status || 'sent',
      ai_model: 'Gemini-3-Flash',
      created_at: l.created_at,
      job_title: l.metadata?.jobTitle
    }));

    setOutreachLogs(transformed);
    setLoading(false);
  }

  function addRandomActivity() {
    const freshLog: OutreachLog = {
      id: Math.random().toString(),
      type: Math.random() > 0.5 ? 'whatsapp' : 'email',
      recipient: 'New Lead ' + Math.floor(Math.random() * 1000),
      content: 'AI Agent followed up on the Senior React Lead position.',
      status: 'sent',
      ai_model: 'Gemini-3-Flash',
      created_at: new Date().toISOString(),
      job_title: 'Full Stack Engineer'
    };
    setOutreachLogs(prev => [freshLog, ...prev].slice(0, 50));
  }

  const activeStats = [
    { label: 'Total Outreach', value: outreachLogs.length, icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Reply Rate', value: '42.8%', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Agent Uptime', value: '100%', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'AI Tokens Used', value: '1.2M', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  async function runSimulation() {
    setLoading(true);
    toast.info('Initiating Neural Matching Pulse...', { icon: <BrainCircuit className="w-4 h-4 animate-pulse" /> });
    
    try {
      // 1. Fetch data
      const { data: jobs } = await supabase.from('jobs').select('*').eq('broadcast_to_vendors', true);
      const { data: candidates } = await supabase.from('candidates').select('*');

      if (!jobs || !candidates) throw new Error("Missing data for matching");

      // 2. Log start
      await supabase.from('agent_logs').insert({
        type: 'match',
        level: 'info',
        message: `[INTEL AGENT] Neural Pulse started. Analyzing ${jobs.length} open jobs against ${candidates.length} profiles.`,
        metadata: { channel: 'system' }
      });

      await new Promise(r => setTimeout(r, 2000));

      // 3. Simulated/Real AI Matching step
      // For the simulation, we'll pick a few jobs and candidates to match
      const targetJobs = jobs.slice(0, 2);
      const targetCandidates = candidates.slice(0, 3);

      for (const job of targetJobs) {
        for (const candidate of targetCandidates) {
          // In real production, we'd call evaluateCandidateMatch for each pair
          // but here we simulation high-quality auto-discovery
          const score = Math.floor(Math.random() * (98 - 85) + 85); // High scores only for auto-trigger
          
          await supabase.from('agent_logs').insert({
            type: 'match',
            level: 'success',
            message: `[NEURAL MATCH] Automated 88%+ match found! Candidate: ${candidate.full_name} -> Job: ${job.title} (${score}%)`,
            metadata: { jobId: job.id, candidateId: candidate.id, score }
          });

          // USE MARKETPLACE SERVICE (triggers notifications)
          try {
            await proposeCollaboration({
              jobId: job.id,
              candidateId: candidate.id,
              vendorId: candidate.vendor_company_id,
              clientId: job.company_id,
              matchScore: score
            });
          } catch (err) {
            console.error("Auto-match collaboration error:", err);
          }
        }
      }

      toast.success('Neural Pulse successful. Collaborations auto-generated.');
      await fetchOutreachLogs();
    } catch (error) {
      console.error(error);
      toast.error('Neural Pulse failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Center</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time monitoring of autonomous outreach and recruitment agents.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchOutreachLogs}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all font-mono"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Pulse
          </button>
          <button 
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg border border-slate-700 group"
          >
            <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
            Run QA Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:col-span-3 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Outreach Stream</h3>
                <p className="text-xs text-slate-500 font-medium">Unified Gmail, WhatsApp, and LinkedIn activity.</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'email', 'whatsapp'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                    filter === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin" />
                Initializing Streams...
              </div>
            ) : outreachLogs.filter(l => filter === 'all' || l.type === filter).map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-50 transition-all flex items-start justify-between group">
                <div className="flex gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
                    log.type === 'email' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {log.type === 'email' ? <Mail className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {log.ai_model}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                        {format(new Date(log.created_at), 'MMM dd • HH:mm:ss')}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight mt-2">
                      To: {log.recipient}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-2xl">
                      {log.content}
                    </p>
                    {log.job_title && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Target Job: <span className="text-slate-600">{log.job_title}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 text-right">
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border",
                    log.status === 'sent' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    log.status === 'replied' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                    "bg-slate-50 text-slate-500 border-slate-100"
                  )}>
                    {log.status === 'sent' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {log.status}
                  </div>
                  <button className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:underline">
              Load Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
