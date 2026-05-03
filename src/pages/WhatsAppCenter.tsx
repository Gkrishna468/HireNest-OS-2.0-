import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  MoreVertical, 
  Zap, 
  ShieldCheck, 
  Activity, 
  UserCheck,
  Bot,
  User,
  Settings2,
  RefreshCw,
  Phone,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Settings,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { processIncomingWhatsApp, sendWhatsAppMessage, WHATSAPP_PROMPT } from '@/services/whatsappService';

export default function WhatsAppCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'conversations' | 'automations' | 'config'>('conversations');
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChats = async () => {
    const { data } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .order('last_activity_at', { ascending: false });
    if (data) setChats(data);
    setLoading(false);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchChats();
    
    const chatSub = supabase
      .channel('whatsapp-chats-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' }, () => fetchChats())
      .subscribe();

    return () => {
      supabase.removeChannel(chatSub);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const msgSub = supabase
        .channel(`whatsapp-msgs-${selectedChat.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'whatsapp_messages',
          filter: `chat_id=eq.${selectedChat.id}`
        }, () => fetchMessages(selectedChat.id))
        .subscribe();

      return () => {
        supabase.removeChannel(msgSub);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      await supabase.from('whatsapp_messages').insert({
        chat_id: selectedChat.id,
        sender_type: 'user',
        content: newMessage
      });
      await sendWhatsAppMessage(selectedChat.phone_number, newMessage);
      setNewMessage('');
    } catch (err) {
      toast.error("Transmission Error");
    } finally {
      setSending(false);
    }
  };

  const toggleAI = async (chat: any) => {
    const nextMode = chat.ai_engagement_mode === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('whatsapp_chats')
      .update({ ai_engagement_mode: nextMode })
      .eq('id', chat.id);
    
    if (!error) {
      toast.success(`Agent ${nextMode === 'active' ? 'Engaged' : 'Paused'}`);
      setChats(chats.map(c => c.id === chat.id ? { ...c, ai_engagement_mode: nextMode } : c));
      if (selectedChat?.id === chat.id) setSelectedChat({ ...selectedChat, ai_engagement_mode: nextMode });
    }
  };

  const simulateIncoming = async () => {
    setSimulating(true);
    const testCases = [
      { name: "Rahul Sharma", msg: "I'm interested in the DevOps role. I have 8 years experience with Terraform." },
      { name: "Anita Kapoor", msg: "Can we schedule an interview for the Manager position?" },
      { name: "David Chen", msg: "Checking for Java roles. Proficient in Spring Boot." }
    ];
    const test = testCases[Math.floor(Math.random() * testCases.length)];
    const randomPhone = `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    try {
      toast.info("Inbound Signal Detected...");
      await processIncomingWhatsApp(randomPhone, test.name, test.msg);
      toast.success("Identity Extraction Successful.");
    } catch (err) {
      toast.error("Neural Simulation Failed");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Smartphone className="w-8 h-8 text-indigo-600" />
             WhatsApp Business Hub
          </h1>
          <p className="text-slate-500 font-medium mt-1">Autonomous recruitment automation using Neural Engagement Pipelines.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={simulateIncoming}
            disabled={simulating}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
          >
            <Zap className={cn("w-4 h-4", simulating && "animate-pulse")} />
            Neural Pulse Simulator
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Meta API Connected
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
        {/* Tabs */}
        <div className="flex border-b border-slate-50 bg-slate-50/20">
          {[
            { id: 'conversations', label: 'Neural Streams', icon: MessageSquare },
            { id: 'automations', label: 'Logic Config', icon: Settings2 },
            { id: 'config', label: 'Connectivity', icon: LinkIcon }
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

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'conversations' ? (
            <div className="flex w-full">
              {/* Chat List */}
              <div className="w-80 border-r border-slate-50 flex flex-col bg-slate-50/20 max-h-full overflow-y-auto">
                {loading ? (
                  <div className="p-12 text-center text-slate-300">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase">Syncing Nodes</p>
                  </div>
                ) : chats.length > 0 ? (
                  chats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={cn(
                        "w-full p-6 text-left border-b border-slate-50 hover:bg-white transition-all group relative",
                        selectedChat?.id === chat.id && "bg-white shadow-sm ring-1 ring-slate-100"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-black text-slate-900 truncate max-w-[120px] uppercase tracking-tight">
                          {chat.contact_name || chat.phone_number}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {format(new Date(chat.last_activity_at), 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic italic">
                        {chat.last_message || "Awaiting pulse..."}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">{chat.status}</span>
                         {chat.ai_engagement_mode === 'active' && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">Active AI</span>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center opacity-30 italic text-slate-400 text-xs">No active nodes. Use Simulator.</div>
                )}
              </div>

              {/* Chat View */}
              <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                  <>
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", selectedChat.ai_engagement_mode === 'active' ? "bg-indigo-600" : "bg-slate-900")}>
                             {selectedChat.ai_engagement_mode === 'active' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                          </div>
                          <div>
                             <h3 className="font-black text-slate-900 uppercase tracking-tight leading-none">{selectedChat.contact_name}</h3>
                             <p className="text-[10px] font-black text-slate-400 mt-1">{selectedChat.phone_number}</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => toggleAI(selectedChat)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          selectedChat.ai_engagement_mode === 'active' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-indigo-600 text-white shadow-lg"
                        )}
                       >
                         {selectedChat.ai_engagement_mode === 'active' ? "Manual Override" : "Enable AI Autonomy"}
                       </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/10">
                       {messages.map((msg) => (
                         <div key={msg.id} className={cn("flex flex-col max-w-[75%]", msg.sender_type === 'contact' ? "mr-auto" : "ml-auto items-end")}>
                            <div className={cn("p-4 rounded-3xl text-sm font-medium leading-relaxed", msg.sender_type === 'contact' ? "bg-white text-slate-700 border" : msg.sender_type === 'ai' ? "bg-slate-900 text-white" : "bg-indigo-600 text-white")}>
                               {msg.content}
                            </div>
                            <div className="flex items-center gap-2 mt-2 px-1">
                               {msg.sender_type === 'ai' && <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">Neural Reply</span>}
                               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{format(new Date(msg.created_at), 'h:mm a')}</span>
                            </div>
                         </div>
                       ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-50 flex gap-4">
                       <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Dispatch human-corrected response..."
                        className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                       />
                       <button type="submit" className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 shadow-xl"><Send className="w-6 h-6" /></button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                     <Bot className="w-16 h-16 text-slate-100 mb-4" />
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Transmission Node</h3>
                     <p className="text-slate-400 text-xs italic max-w-xs mt-2">Initialize a neural thread to begin candidate engagement.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'automations' ? (
            <div className="p-8 space-y-6 max-w-3xl overflow-y-auto w-full">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Agent Personality Config</h3>
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 uppercase">Save Blueprint</button>
               </div>
               <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">System Persona Prompt</label>
                     <textarea 
                        className="w-full h-40 bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium leading-relaxed outline-none"
                        defaultValue={WHATSAPP_PROMPT}
                        readOnly
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                        <UserCheck className="w-6 h-6 text-emerald-600 mb-3" />
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-1">Lead Extraction</h4>
                        <p className="text-[11px] font-medium text-emerald-800">Auto-inject extracted talent into CRM nodes.</p>
                     </div>
                     <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                        <Clock className="w-6 h-6 text-indigo-600 mb-3" />
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-1">Auto-Scheduling</h4>
                        <p className="text-[11px] font-medium text-indigo-800">Coordinate interviews via human-like chat pulses.</p>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="p-8 max-w-2xl w-full">
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                     <LinkIcon className="w-5 h-5 text-indigo-600" />
                     Credential Matrix
                  </h3>
                  <div className="space-y-4">
                     <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Webhook Endpoint</span>
                        <code className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-mono text-indigo-600 select-all">
                           {window.location.origin}/api/hooks/whatsapp_neural
                        </code>
                     </div>
                     <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] font-bold">Ensure you have mapped your 'VITE_GEMINI_API_KEY' in the environment settings for neural autonomous processing.</p>
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
