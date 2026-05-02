import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Settings, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Bot, 
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function WhatsAppCenter() {
  const [activeTab, setActiveTab] = useState<'conversations' | 'automations' | 'config'>('conversations');
  const [isSimulating, setIsSimulating] = useState(false);
  const [linkedAccount, setLinkedAccount] = useState({
    name: 'HireNest Business - Primary',
    number: '+91 98765 43210',
    status: 'connected',
    provider: 'Meta Business API',
    webhook: window.location.origin + '/api/webhooks/whatsapp'
  });

  async function runBroadcastSimulation() {
    setIsSimulating(true);
    toast.info('Initiating Marketplace WhatsApp Broadcast...', { icon: <Zap className="w-4 h-4 text-amber-500" /> });
    
    await new Promise(r => setTimeout(r, 1500));
    
    // Log step 1
    await supabase.from('agent_logs').insert({
      type: 'outreach',
      level: 'info',
      message: '[WHATSAPP] Parsing 12 active vendor-partner phone numbers for "Senior Java Architect" broadcast.',
      metadata: { channel: 'whatsapp', step: 1 }
    });

    await new Promise(r => setTimeout(r, 1500));

    // Log step 2
    await supabase.from('agent_logs').insert({
      type: 'outreach',
      level: 'success',
      message: '[WHATSAPP] 12 Template messages delivered. Monitoring for read-receipts and automated parsing of replies.',
      metadata: { channel: 'whatsapp', step: 2, recipientCount: 12 }
    });

    toast.success('Broadcast successfully delivered to vendor pool.');
    setIsSimulating(false);
  }

  const automations = [
    { id: 1, name: 'Vendor Broadcast Notification', trigger: 'Job Post (Broadcast=True)', action: 'WhatsApp Template Message to 50+ Vendors', status: 'active' },
    { id: 2, name: 'Candidate Interview Reminder', trigger: 'Collaboration Status -> Interviewing', action: 'WhatsApp Template with Calendar Link', status: 'active' },
    { id: 3, name: 'AI Auto-Reply (Unread)', trigger: 'Inbound message > 2 hours', action: 'Gemini-Flash Sentiment Match + Reply', status: 'active' },
    { id: 4, name: 'Weekly Merchant Summary', trigger: 'Monday 09:00 AM', action: 'Business Metric Digest to Admin', status: 'paused' },
  ];

  const mockMessages = [
    { id: 1, type: 'inbound', from: 'Rajesh (Staffing Pro)', text: 'Interested in the Senior AI position. When can we chat?', time: '10:45 AM', status: 'read' },
    { id: 2, type: 'outbound', from: 'AI Agent', text: 'Hello Rajesh! I can schedule a call for tomorrow at 2 PM. Does that work?', time: '10:46 AM', status: 'sent' },
    { id: 3, type: 'inbound', from: 'Amit (Apex HR)', text: 'Profile for Siddharth sent via email. 94% match score as requested.', time: '09:30 AM', status: 'read' },
    { id: 4, type: 'outbound', from: 'System', text: 'BROADCAST: New Java Architect position open in Bengaluru. Budget: 40L.', time: '08:00 AM', status: 'delivered' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">WhatsApp Business Command</h1>
          <p className="text-slate-500 font-medium mt-1">Industrial-grade communication automation for your recruitment ecosystem.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={runBroadcastSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            <Zap className={cn("w-4 h-4", isSimulating && "animate-pulse")} />
            Test Live Broadcast
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            API Connected
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30">
          {[
            { id: 'conversations', label: 'Live Stream', icon: MessageSquare },
            { id: 'automations', label: 'Automation Engine', icon: Zap },
            { id: 'config', label: 'API Configuration', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-8 py-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all relative",
                activeTab === tab.id ? "text-indigo-600 bg-white" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8">
          {activeTab === 'conversations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              {/* Message Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                    Last sync: Just now
                  </div>
                </div>

                <div className="space-y-4">
                  {mockMessages.map(msg => (
                    <div key={msg.id} className={cn(
                      "p-5 rounded-2xl flex items-start gap-4 transition-all hover:shadow-md border",
                      msg.type === 'inbound' ? "bg-white border-slate-100" : "bg-indigo-50/30 border-indigo-100 ml-12"
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        msg.type === 'inbound' ? "bg-slate-100 text-slate-600" : "bg-indigo-600 text-white"
                      )}>
                        {msg.from === 'AI Agent' ? <Bot className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.from} • {msg.time}</span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">{msg.status}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8">
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Linked Identity</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Business Name</span>
                      <span className="text-sm font-black tracking-tight">{linkedAccount.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</span>
                      <span className="text-sm font-mono text-emerald-400 font-bold">{linkedAccount.number}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase">Verified Merchant</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <div className="text-xl font-black text-slate-900">124</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Sent today</div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <div className="text-xl font-black text-slate-900">42</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Unread</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Automation Workflows</h3>
                  <p className="text-slate-500 text-xs font-medium">Auto-trigger messages based on system events.</p>
                </div>
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Logic
                </button>
              </div>

              <div className="space-y-4">
                {automations.map(auto => (
                  <div key={auto.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-200 transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                        auto.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                      )}>
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-black text-slate-900 tracking-tight">{auto.name}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                            auto.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {auto.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[11px] font-medium text-slate-500 italic">IF: {auto.trigger}</span>
                          <span className="text-slate-200">→</span>
                          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">THEN: {auto.action}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="max-w-2xl space-y-8">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                  <LinkIcon className="w-5 h-5 text-indigo-600" />
                  Meta Webhook Configuration
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payload URL (Copy to Meta Dashboard)</label>
                    <code className="block p-4 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-indigo-600 break-all select-all">
                      {linkedAccount.webhook}
                    </code>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verify Token</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value="hirenest_secure_auth_v1" 
                        readOnly 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-mono pr-12 focus:ring-indigo-500" 
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-all">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Required Permissions</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {['messages', 'message_deliveries', 'message_reads', 'template_status_update'].map(p => (
                        <div key={p} className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
