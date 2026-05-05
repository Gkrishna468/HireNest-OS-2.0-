import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3, 
  Activity, 
  Brain,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';

export default function AIMonitor() {
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    successRate: 0,
    avgLatency: 0,
    statusCounts: { success: 0, failed: 0, pending: 0, info: 0 }
  });
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    setLogs(data || []);

    // Calculate metrics
    const total = data?.length || 0;
    const successes = data?.filter(l => l.status === 'success').length || 0;
    const failures = data?.filter(l => l.status === 'failed').length || 0;
    const latencySum = data?.reduce((acc, l) => acc + (l.metadata?.latency_ms || 0), 0) || 0;
    const latencyCount = data?.filter(l => l.metadata?.latency_ms).length || 1;

    setMetrics({
      total,
      successRate: total > 0 ? (successes / total) * 100 : 0,
      avgLatency: Math.round(latencySum / latencyCount),
      statusCounts: {
        success: successes,
        failed: failures,
        pending: data?.filter(l => l.status === 'pending').length || 0,
        info: data?.filter(l => l.status === 'info').length || 0
      }
    });

    // Simple time series (by minute/hour)
    const seriesMap: Record<string, number> = {};
    data?.forEach(l => {
      const date = new Date(l.created_at);
      const key = `${date.getHours()}:${date.getMinutes()}`;
      seriesMap[key] = (seriesMap[key] || 0) + 1;
    });
    const series = Object.entries(seriesMap).map(([time, count]) => ({ time, count })).reverse().slice(0, 20);
    setTimeSeries(series);

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600" />
            AI Intelligence Monitor
          </h1>
          <p className="text-slate-500 mt-1">Real-time health of neural matching, autonomous agents, and strategic decision loops.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
        >
          <Clock className="w-4 h-4" />
          Refresh Nodes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Neural Accuracy', value: `${metrics.successRate.toFixed(1)}%`, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Avg Latency', value: `${metrics.avgLatency}ms`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Inferences', value: metrics.total, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'System Guardrails', value: 'Active', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(card => (
          <div key={card.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg", card.bg)}>
                <card.icon className={cn("w-5 h-5", card.color)} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-6">Inference Throughput (Last 100 Calls)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-6">Status Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { status: 'Success', value: metrics.statusCounts.success, fill: '#10b981' },
                { status: 'Info', value: metrics.statusCounts.info, fill: '#6366f1' },
                { status: 'Pending', value: metrics.statusCounts.pending, fill: '#94a3b8' },
                { status: 'Failed', value: metrics.statusCounts.failed, fill: '#ef4444' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">Neural Activity Logs</h3>
          <span className="text-xs font-medium text-slate-400">Showing last 100 actions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-700">Timestamp</th>
                <th className="px-6 py-4 font-bold text-slate-700">Agent</th>
                <th className="px-6 py-4 font-bold text-slate-700">Action/Message</th>
                <th className="px-6 py-4 font-bold text-slate-700">Latency</th>
                <th className="px-6 py-4 font-bold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                          {log.agent_name || log.type}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium max-w-md truncate">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {log.metadata?.latency_ms ? (
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {log.metadata.latency_ms}ms
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider",
                      log.status === 'success' ? "text-emerald-600" :
                      log.status === 'failed' ? "text-rose-600" :
                      "text-slate-400"
                    )}>
                      {log.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {log.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
