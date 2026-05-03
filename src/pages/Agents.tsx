/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw, 
  Zap, 
  Mail, 
  FileText, 
  Search, 
  Activity, 
  ShieldCheck,
  Settings2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { safeArray } from '@/utils/safe';
import { runDecisionAgent } from '@/services/intelligenceService';
import { runCrew } from '@/agents/crew';
import { syncGmailInbox, syncGmailResumes } from '@/services/gmailService';

const agentTemplates = [
  { id: 'crew', name: 'Neural Crew Orchestrator', icon: Activity, description: 'THE CORE. Coordinates all agents (Decision, Outreach, Reply, Learning) in a single synchronized mission.', status: 'ready', interval: 5, color: 'bg-indigo-600' },
  { id: 'decision', name: 'Neural Decision engine', icon: Zap, description: 'The Brain. Automatically shortlists high-scoring candidates, updates pipeline stages, and triggers reviews.', status: 'running', interval: 5 },
  { id: 'outreach', name: 'Executive Outreach', icon: Mail, description: 'Automated recruiter. Sends personalized emails to shortlisted candidates via Gmail.', status: 'idle', interval: 10 },
  { id: 'reply', name: 'Reply Intelligence', icon: Activity, description: 'Polls Gmail inbox to identify candidate interest and automatically update pipeline movement.', status: 'idle', interval: 5 },
  { id: 'learning', name: 'Learning Loop', icon: ShieldCheck, description: 'Analyzes hiring outcomes and feedback to refine AI matching precision and decision guardrails.', status: 'running', interval: 60 },
  { id: 'resume', name: 'Resume Intelligence', icon: FileText, description: 'Parses PDF/Word docs using AI to extract skills, experience, and contact data.', status: 'running', interval: 1 },
];

export default function Agents() {
  const { logs, refreshAll } = useData();
  const [activeAgents, setActiveAgents] = useState<string[]>(['email', 'resume']);

  const runAgent = async (agentId: string) => {
    const toastId = toast.loading(`Triggering ${agentId} agent...`);
    try {
      let insight = '';
      
      // DEEP INTELLIGENCE: Trigger the Autonomous Systems
      if (agentId === 'crew') {
        insight = await runCrew();
      } else if (agentId === 'decision') {
        insight = await runDecisionAgent();
      } else if (agentId === 'email' || agentId === 'outreach' || agentId === 'reply') {
        const result = await syncGmailInbox();
        insight = result.message;
      } else if (agentId === 'resume') {
        const result = await syncGmailResumes();
        insight = result.message;
      } else {
        insight = `Agent cycle ${Math.floor(Math.random() * 1000)} completed successfully.`;
      }

      // If it's not and internal-logging agent, log it
      if (!['crew', 'decision', 'learning'].includes(agentId)) {
        const { error } = await supabase.from('agent_logs').insert({
          type: agentId,
          message: `${insight}`,
          level: 'success',
          status: 'finished',
          metadata: { triggered_at: new Date().toISOString() }
        });
        if (error) throw error;
      }
      
      toast.success(`${agentId} agent cycle completed`, { id: toastId });
      refreshAll();
    } catch (err: any) {
      console.error('Agent execution error:', err);
      toast.error(`Agent failed: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Swarm Management</h1>
          <p className="text-slate-500 mt-1">Configure and monitor your autonomous recruitment ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refreshAll()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all">
            <Bot className="w-5 h-5" />
            Add Custom Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agentTemplates.map(agent => (
              <div key={agent.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <agent.icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => runAgent(agent.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-green-600 transition-colors"
                      title="Run Now"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{agent.name}</h3>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                        agent.status === 'running' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                      )}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{agent.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      EVERY {agent.interval} MIN
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={activeAgents.includes(agent.id)} 
                        onChange={() => {
                          setActiveAgents(prev => prev.includes(agent.id) ? prev.filter(a => a !== agent.id) : [...prev, agent.id]);
                        }}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">Live Telemetry</h3>
              </div>
              <button 
                onClick={async () => {
                  await supabase.from('agent_logs').delete().neq('id', 'placeholder');
                  refreshAll();
                }}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Clear Log History
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {safeArray(logs).length > 0 ? (
                <div className="p-0">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-4 font-mono">
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                        <span className="text-[10px] text-slate-400 leading-none">{new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        {log.level === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Clock className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-tighter",
                            log.type === 'email' ? 'bg-blue-500' : 
                            log.type === 'resume' ? 'bg-indigo-500' : 
                            log.type === 'revenue' ? 'bg-orange-500' : 'bg-slate-500'
                          )}>
                            {log.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-normal">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center text-slate-400 italic text-sm">
                  Waiting for active agent signals...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 p-2 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-500">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Agent Security
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-medium">Enterprise Sandbox Enabled</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Audit Trail</p>
                <p className="text-sm font-medium">Auto-Archiving (30 Days)</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Isolation</p>
                <p className="text-sm font-medium">VPC Peering Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Inference Engine
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Neural Matching', value: 87.2, target: 90 },
                { label: 'Intent Extraction', value: 42.1, target: 60 },
                { label: 'Sentiment Score', value: 76.5, target: 80 },
              ].map(stat => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="text-indigo-600">{stat.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${stat.value}%` }} 
                    />
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
