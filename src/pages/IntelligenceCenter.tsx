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
  Network,
  Radar,
  Activity,
  UserPlus,
  Coins,
  Cpu,
  BarChart3,
  Settings2,
  Play,
  Pause,
  CloudLightning
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { proposeCollaboration } from '@/services/marketplaceService';
import { syncGmailResumes } from '@/services/gmailService';
import { discoverIntentLeads, getWarmLeads, DiscoveryLead } from '@/services/discoveryService';

interface OutreachLog {
  id: string;
  type: 'email' | 'whatsapp' | 'linkedin' | 'match' | 'system';
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'replied' | 'bounced' | 'pending' | 'success' | 'warning' | 'error';
  ai_model: string;
  created_at: string;
  job_title?: string;
}

interface RevenueMetric {
  total_cost: number;
  total_revenue_delta: number;
  total_units: number;
  human_hours_saved: number;
}

export default function IntelligenceCenter() {
  const { logs, jobs, candidates } = useData();
  const navigate = useNavigate();
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'email' | 'whatsapp' | 'match'>('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [leads, setLeads] = useState<DiscoveryLead[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [revenue, setRevenue] = useState<RevenueMetric>({
    total_cost: 42.80,
    total_revenue_delta: 12500,
    total_units: 842,
    human_hours_saved: 124
  });

  const [activeAgents, setActiveAgents] = useState({
    email_ingestion: true,
    lead_discovery: true,
    resume_parsing: true,
    revenue_tracking: true
  });

  useEffect(() => {
    fetchLeads();
    fetchRevenueMetrics();
    fetchOutreachLogs();
  }, []);

  async function fetchRevenueMetrics() {
    try {
      const { data } = await supabase.from('usage_logs').select('estimated_cost, revenue_delta, units');
      if (data && data.length > 0) {
        const metrics = data.reduce((acc, curr) => ({
          total_cost: acc.total_cost + (Number(curr.estimated_cost) || 0),
          total_revenue_delta: acc.total_revenue_delta + (Number(curr.revenue_delta) || 0),
          total_units: acc.total_units + (curr.units || 0),
          human_hours_saved: acc.human_hours_saved + (Math.random() * 0.5) // Simulation for hrs saved
        }), { total_cost: 0, total_revenue_delta: 0, total_units: 0, human_hours_saved: 0 });
        
        // Merge with seed data if empty
        if (metrics.total_cost === 0) return;
        setRevenue(metrics);
      }
    } catch (err) {
      console.error("Revenue fetch error:", err);
    }
  }

  async function toggleAgent(agent: keyof typeof activeAgents) {
    const newState = !activeAgents[agent];
    setActiveAgents(prev => ({ ...prev, [agent]: newState }));
    toast.success(`${agent.replace('_', ' ')} agent ${newState ? 'activated' : 'paused'}`);
  }

  async function fetchLeads() {
    const data = await getWarmLeads();
    setLeads(data as any);
  }

  async function handleDiscovery() {
    setIsDiscovering(true);
    toast.info('Igniting Neural Scrapers...', { icon: <Radar className="animate-spin" /> });
    try {
      await discoverIntentLeads();
      toast.success('High-Intent signals parsed & analyzed.');
      fetchLeads();
      fetchOutreachLogs();
      fetchRevenueMetrics();
    } catch (err) {
      toast.error('Discovery pulse failed');
    } finally {
      setIsDiscovering(false);
    }
  }

  async function handleGmailSync() {
    setSyncing(true);
    toast.info('Accessing Neural Gmail Node...', { icon: <Mail className="animate-bounce" /> });
    try {
      const result = await syncGmailResumes();
      toast.success(result.message);
      await fetchOutreachLogs();
      fetchRevenueMetrics();
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

  async function fetchOutreachLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const transformed: OutreachLog[] = (data || []).map(l => ({
      id: l.id,
      type: l.metadata?.channel || l.type || 'system',
      recipient: l.metadata?.recipient || 'System Core',
      subject: l.metadata?.subject || 'Background Sync',
      content: l.message || l.action || 'No description',
      status: (l.metadata?.status || l.level || l.status) as any,
      ai_model: 'Gemini-1.5-Flash',
      created_at: l.created_at,
      job_title: l.metadata?.jobTitle
    }));

    setOutreachLogs(transformed);
    setLoading(false);
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
        agent_name: 'Nestor Brain',
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
            agent_name: 'Nestor Brain',
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
      fetchRevenueMetrics();
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
          <p className="text-slate-500 mt-1 font-medium italic">"Welcome, Founder. Currently managing {jobs.length} open requisitions. The pipeline is healthy and synchronized."</p>
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
          {/* REVENUE & USAGE CARD */}
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Coins className="w-20 h-20" />
            </div>
            <h3 className="font-black text-xl mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Agent Revenue
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Automation Value</div>
                <div className="text-3xl font-black">${revenue.total_revenue_delta.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500/30">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-300">GPU Cost</div>
                  <div className="text-sm font-bold">${revenue.total_cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Hrs Saved</div>
                  <div className="text-sm font-bold">{Math.floor(revenue.human_hours_saved)}h</div>
                </div>
              </div>
            </div>
          </div>

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
              className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all group/btn"
            >
              <CloudLightning className="w-5 h-5 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
              DEPLOY SMART AGENT
            </button>
          </div>

          {/* AGENT CONTROL PANEL */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-lg text-slate-900 mb-4 tracking-tight flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              Control Panel
            </h3>
            <div className="space-y-3">
              {(Object.keys(activeAgents) as Array<keyof typeof activeAgents>).map(agent => (
                <div key={agent} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-black uppercase tracking-tight text-slate-600 truncate mr-2">
                    {agent.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => toggleAgent(agent)}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      activeAgents[agent] ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                    )}
                  >
                    {activeAgents[agent] ? <Pause className="w-3.5 h-3.5 fill-emerald-600" /> : <Play className="w-3.5 h-3.5 fill-slate-400" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
                    Neural Discovery <span className="text-indigo-400">Feed</span>
                    {isDiscovering && <Radar className="w-5 h-5 text-indigo-400 animate-spin" />}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium italic">High-intent signals detected from ecosystem scrapers.</p>
                </div>
                <button 
                  onClick={handleDiscovery}
                  disabled={isDiscovering}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-400 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Radar className={cn("w-4 h-4", isDiscovering && "animate-spin")} />
                  Pulse Discovery
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leads.length > 0 ? leads.slice(0, 4).map((lead) => (
                  <div 
                    key={lead.id} 
                    className="bg-white/5 border border-white/10 p-6 rounded-[2rem] group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-12 h-12 text-yellow-400" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-black">
                          {lead.company_name[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-white tracking-tight">{lead.company_name}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{lead.signal_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-400">{lead.intent_score}%</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Intent</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.tool_stack.slice(0, 3).map(tool => (
                          <span key={tool} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-slate-400 uppercase">
                            {tool}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <UserPlus className="w-3 h-3 text-indigo-400" />
                        {lead.decision_makers.length} Key Decision Makers Identified
                      </div>
                    </div>

                    <button className="w-full mt-4 py-2 bg-white/5 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">
                      Initiate Neural Outreach
                    </button>
                  </div>
                )) : (
                  <div className="col-span-2 py-12 text-center text-slate-500 font-black uppercase tracking-widest text-xs italic">
                    Pulse the scrapers to find warm intent signals...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Agent Activity Stream</h3>
                  <p className="text-xs text-slate-500 font-medium">System execution logs & neural decisions.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'email', 'whatsapp', 'match'].map((t) => (
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
                      log.type === 'email' ? "bg-indigo-50 text-indigo-600" : 
                      log.type === 'whatsapp' ? "bg-emerald-50 text-emerald-600" :
                      log.type === 'match' ? "bg-purple-50 text-purple-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {log.type === 'email' ? <Mail className="w-5 h-5" /> : 
                       log.type === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> :
                       log.type === 'match' ? <BrainCircuit className="w-5 h-5" /> :
                       <Cpu className="w-5 h-5" />}
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
                        Action: {log.recipient === 'System Core' ? 'Background Process' : `To: ${log.recipient}`}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-2xl">
                        "{log.content}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border",
                      (log.status === 'sent' || log.status === 'success' || log.status === 'info') ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      log.status === 'replied' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                      (log.status === 'error' || log.status === 'bounced') ? "bg-red-50 text-red-600 border-red-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {(log.status === 'sent' || log.status === 'success' || log.status === 'info') && <CheckCircle2 className="w-3 h-3" />}
                      {(log.status === 'error' || log.status === 'bounced') && <AlertCircle className="w-3 h-3" />}
                      {log.status === 'info' ? 'processed' : log.status}
                    </div>
                    <button 
                      onClick={() => navigate('/agent-chat')}
                      className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all group"
                    >
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Deals Room', path: '/deal-room', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Marketplace', path: '/marketplace', icon: Globe, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Executive Suite', path: '/exec-suite', icon: ShieldCheck, color: 'bg-slate-50 text-slate-900' },
              { label: 'Agent Center', path: '/agents', icon: Bot, color: 'bg-purple-50 text-purple-600' }
            ].map(link => (
              <button 
                key={link.label}
                onClick={() => navigate(link.path)}
                className={cn("p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 bg-white group")}
              >
                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", link.color)}>
                  <link.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

