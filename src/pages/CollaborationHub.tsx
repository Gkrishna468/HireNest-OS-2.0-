import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  User, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Zap,
  ChevronRight,
  Send,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Collaboration, Message } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function CollaborationHub() {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [selectedCollab, setSelectedCollab] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborations();
  }, [user]);

  async function fetchCollaborations() {
    if (!user?.companyId) return;

    let query = supabase
      .from('collaborations')
      .select(`
        *,
        job:jobs(title, budget, company:companies(name)),
        candidate:candidates(name, email, current_title, skills, resume_url),
        vendor:companies!vendor_id(name),
        client:companies!client_id(name),
        conversations(id)
      `);

    // Filter based on user role
    if (user.role === 'client_manager') {
      query = query.eq('client_id', user.companyId);
    } else if (user.role === 'vendor_manager') {
      query = query.eq('vendor_id', user.companyId);
    }

    const { data, error } = await query.order('last_activity_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
    } else {
      setCollaborations(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedCollab) {
      fetchMessages(selectedCollab.conversations[0]?.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${selectedCollab.conversations[0]?.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${selectedCollab.conversations[0]?.id}` 
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedCollab]);

  async function fetchMessages(conversationId: string) {
    if (!conversationId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedCollab) return;

    const conversationId = selectedCollab.conversations[0]?.id;
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      content: newMessage,
      is_ai_assisted: false
    });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Sidebar: All Collaborations */}
      <div className="w-80 border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Marketplace Feed
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Collaboration Streams</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {collaborations.map(collab => (
            <button
              key={collab.id}
              onClick={() => setSelectedCollab(collab)}
              className={cn(
                "w-full p-6 text-left hover:bg-slate-50 transition-all group relative",
                selectedCollab?.id === collab.id && "bg-indigo-50/50"
              )}
            >
              {selectedCollab?.id === collab.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
              )}
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                  collab.status === 'proposed' ? 'bg-indigo-100 text-indigo-700' :
                  collab.status === 'collaborated' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                )}>
                  {collab.status}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                  {format(new Date(collab.last_activity_at), 'HH:mm')}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 line-clamp-1">{collab.candidate.name}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1 font-medium mt-0.5">for {collab.job.title}</p>
              
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">CL</div>
                  <div className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[8px] font-bold text-purple-600">VN</div>
                </div>
                <div className="text-[9px] font-black text-indigo-600 lowercase tracking-tighter decoration-indigo-200 underline underline-offset-2">
                  {collab.match_score}% High-End Match
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main: Active Collaboration Context + Chat */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {selectedCollab ? (
          <>
            {/* Context Header */}
            <div className="p-8 bg-white border-b border-slate-100 shadow-sm relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCollab.candidate.name}</h2>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      Match Score: {selectedCollab.match_score}%
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-slate-500 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {selectedCollab.job.title}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Submitted by <span className="font-bold text-slate-900">{selectedCollab.vendor.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Move
                  </button>
                  <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex flex-center flex-col items-center py-8 text-slate-400">
                <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  Conversation Initialized: {format(new Date(selectedCollab.created_at), 'MMM dd, yyyy')}
                </div>
                <div className="max-w-md text-center text-xs leading-relaxed">
                  Collaboration channel now open between <span className="text-indigo-600 font-bold">{selectedCollab.client.name}</span> and <span className="text-purple-600 font-bold">{selectedCollab.vendor.name}</span>.
                </div>
              </div>

              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={i} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] p-4 rounded-2xl shadow-sm relative",
                      isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-900 rounded-tl-none border border-slate-100"
                    )}>
                      {msg.is_ai_assisted && (
                        <div className="absolute -top-3 right-0 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200">
                          AI Assisted
                        </div>
                      )}
                      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                      <span className={cn("text-[9px] block mt-2 font-bold uppercase tracking-tighter opacity-50", isMe ? "text-right" : "text-left")}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-white border-t border-slate-100">
              <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask a question or suggest a next step..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Zap className="w-3 h-3 text-indigo-500" />
                  AI suggestions enabled
                </div>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <button className="text-[10px] font-bold text-indigo-600 hover:underline">Draft optimized reply</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-indigo-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select a Collaboration</h2>
            <p className="text-slate-500 text-sm max-w-sm mt-2">Choose a candidate stream from the left to view active negotiations, match reasoning, and group communication.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  );
}
