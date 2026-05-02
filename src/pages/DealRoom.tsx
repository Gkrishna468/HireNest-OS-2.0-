/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { 
  TrendingUp, 
  CircleDollarSign, 
  Users, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Briefcase,
  ExternalLink,
  Target,
  FileText,
  Zap,
  Lock,
  Plus,
  Send,
  XCircle,
  FileSignature
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { sendAgreement } from '@/services/legalService';

export default function DealRoom() {
  const { deals } = useData();
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showMSAModal, setShowMSAModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Calculate real revenue stats from deals table
  const totalPipeline = deals.reduce((sum, d) => sum + (Number(d.revenue_amount) || 0), 0);
  const realizedRevenue = deals.filter(d => d.status === 'placed').reduce((sum, d) => sum + (Number(d.revenue_amount) || 0), 0);
  const totalPayouts = deals.reduce((sum, d) => sum + (Number(d.payout_amount) || 0), 0);
  const netProfitEst = (realizedRevenue - (realizedRevenue * 0.18) - totalPayouts);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  const revenueStats = [
    { label: 'Neural Pipeline', value: formatCurrency(totalPipeline), trend: '+12.5%', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Realized Revenue', value: formatCurrency(realizedRevenue), trend: '+18.1%', icon: CircleDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Vendor Payouts', value: formatCurrency(totalPayouts), trend: '-2.1%', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Est. Net Profit', value: formatCurrency(netProfitEst), trend: '+14.2%', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  async function handleSendMSA() {
    if (!selectedDeal) return;
    setIsSending(true);
    toast.info('Initiating Legal Handshake...', { icon: <ShieldCheck className="animate-pulse" /> });
    
    try {
      await sendAgreement({
        dealId: selectedDeal.id,
        recipientEmail: 'client@enterprise.com',
        recipientName: selectedDeal.client_name,
        type: 'MSA'
      });
      toast.success('MSA Link Delivered via WhatsApp Agent');
      setShowMSAModal(false);
    } catch (err) {
      toast.error('Failed to trigger legal nodes');
    } finally {
      setIsSending(false);
    }
  }

  const anonymize = (name: string, type: 'CL' | 'VN', id: string) => {
    return `${type}-${id.slice(0, 4).toUpperCase()}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* MSA TRIGGER MODAL */}
      <AnimatePresence>
        {showMSAModal && selectedDeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <button onClick={() => setShowMSAModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Execute Master Agreement</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">You are about to generate a binding digital MSA for <span className="text-indigo-600 font-bold">{selectedDeal.client_name}</span>. This will be tracked in the Neural Pulse.</p>

                <div className="mt-8 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-slate-200"><ShieldCheck className="w-4 h-4 text-emerald-500" /></div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Enforce NDA clauses</span>
                    </div>
                    <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center px-1"><div className="w-3 h-3 bg-white rounded-full ml-auto" /></div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-slate-200"><Zap className="w-4 h-4 text-amber-500" /></div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Auto-Notify WhatsApp</span>
                    </div>
                    <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center px-1"><div className="w-3 h-3 bg-white rounded-full ml-auto" /></div>
                  </div>
                </div>

                <button 
                  onClick={handleSendMSA}
                  disabled={isSending}
                  className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-600/10 group"
                >
                  {isSending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  BLAST DIGITAL MSA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Financial <span className="text-indigo-600">OS</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium font-mono uppercase tracking-widest text-[10px]">Real-time Net Margin Monitoring | Enterprise Mode</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            <TrendingUp className="w-4 h-4" />
            Audit Report
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 group">
            <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Inbound Deal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat) => (
          <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className={cn(stat.bg, "p-4 rounded-3xl transition-transform group-hover:rotate-12")}>
                <stat.icon className={cn(stat.color, "w-6 h-6")} />
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-md overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Handshake Audit Log</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 italic">Tracking commercial and legal synchronization.</p>
              </div>
              <div className="flex gap-2">
                {['All', 'Legal Pending', 'Unpaid'].map(f => (
                  <button key={f} className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                    f === 'All' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="divide-y divide-slate-50">
              {deals.length > 0 ? (
                deals.map((deal, i) => (
                  <div key={deal.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center gap-6 group cursor-pointer" onClick={() => setSelectedDeal(deal)}>
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm border border-slate-100">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-slate-900 truncate text-lg group-hover:text-indigo-600 transition-colors">
                          {deal.client_name}
                        </h4>
                        <span className="text-slate-200">/</span>
                        <span className="text-sm font-bold text-slate-400 truncate tracking-tight italic">{deal.job_title}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5 text-indigo-500">
                          <Users className="w-3.5 h-3.5" />
                          {deal.candidate_name}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center gap-1",
                            deal.msa_signed ? "text-emerald-500" : "text-amber-500"
                          )}>
                            <ShieldCheck className="w-3 h-3" />
                            {deal.msa_signed ? 'MSA SIGNED' : 'MSA PENDING'}
                          </div>
                          <div className={cn(
                            "flex items-center gap-1",
                            deal.nda_signed ? "text-emerald-500" : "text-amber-500"
                          )}>
                            <Lock className="w-3 h-3" />
                            NDA SIGNED
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(deal.revenue_amount)}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-[0.15em]",
                          deal.status === 'placed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          deal.status === 'offered' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                          "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {deal.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); setShowMSAModal(true); }}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all"
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">
                  No active handshakes in the neural OS yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-transparent pointer-events-none" />
            <h3 className="text-xl font-black mb-10 tracking-tight relative z-10">CFO Audit View</h3>
            <div className="space-y-8 relative z-10">
              {[
                { label: 'Neural Margin', value: '38%', icon: TrendingUp, color: 'text-indigo-400' },
                { label: 'Tax Overhead (18%)', value: '₹4.2L', icon: Target, color: 'text-red-400' },
                { label: 'Agency Efficiency', value: 'High', icon: Zap, color: 'text-amber-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">{item.label}</div>
                      <div className="font-black text-white text-lg">{item.value}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </div>
              ))}
            </div>

            <button className="w-full mt-12 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <FileText className="w-5 h-5" />
              Download P&L Sheet
            </button>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-md relative group">
            <div className="absolute right-0 top-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <FileSignature className="w-32 h-32" />
            </div>
            <h3 className="font-black text-slate-900 mb-6 text-xl tracking-tight">Legal Health</h3>
            <div className="space-y-6">
              <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem]">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Signature Velocity</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">4.2 Days</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Top 1%</span>
                </div>
                <div className="mt-4 w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '82%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-indigo-600 rounded-full" 
                  />
                </div>
              </div>
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/10">
                Setup Legal Reminders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
