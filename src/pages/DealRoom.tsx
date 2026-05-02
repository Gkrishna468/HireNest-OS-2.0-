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
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DealRoom() {
  const { clients, jobs, candidates, deals } = useData();

  // Calculate real revenue stats from deals table
  const totalPipeline = deals.reduce((sum, d) => sum + (Number(d.revenue_amount) || 0), 0);
  const realizedRevenue = deals.filter(d => d.payment_received).reduce((sum, d) => sum + (Number(d.revenue_amount) || 0), 0);
  const pendingPayouts = deals.filter(d => !d.payment_received).reduce((sum, d) => sum + (Number(d.payout_amount) || 0), 0);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  const revenueStats = [
    { label: 'Pipeline Value', value: formatCurrency(totalPipeline), trend: '+12.5%', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Projected Monthly', value: formatCurrency(totalPipeline * 0.4), trend: '+4.2%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Pending Payouts', value: formatCurrency(pendingPayouts), trend: '-2.1%', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Realized Revenue', value: formatCurrency(realizedRevenue), trend: '+18.1%', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Deal Room</h1>
          <p className="text-slate-500 mt-1">Unified command for revenue flow, placement tracking, and account value.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
          <CircleDollarSign className="w-5 h-5" />
          New Deal Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn(stat.bg, "p-3 rounded-xl transition-transform group-hover:scale-110")}>
                <stat.icon className={cn(stat.color, "w-6 h-6")} />
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-lg",
                stat.trend.startsWith('+') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Active Deal Pipelines</h3>
              <div className="flex gap-2">
                {['All', 'Interview', 'Offer', 'Placed'].map(f => (
                  <button key={f} className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg border transition-all",
                    f === 'All' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {deals.length > 0 ? (
                deals.map((deal, i) => (
                  <div key={deal.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-6 group">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{deal.client_name}</h4>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-medium text-slate-500 truncate">{deal.job_title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="w-3 h-3" />
                          {deal.candidate_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(deal.revenue_amount)}</p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                        deal.status === 'placed' ? "bg-green-100 text-green-700" :
                        deal.status === 'offered' ? "bg-blue-100 text-blue-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {deal.status}
                      </span>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-slate-400">
                  <p>No active deals in the pipeline yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-6">Revenue Intelligence</h3>
            <div className="space-y-6">
              {[
                { label: 'Avg Deal Size', value: '₹1.15L', icon: CircleDollarSign },
                { label: 'Time to Close', value: '18 Days', icon: Clock },
                { label: 'Success Rate', value: '72%', icon: ArrowUpRight },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5 rotate-12">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h3 className="font-bold text-slate-900 mb-4">Strategic Goals</h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Monthly Target</p>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-bold text-slate-900">₹12.0L</span>
                  <span className="text-sm font-medium text-indigo-600">70% Reached</span>
                </div>
                <div className="mt-2 w-full h-1.5 bg-indigo-200/50 rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-indigo-600 rounded-full" />
                </div>
              </div>
              <button className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                Configure KPIs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
