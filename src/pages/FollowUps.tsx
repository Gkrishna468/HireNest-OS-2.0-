/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { 
  History, 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  MoreVertical, 
  User, 
  Building2, 
  Truck,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeArray, safeString, safeDate } from '@/utils/safe';

export default function FollowUps() {
  const { clients, vendors, candidates, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Derive follow-ups from actual data
  const followups = [
    ...candidates.filter(c => c.stage === 'screening').map(c => ({
      id: `cand-${c.id}`,
      type: 'candidate',
      entity: c.name,
      message: `Initial screening pending for ${c.jobTitle || 'Active Role'}. Check resume and schedule intro call.`,
      dueDate: new Date(new Date(safeDate(c.createdAt)).getTime() + 172800000).toISOString(),
      status: (new Date(safeDate(c.createdAt)).getTime() + 172800000) < Date.now() ? 'overdue' : 'pending'
    })),
    ...candidates.filter(c => c.stage === 'offer').map(c => ({
      id: `offer-${c.id}`,
      type: 'candidate',
      entity: c.name,
      message: `Offer sent. Pending confirmation and background check verification.`,
      dueDate: new Date(new Date(safeDate(c.updatedAt || c.createdAt)).getTime() + 86400000).toISOString(),
      status: (new Date(safeDate(c.updatedAt || c.createdAt)).getTime() + 86400000) < Date.now() ? 'overdue' : 'pending'
    })),
    ...clients.slice(0, 2).map(cl => ({
      id: `client-${cl.id}`,
      type: 'client',
      entity: cl.company,
      message: `Monthly account review and new budget discussion for upcoming quarters.`,
      dueDate: new Date(Date.now() + 259200000).toISOString(),
      status: 'pending'
    }))
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'client': return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'vendor': return <Truck className="w-4 h-4 text-orange-500" />;
      case 'candidate': return <User className="w-4 h-4 text-indigo-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline & Nurture</h1>
          <p className="text-slate-500 mt-1">Automated relationship management and critical pipeline reminders.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['Pending', 'Completed', 'History'].map(tab => (
            <button key={tab} className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
              tab === 'Pending' ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-400 hover:text-slate-900"
            )}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-200" />
              Pulse Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-200 font-bold uppercase tracking-widest">Active Tasks</span>
                <span className="text-lg font-bold">14</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-200 font-bold uppercase tracking-widest">Overdue</span>
                <span className="text-lg font-bold text-red-300">2</span>
              </div>
              <button className="w-full bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10">  
                Run Sync Agent
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              Segmentation
            </h3>
            <div className="space-y-2">
              {['All Entities', 'Clients Only', 'Vendors Only', 'Candidates Only'].map(cat => (
                <button key={cat} className="w-full text-left p-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {followups.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group border-l-4 overflow-hidden relative" 
              style={{ borderLeftColor: item.status === 'overdue' ? '#ef4444' : item.type === 'client' ? '#3b82f6' : item.type === 'vendor' ? '#f59e0b' : '#6366f1' }}>
              <div className="flex items-center gap-6">
                <div className="shrink-0 p-3 bg-slate-50 rounded-xl group-hover:scale-105 transition-transform duration-300">
                  {getEntityIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.entity}</h4>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded uppercase tracking-tighter border border-slate-200">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">{item.message}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      item.status === 'overdue' ? "text-red-500" : "text-slate-400"
                    )}>
                      {item.status === 'overdue' ? 'Overdue' : 'Due'}
                    </p>
                    <p className="text-sm font-bold text-slate-900">{safeDate(item.dueDate)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-none hover:shadow-md active:scale-95">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
