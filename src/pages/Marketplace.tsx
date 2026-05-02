import React from 'react';
import { 
  Building2, 
  FileText, 
  Handshake, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Plus
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

export default function Marketplace() {
  const { clients, vendors, jobs } = useData();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ecosystem Explorer</h1>
          <p className="text-slate-500 font-medium mt-1">Global view of clients, vendors, and cross-company collaborations.</p>
        </div>
        <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
          <Plus className="w-4 h-4" />
          Onboard New Org
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Companies Stats */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Marketplace Volume</h3>
            <div className="space-y-6">
              {[
                { label: 'Client Partners', value: clients.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Vendor Network', value: vendors.length, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Active Broadcasts', value: jobs.filter(j => j.status === 'open').length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
             <h3 className="text-lg font-black mb-4 tracking-tight">Contract Enforcement</h3>
             <p className="text-slate-400 text-xs leading-relaxed mb-6">Automated MSA and NDA verification for all marketplace transactions.</p>
             <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Pending MSA</span>
                 <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[9px] font-black">4 ORGS</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Active NDAs</span>
                 <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black">18 ORGS</span>
               </div>
             </div>
             <button className="w-full mt-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
               Launch Compliance Audit
             </button>
          </div>
        </div>

        {/* Right: Live Network Map/Feed */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Handshake Pipeline</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                Live Network Activity
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {jobs.slice(0, 5).map((job, i) => (
              <div key={i} className="p-6 rounded-3xl border border-slate-50 bg-slate-50/30 flex items-center justify-between group hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all duration-500">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight">{job.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Broadcasted to 12 Vendors</span>
                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-xs font-bold text-indigo-600 italic">Net Budget: ₹{(job.budget * 0.8 / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(v => (
                      <div key={v} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">V{v}</div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">+8</div>
                  </div>
                  <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 tracking-tight uppercase tracking-widest">Marketplace Collaboration Stats</p>
                <p className="text-[11px] text-indigo-600 font-bold">24 Active Negotiations • 3 Placements this week • 40% Efficiency Increase</p>
              </div>
            </div>
            <button className="text-xs font-black text-indigo-600 hover:underline underline-offset-4">View All Handshakes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    </div>
  );
}
