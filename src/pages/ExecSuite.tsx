import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  Zap, 
  DollarSign, 
  Users, 
  Briefcase,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { getFinancialInsights, DashboardFinancials } from '@/services/financialService';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

export default function ExecSuite() {
  const { candidates, jobs } = useData();
  const [financials, setFinancials] = useState<DashboardFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getFinancialInsights();
      setFinancials(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-widest text-[10px] uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            Strategic Command Center
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Gopala Krishna</span></h1>
          <p className="text-slate-500 text-sm mt-1">Founding Director | HireNest AI Operating System v1.4</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Neural Core: Active</span>
          </div>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
            <Zap className="w-3 h-3" />
            AI Strategy Session
          </button>
        </div>
      </div>

      {/* CFO Multipliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${(financials?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Projected Flow', value: `₹${(financials?.projectedRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Operational Efficiency', value: `${financials?.roi || 0}%`, icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Cost Per Hire', value: `₹${(financials?.costPerHire || 0).toLocaleString()}`, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-inner", stat.bg, stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CEO Priorities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">AI CEO: Strategic Initiatives</h2>
                <p className="text-slate-500 text-xs mt-0.5">High-impact tasks identified by Neural Crew</p>
              </div>
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="space-y-4">
              {[
                { title: 'Fill Senior Cloud Architect at TechGlobal', impact: 'High', revenue: '₹4,50,000', progress: 85, color: 'bg-indigo-600' },
                { title: 'Onboard 5 New Vendors in Logistics Vertical', impact: 'Medium', revenue: '₹12,00,000', progress: 40, color: 'bg-purple-600' },
                { title: 'Auto-Reject Low Matching Candidates (Batch)', impact: 'Efficiency', revenue: 'Saved 12h', progress: 100, color: 'bg-emerald-600' },
              ].map((item, i) => (
                <div key={i} className="group p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1 underline decoration-indigo-200 underline-offset-4">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Impact: {item.impact}</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Value: {item.revenue}</span>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence Health */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Cpu className="w-32 h-32" />
            </div>
            
            <h3 className="font-bold text-indigo-400 uppercase tracking-widest text-[10px] mb-2">Neural Engine Health</h3>
            <div className="text-4xl font-black mb-6">98.4%</div>
            
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Resume Ingestion', status: 'Optimal', active: true },
                { label: 'Candidate Matching', status: 'High Precision', active: true },
                { label: 'Auto-Outreach', status: 'Running', active: true },
                { label: 'Financial Guardrails', status: 'Active', active: true }
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{service.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{service.status}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800 text-slate-400 text-[10px] leading-relaxed">
              *System training complete. Self-optimization agent is currently processing 1,248 historical patterns.
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Ecosystem Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                  {jobs.length}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Jobs</div>
                  <div className="text-sm font-black text-slate-900">₹1.2Cr Pipeline</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black">
                  {candidates.length}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidates</div>
                  <div className="text-sm font-black text-slate-900">42% Match Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
