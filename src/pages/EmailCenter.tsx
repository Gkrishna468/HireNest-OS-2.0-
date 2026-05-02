import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Inbox, 
  Star, 
  Clock, 
  Trash2, 
  Search, 
  Filter, 
  Bot, 
  Zap, 
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EmailCenter() {
  const { logs } = useData();
  const [selectedMail, setSelectedMail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const mockEmails = [
    { 
      id: 1, 
      from: 'Gopala Krishna', 
      email: 'gopal@hirenestworkforce.com', 
      subject: 'Interview Confirmation: Senior React Developer', 
      body: 'Hello candidate, your interview is confirmed for tomorrow. The HireNest AI has matched your profile at 94%. We are excited to proceed.', 
      time: '12:30 PM', 
      isAi: true, 
      status: 'sent' 
    },
    { 
      id: 2, 
      from: 'Acme Staffing', 
      email: 'info@acme.com', 
      subject: 'Re: Job Broadcast: Java Architect', 
      body: 'We have 3 candidates that match the requirements perfectly. Please see attached resumes.', 
      time: '11:15 AM', 
      isAi: false, 
      status: 'received' 
    },
    { 
      id: 3, 
      from: 'HireNest Outreach', 
      email: 'agent@hirenest.com', 
      subject: 'Opportunity: AI Engineer at Global Tech', 
      body: 'I noticed your work on GitHub regarding LLMs. Based on our requirements, you would be a great fit for a Senior AI role we are currently filling.', 
      time: '09:00 AM', 
      isAi: true, 
      status: 'sent' 
    }
  ];

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700">
      {/* Sidebar: Email Folders */}
      <div className="w-64 border-r border-slate-100 bg-slate-50/30 flex flex-col p-4">
        <div className="mb-8">
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg mb-6">
            <Send className="w-4 h-4" />
            Compose
          </button>
          
          <div className="space-y-1">
            {[
              { icon: Inbox, label: 'Inbox', count: 12, active: true },
              { icon: Send, label: 'Sent', count: 45, active: false },
              { icon: Star, label: 'Starred', count: 2, active: false },
              { icon: Clock, label: 'Scheduled', count: 8, active: false },
              { icon: Trash2, label: 'Trash', count: 0, active: false },
            ].map(folder => (
              <button
                key={folder.label}
                className={cn(
                  "w-full px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all",
                  folder.active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <folder.icon className="w-4 h-4" />
                  {folder.label}
                </div>
                {folder.count > 0 && (
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black", folder.active ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500")}>
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Outreach Agent</span>
            </div>
            <p className="text-[10px] font-medium leading-relaxed opacity-90">
              Agent is currently analyzing 24 new candidate profiles for pending requisitions.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-2/3 animate-pulse" />
              </div>
              <span className="text-[9px] font-black">66%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search outreach..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {mockEmails.map(mail => (
            <button
              key={mail.id}
              onClick={() => setSelectedMail(mail)}
              className={cn(
                "w-full p-6 text-left hover:bg-slate-50 transition-all group relative",
                selectedMail?.id === mail.id && "bg-indigo-50/50"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 tracking-tight">{mail.from}</span>
                  {mail.isAi && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] font-black uppercase">AI Agent</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{mail.time}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-700 line-clamp-1">{mail.subject}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {mail.body}
              </p>
              
              <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  <Eye className="w-3.5 h-3.5" />
                  View Logic
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email Viewer */}
      <div className="flex-1 bg-slate-50/30 flex flex-col relative">
        {selectedMail ? (
          <>
            <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 font-black">
                  {selectedMail.from[0]}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedMail.subject}</h2>
                  <p className="text-xs text-slate-500 font-medium">{selectedMail.from} &lt;{selectedMail.email}&gt;</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <Star className="w-4 h-4" />
                </button>
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
                  Reply with AI
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
              <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm relative">
                {selectedMail.isAi && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Agent Generated Message
                  </div>
                )}
                
                <div className="text-slate-700 font-medium leading-loose whitespace-pre-wrap">
                  {selectedMail.body}
                </div>
                
                <div className="mt-12 pt-12 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Delivered via Primary SMTP Tunnel</span>
                  </div>
                </div>
              </div>
              
              {/* Agent reasoning section */}
              {selectedMail.isAi && (
                <div className="max-w-2xl mx-auto mt-8 p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Agent Reasoning Engine</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                        Identified candidate "Siddharth V." via LinkedIn crawler. Matched skills [React, Node, LLMs] against Senior AI Engineer requisition (ID: 4x2).
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                        Confidence score: 94%. Optimal Outreach Channel: Email (Business Hours).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
              <Mail className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select a message</h2>
            <p className="text-slate-500 text-sm max-w-sm mt-2">View real-time email outreach threads and the AI logic behind every message sent.</p>
          </div>
        )}
      </div>
    </div>
  );
}
