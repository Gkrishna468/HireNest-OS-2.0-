/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  RefreshCw, 
  Zap,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
  Briefcase,
  Users as UsersIcon,
  CircleDollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callAIQuietly } from '@/utils/ai';
import ReactMarkdown from 'react-markdown';

const agents = [
  { id: 'ceo', name: 'Chief Executive Agent', role: 'Strategy & Growth', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', prompt: 'You are the AI CEO of HireNest. Your focus is on global strategy, market positioning, and revenue growth. Use the available data to provide strategic insights.' },
  { id: 'cfo', name: 'Chief Financial Agent', role: 'Revenue & Payouts', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', prompt: 'You are the AI CFO of HireNest. Your focus is on deal margins, commission structures, and financial sustainability. Use the data to analyze ROI.' },
  { id: 'cro', name: 'Chief Revenue Agent', role: 'Deal Optimization', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', prompt: 'You are the AI CRO of HireNest. Your focus is on closing deals, improving conversion rates, and managing client relationships.' },
  { id: 'cto', name: 'Chief Technical Agent', role: 'AI & Ingestion', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', prompt: 'You are the AI CTO of HireNest. Your focus is on resume parsing accuracy, system stability, and data integration architecture.' },
];

export default function AgentChat() {
  const { user } = useAuth();
  const { jobs, candidates, clients } = useData();
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = `
Current System Data Context:
- Jobs Open: ${jobs.length}
- Candidates in Pool: ${candidates.length}
- Active Clients: ${clients.length}

Agent Profile: ${selectedAgent.prompt}

Special Capability: Lead Discovery & Extraction
You have access to strategic playbooks for sourcing recruiter leads:
1. LinkedIn Pulse: Suggesting boolean search strings for specific niches.
2. YouTube Intelligence: Analyzing comments on HR/Tech career videos for 'looking to hire' or 'searching for role' patterns.
3. GitHub Sourcing: Identifying contributors in trending repositories related to open requisitions.
4. Marketplace Arbitrage: Identifying potential client companies based on their open job patterns elsewhere.

Please answer the user's request based on your role and the system data context provided.
`;

      const prompt = `Conversation history:\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}\n\nUser: ${input}`;
      const text = await callAIQuietly(prompt, { context });


      setMessages(prev => [...prev, { role: 'assistant', content: text, agent: selectedAgent.id, timestamp: new Date().toISOString() }]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, my neural circuits are currently undergoing maintenance. Please try again in a moment.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight tracking-tight">Executive Suite</h1>
          <p className="text-slate-500 mt-1">Converse with specialized AI agents powered by your live recruitment data.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                selectedAgent.id === agent.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:text-slate-900"
              )}
            >
              {agent.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex divide-x divide-slate-100">
        <div className="w-80 flex flex-col divide-y divide-slate-50 bg-slate-50/50">
          <div className="p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Active Experts
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left group",
                  selectedAgent.id === agent.id ? "bg-white shadow-sm ring-1 ring-indigo-500/10" : "hover:bg-white"
                )}
              >
                <div className="relative">
                  <img src={agent.avatar} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full ring-1 ring-green-500/20" />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-bold truncate", selectedAgent.id === agent.id ? "text-indigo-600" : "text-slate-900")}>{agent.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{agent.role}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 bg-white/50 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <Clock className="w-4 h-4 text-indigo-500 mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg Response</p>
                <p className="text-sm font-bold text-slate-900">0.8s</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Uptime</p>
                <p className="text-sm font-bold text-slate-900">100%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={selectedAgent.avatar} className="w-10 h-10 rounded-xl" />
              <div>
                <h3 className="font-bold text-slate-900">{selectedAgent.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400 font-medium">Listening to your data context...</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMessages([])}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/20"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 drop-shadow-sm">
                  <Bot className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Hello, {user?.name?.split(' ')[0]}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  I'm your {selectedAgent.role} assistant. I have full visibility into your jobs, candidates, and client interactions. Ask me anything to get strategic insights.
                </p>
                <div className="grid grid-cols-1 w-full gap-3 mt-8">
                  {[
                    `Analyze our current hiring pipeline health`,
                    `Identify top 3 matching candidates for open roles`,
                    `How to optimize our vendor commission structures?`
                  ].map(q => (
                    <button 
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-left p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-500 transition-all text-xs font-semibold text-slate-600 hover:text-indigo-600"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-1 shadow-sm",
                  m.role === 'user' ? "bg-slate-900 text-white" : "bg-indigo-600 text-white"
                )}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm border",
                  m.role === 'user' 
                    ? "bg-slate-900 border-slate-900 text-white rounded-tr-none" 
                    : "bg-white border-slate-100 text-slate-700 rounded-tl-none prose prose-sm prose-slate"
                )}>
                  {m.role === 'assistant' ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0 flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-50 bg-white">
            <form onSubmit={handleSend} className="relative group">
              <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <button type="button" className="p-2.5 text-slate-300 hover:text-indigo-600 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Consult with the ${selectedAgent.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-indigo-600 text-white p-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-600/20 group-hover:scale-105 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
