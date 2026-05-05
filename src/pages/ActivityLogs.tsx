import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { History, Search, Filter, Info, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(200);
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-600" />
            System Activity Logs
          </h1>
          <p className="text-slate-500 mt-1">Audit trail for all AI agent decisions, data extractions, and system events.</p>
        </div>
        <div className="flex gap-2">
           {['all', 'success', 'failed', 'info'].map((s) => (
             <button 
               key={s}
               onClick={() => setFilter(s)}
               className={cn(
                 "px-4 py-2 rounded-xl font-bold transition-all text-sm capitalize",
                 filter === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
               )}
             >
               {s}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-700">Timestamp</th>
              <th className="px-6 py-4 font-bold text-slate-700">Agent/Type</th>
              <th className="px-6 py-4 font-bold text-slate-700">Message</th>
              <th className="px-6 py-4 font-bold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4 h-16 bg-slate-50/50" colSpan={4} />
                </tr>
              ))
            ) : logs.length > 0 ? (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {log.agent_name || log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-2 p-2 bg-slate-50 rounded text-[10px] text-slate-500 overflow-x-auto max-w-lg">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      log.status === 'success' ? "bg-green-100 text-green-700" :
                      log.status === 'failed' ? "bg-red-100 text-red-700" :
                      log.status === 'info' ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-400"
                    )}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
