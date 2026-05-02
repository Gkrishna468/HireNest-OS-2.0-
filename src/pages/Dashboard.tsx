/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Briefcase, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock,
  CircleDollarSign,
  Zap,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  const { jobs, candidates, clients, vendors, logs, deals } = useData();
  const { user } = useAuth();

  const totalRevenue = deals.reduce((sum, d) => sum + (Number(d.revenue_amount) || 0), 0);
  const closedDeals = deals.filter(d => d.status === 'placed').length;

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'admin': return { title: `Welcome back, ${user.name}`, sub: 'Founding Director • Ecosystem overview and live intelligence feed.' };
      case 'client_manager': return { title: `Client Portal: ${user.name}`, sub: 'Managing your active requisitions and candidate collaborations.' };
      case 'vendor_manager': return { title: `Vendor Workspace: ${user.name}`, sub: 'Tracking your submissions and marketplace engagement.' };
      default: return { title: `Welcome, ${user?.name}`, sub: 'Hiring Ecosystem Dashboard' };
    }
  };

  const welcome = getWelcomeMessage();

  const stats = [
    { label: user?.role === 'vendor_manager' ? 'Active Subs' : 'Total Jobs', value: jobs.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Intelligence Pipeline', value: candidates.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Network Points', value: (clients.length + vendors.length), icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Success Rate', value: jobs.length > 0 ? `${((closedDeals / jobs.length) * 100).toFixed(0)}%` : '0%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'System Health', value: '99.9%', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{welcome.title}</h1>
          <p className="text-slate-500 font-medium mt-1">{welcome.sub}</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{user?.role} MODE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={stat.bg + " p-3 rounded-xl transition-transform group-hover:scale-110"}>
                <stat.icon className={stat.color + " w-6 h-6"} />
              </div>
              <ArrowUpRight className="text-slate-300 group-hover:text-slate-900 transition-colors" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Recent Activity Agents</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live Sync
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {logs.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                    <div className="mt-1">
                      {log.level === 'error' ? (
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                          <Clock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-medium">{log.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 font-mono uppercase">{log.type}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400 italic">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-20 text-slate-400 text-center">
                <Bot className="w-12 h-12 mb-4 opacity-20" />
                <p>No agent activity yet.</p>
                <p className="text-sm mt-1">Agents automatically log activity here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">AI Copilot Intelligence</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Welcome, Founder. Currently managing {jobs.length} open requisitions.
                {candidates.filter(c => c.stage === 'screening').length > 0 ? 
                  ` There are ${candidates.filter(c => c.stage === 'screening').length} candidates pending screening.` : 
                  " The pipeline is healthy and synchronized."}
              </p>
              <button 
                onClick={() => window.location.href = '/matching'}
                className="w-full bg-white text-slate-900 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
              >
                Run Neural Review
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 rotate-12 transition-transform group-hover:rotate-0">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Intelligence Health</h3>
              <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
            </div>
            <div className="space-y-5">
              {[
                { label: 'Match Precision', value: 87, color: 'bg-emerald-500' },
                { label: 'Agent Autonomy', value: 64, color: 'bg-indigo-500' },
                { label: 'Reply Detection', value: 42, color: 'bg-blue-500' },
              ].map(stat => (
                <div key={stat.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{stat.label}</span>
                    <span className="text-slate-900">{stat.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={stat.color + " h-full rounded-full transition-all duration-1000"} style={{ width: `${stat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => window.location.href = '/exec-suite'}
              className="w-full mt-6 py-3 text-[10px] font-black text-white bg-slate-900 rounded-xl hover:bg-indigo-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3 h-3" />
              Exec Command Center
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Ecosystem Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add Job', color: 'bg-blue-50 text-blue-600' },
                { label: 'Upload CV', color: 'bg-indigo-50 text-indigo-600' },
                { label: 'Sync Emails', color: 'bg-purple-50 text-purple-600' },
                { label: 'Run Audit', color: 'bg-emerald-50 text-emerald-600' },
              ].map(link => (
                <button key={link.label} className={link.color + " p-3 text-sm font-semibold rounded-xl text-center hover:opacity-80 transition-opacity"}>
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stub for Bot icon since it might not be in sidebar list but likely in lucide
const Bot = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="10" x="3" y="11" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" x2="8" y1="16" y2="16" /><line x1="16" x2="16" y1="16" y2="16" /></svg>
);
