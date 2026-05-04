import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Search, RefreshCw, BrainCircuit, User, FileText, CheckCircle, Clock, AlertCircle, Send, Edit, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Email {
  id: string;
  message_id: string;
  subject: string;
  from_email: string;
  snippet: string;
  body: string;
  received_at: string;
  ai_metadata?: any;
  status?: string;
}

export function EmailCenter() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmails();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('email_updates')
      .on(
        'postgres_changes' as any, 
        { event: '*', table: 'emails' }, 
        () => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
      
      // Auto-select first email if none selected
      if (data && data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (err: any) {
      console.error('Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { syncGmailInbox } = await import('@/services/gmailService');
      const result = await syncGmailInbox();
      toast.success(result.message);
      await fetchEmails();
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredEmails = emails.filter(e => 
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.from_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8fafc] overflow-hidden">
      {/* PANEL 1: INBOX LIST */}
      <div className="w-80 border-r border-[#e2e8f0] bg-white flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Inbox
            </h1>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Connecting to neural stream...</span>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No messages found</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div 
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50/50 ${selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate flex-1 pr-2">
                    {email.from_email.split('<')[0] || email.from_email}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(email.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs font-medium text-gray-600 truncate mb-1">
                  {email.subject}
                </div>
                <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">
                  "{email.snippet}"
                </div>
                {email.ai_metadata?.intent && (
                  <div className="mt-2 flex gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider">
                      {email.ai_metadata.intent.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* PANEL 2: EMAIL VIEWER */}
      <div className="flex-1 bg-white flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#1e293b] mb-1">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                      {selectedEmail.from_email[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{selectedEmail.from_email}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span>{new Date(selectedEmail.received_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Sparkles className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdfe]">
              <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-[#334155] leading-relaxed whitespace-pre-wrap font-sans text-[15px]">
                {selectedEmail.body || selectedEmail.snippet}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
            <Mail className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">Select a signal to begin analysis</p>
          </div>
        )}
      </div>

      {/* PANEL 3: AGENT PANEL (NESTOR AI) */}
      <div className="w-[380px] border-l border-[#e2e8f0] bg-[#f8fafc] flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0] bg-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-[#1e293b]">Nestor Intelligence</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!selectedEmail ? (
            <div className="h-full flex items-center justify-center text-center p-8 text-gray-400">
              <p className="text-sm">Connect a signal to activate neural processing unit.</p>
            </div>
          ) : (
            <>
              {/* INTENT & SCORE */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-600">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Intent</span>
                  <div className="flex items-center gap-1 text-indigo-600">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-bold">{selectedEmail.ai_metadata?.best_job_match?.score || 0}% Job Match</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {selectedEmail.ai_metadata?.intent?.replace(/_/g, ' ') || 'Detecting Intent...'}
                </h3>
                {selectedEmail.ai_metadata?.best_job_match && (
                  <div className="mt-2 text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                    Role: {selectedEmail.ai_metadata.best_job_match.job_title}
                  </div>
                )}
              </div>

              {/* ACTION CENTER */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Autonomous Actions</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Candidate Profile Created
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                    <Clock className="w-4 h-4" />
                    Auto-Reply Drafted
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                    <BrainCircuit className="w-4 h-4" />
                    Job Matching in Progress
                  </div>
                </div>
              </div>

              {/* EXTRACTED CORE DATA */}
              {selectedEmail.ai_metadata?.extracted && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Extracted Knowledge</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Contact Name</div>
                        <div className="text-xs font-semibold">{selectedEmail.ai_metadata.extracted.name || 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Skills & Experience</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedEmail.ai_metadata.extracted.skills?.map((s: string) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DRAFTING INTERFACE */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Proposed Response</h3>
                  <button className="text-[10px] text-indigo-600 font-bold hover:underline">Regenerate</button>
                </div>
                <textarea 
                  className="w-full text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border-none focus:ring-1 focus:ring-indigo-500 h-32 leading-relaxed"
                  defaultValue={selectedEmail.ai_metadata?.reply || `Hi ${selectedEmail.from_email.split('<')[0].trim() || 'there'},\n\nThank you for reaching out regarding ${selectedEmail.subject}. Our team has received your application and is currently reviewing your profile.\n\nBest regards,\nNestor AI Team`}
                />
                <button className="w-full mt-3 bg-[#1e293b] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                  <Send className="w-3 h-3" />
                  Execute Neural Reply
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
