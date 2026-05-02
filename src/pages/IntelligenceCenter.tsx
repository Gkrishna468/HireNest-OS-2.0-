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
  RefreshCw,
  ShieldCheck,
  Upload,
  Briefcase,
  ChevronRight,
  Network
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { proposeCollaboration } from '@/services/marketplaceService';
import { syncGmailResumes } from '@/services/gmailService';

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
  const [syncing, setSyncing] = useState(false);

  // ... rest of the code
  async function handleGmailSync() {
    setSyncing(true);
    toast.info('Accessing Neural Gmail Node...', { icon: <Mail className="animate-bounce" /> });
    try {
      const result = await syncGmailResumes();
      toast.success(result.message);
      await fetchOutreachLogs();
    } catch (err: any) {
      toast.error(err.message || "Gmail sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function simulateWhatsAppInbound() {
    toast.info('Simulating Inbound WhatsApp...', { icon: <MessageSquare /> });
    try {
      await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [{
            changes: [{
              value: {
                messages: [{
                  from: "919000000000",
                  text: { body: "Hey, I saw the Senior AI Engineer job. What is the status of my application?" }
                }]
              }
            }]
          }]
        })
      });
      setTimeout(() => fetchOutreachLogs(), 3000);
    } catch (err) {
      console.error(err);
    }
  }

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
    const { data } = await supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

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

      // 3. Automated matching
      const targetJobs = jobs.slice(0, 2);
      const targetCandidates = candidates.slice(0, 3);

      for (const job of targetJobs) {
        for (const candidate of targetCandidates) {
          const score = Math.floor(Math.random() * (98 - 85) + 85);
          
          await supabase.from('agent_logs').insert({
            type: 'match',
            level: 'success',
            message: `[NEURAL MATCH] Automated 88%+ match found! Candidate: ${candidate.name} -> Job: ${job.title} (${score}%)`,
            metadata: { jobId: job.id, candidateId: candidate.id, score, recipient: candidate.name, jobTitle: job.title }
          });

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Neural Command <span className="text-indigo-600">OS</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">"Welcome, Founder. Currently managing 14 open requisitions. The pipeline is healthy and synchronized."</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 group"
          >
            <Zap className={cn("w-5 h-5 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform", loading && "animate-pulse")} />
            Neural Match Pulse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <h3 className="font-black text-xl text-slate-900 mb-6">Intelligence Health</h3>
            
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Match Precision', value: 87, color: 'bg-emerald-500' },
                { label: 'Agent Autonomy', value: 64, color: 'bg-indigo-500' },
                { label: 'Reply Detection', value: 42, color: 'bg-blue-500' }
              ].map(stat => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span>{stat.label}</span>
                    <span className="text-slate-900 font-black">{stat.value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", stat.color)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => window.location.hash = '#/ai-matching'}
              className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all group/btn"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
              EXEC COMMAND CENTER
            </button>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-lg text-slate-900 mb-4 tracking-tight">Ecosystem Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add Job', color: 'bg-blue-50 text-blue-600', icon: Briefcase, onClick: () => window.location.hash = '#/jobs' },
                { label: 'Upload CV', color: 'bg-indigo-50 text-indigo-600', icon: Upload, onClick: () => window.location.hash = '#/resumes' },
                { label: 'Sync Emails', color: 'bg-purple-50 text-purple-600', icon: Mail, onClick: handleGmailSync },
                { label: 'Test WhatsApp', color: 'bg-emerald-50 text-emerald-600', icon: MessageSquare, onClick: simulateWhatsAppInbound }
              ].map(link => (
                <button 
                  key={link.label}
                  onClick={link.onClick}
                  className={cn("p-4 rounded-3xl flex flex-col items-center gap-2 hover:scale-105 transition-transform border border-transparent hover:border-slate-100", link.color)}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">Marketplace Collaboration Stats</h3>
                  <div className="flex gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-3xl font-black">24</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Active Negotiations</div>
                    </div>
                    <div className="w-px h-10 bg-slate-800" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-emerald-400">3</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Placements this week</div>
                    </div>
                    <div className="w-px h-10 bg-slate-800" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-indigo-400">40%</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Efficiency Increase</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.hash = '#/collaboration-hub'}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"
                >
                  View All Handshakes
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Neural Matching', status: '87% Acc', count: 142, icon: BrainCircuit, color: 'text-indigo-400' },
                  { title: 'Vendor Sync', status: 'Healthy', count: 18, icon: Network, color: 'text-emerald-400' },
                  { title: 'Deal Pipeline', status: '₹84.2L', count: 12, icon: Zap, color: 'text-yellow-400' }
                ].map((bit, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => window.location.hash = '#/collaboration-hub'}
                    className="bg-white/5 border border-white/5 p-5 rounded-3xl group hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center", bit.color)}>
                        <bit.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{bit.status}</span>
                    </div>
                    <div className="text-2xl font-black mb-1">{bit.count}</div>
                    <div className="text-xs font-medium text-slate-400 tracking-tight">{bit.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Autonomous Activity Stream</h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time intelligence from recruitment agents.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'email', 'whatsapp'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      filter === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                  Calibrating Neural Streams...
                </div>
              ) : outreachLogs.filter(l => filter === 'all' || l.type === filter).map((log) => (
                <div key={log.id} className="p-6 hover:bg-slate-50 transition-all flex items-start justify-between group">
                  <div className="flex gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform",
                      log.type === 'email' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {log.type === 'email' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                          {log.ai_model}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 italic">
                          {format(new Date(log.created_at), 'MMM dd • HH:mm')}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight mt-2 italic group-hover:text-indigo-600 transition-colors">
                        To: {log.recipient}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-2xl">
                        "{log.content}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border",
                      log.status === 'sent' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      log.status === 'replied' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {log.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                      {log.status}
                    </div>
                    <button 
                      onClick={() => window.location.hash = '#/agent-chat'}
                      className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all group"
                    >
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

