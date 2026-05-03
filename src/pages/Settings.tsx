/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  Database, 
  Mail, 
  Shield, 
  User, 
  Building2, 
  Save, 
  CheckCircle2, 
  ExternalLink,
  Lock,
  Globe,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured, reinitializeSupabase, supabase } from '@/lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('supabase');
  const [loading, setLoading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const [supabaseConfig, setSupabaseConfig] = useState({
    url: localStorage.getItem('hirenest_supabase_url') || '',
    anonKey: localStorage.getItem('hirenest_supabase_anon_key') || '',
  });

  const [gmailConfig, setGmailConfig] = useState({
    clientId: localStorage.getItem('hirenest_gmail_client_id') || '',
    clientSecret: '••••••••••••••••',
    redirectUri: window.location.origin + '/auth/callback',
    webhookUrl: 'https://api.hirenest.com/v1/webhooks/gmail'
  });

  useEffect(() => {
    async function checkGmail() {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        setGmailConnected(!!session?.provider_token);
      }
    }
    checkGmail();
  }, []);

  const saveSupabase = async () => {
    setLoading(true);
    try {
      localStorage.setItem('hirenest_supabase_url', supabaseConfig.url);
      localStorage.setItem('hirenest_supabase_anon_key', supabaseConfig.anonKey);
      reinitializeSupabase();
      toast.success('Supabase configuration updated and reinitialized');
    } catch (err) {
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Please configure Supabase first');
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.send',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: window.location.origin + '/email',
        },
      });

      if (error) throw error;
      
      toast.success('Connecting to Google services...');
    } catch (err: any) {
      toast.error(err.message || 'Gmail connection failed');
    } finally {
      setLoading(false);
    }
  };

  const disconnectGmail = async () => {
    await supabase.auth.signOut();
    setGmailConnected(false);
    toast.info('Gmail integration disconnected (Signed out)');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Infrastructure</h1>
        <p className="text-slate-500 mt-1">Configure your backend hooks, security protocols, and integration points.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex flex-col gap-1 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start">
          {[
            { id: 'supabase', label: 'Supabase Data', icon: Database },
            { id: 'gmail', label: 'Gmail Logic', icon: Mail },
            { id: 'security', label: 'Security & RLS', icon: Shield },
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'company', label: 'Organization', icon: Building2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/10" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-600" : "text-slate-400")} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[500px]">
          {activeTab === 'supabase' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Supabase Connection</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Primary data layer and authentication service.</p>
                  </div>
                </div>
                {isSupabaseConfigured() ? (
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Operational
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Not Configured
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Supabase Project URL</label>
                  <div className="relative group">
                    <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="url"
                      value={supabaseConfig.url}
                      onChange={e => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
                      placeholder="https://xyz.supabase.co"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Project Anon Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      value={supabaseConfig.anonKey}
                      onChange={e => setSupabaseConfig({...supabaseConfig, anonKey: e.target.value})}
                      placeholder="eyJhbG..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                  <ExternalLink className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm">Security Policy Alignment</h4>
                    <p className="text-indigo-700/70 text-xs leading-relaxed mt-1">
                      Ensure your RLS policies match the HireNest multi-tenant schema. Use the provided 999_complete_setup.sql migration for optimal performance and data isolation.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button 
                    onClick={saveSupabase}
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save & Reinitialize
                  </button>
                  <button className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors underline-offset-4 hover:underline">
                    Restore Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gmail' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Gmail Ingestion Point</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Automated synchronization and resume extraction.</p>
                  </div>
                </div>
                {gmailConnected ? (
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    Inactive
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center gap-4">
                  {gmailConnected ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                        <Mail className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-slate-900">Gmail Agent Active</h3>
                      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                        Currently monitoring <strong>{user?.email}</strong> for new resumes and client emails. Use the Agents dashboard to configure run frequency.
                      </p>
                      <button 
                        onClick={disconnectGmail}
                        className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all"
                      >
                        Disconnect Integration
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                        <Mail className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-slate-900">Connect Gmail Workspace</h3>
                      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                        Grant read-only access to HireNest agents to enable autonomous resume harvesting and client follow-ups.
                      </p>
                      <button 
                        onClick={connectGmail}
                        disabled={loading}
                        className="mt-4 flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5 fill-current" />}
                        Authorize via Google
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h5 className="text-sm font-black text-amber-900 uppercase tracking-tight">Step 1: Update Google Cloud Console</h5>
                      <p className="text-xs text-amber-700 font-medium leading-relaxed mt-2">
                        To link your Gmail, you MUST add this exact URI to your "Authorized redirect URIs" in the Google Cloud Console. 
                        If you see an old app, it's because you are using a client ID associated with a different domain.
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <code className="px-4 py-2 bg-slate-900 text-indigo-400 rounded-xl text-[10px] font-mono break-all border border-slate-800 select-all">
                          {window.location.origin}/email
                        </code>
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest border-b border-amber-300">Copy this exact URL</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4 mt-4">
                    <Shield className="w-6 h-6 text-indigo-600 shrink-0" />
                    <div>
                      <h5 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Step 2: Scopes & Verification</h5>
                      <p className="text-xs text-indigo-700 font-medium leading-relaxed mt-2">
                        Configure your app as "External" and add the `gmail.readonly` scope. This app is currently in a developer sandbox environment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Security Protocols</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Manage access controls and administrative credentials.</p>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (passwords.new !== passwords.confirm) {
                  return toast.error("New passwords don't match");
                }
                setLoading(true);
                const { error } = await supabase.auth.updateUser({ password: passwords.new });
                if (error) toast.error(error.message);
                else {
                  toast.success("Password updated successfully");
                  setPasswords({ current: '', new: '', confirm: '' });
                }
                setLoading(false);
              }} className="max-w-md space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Administrative Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">User Identity</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Manage your personal operator profile and preferences.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <p className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Account UID</label>
                  <p className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-400 text-[10px] break-all">{user?.id}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Operational Role</label>
                  <p className="px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-700 text-sm">Enterprise Administrator</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Last Established Link</label>
                  <p className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Organization Hub</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Define your brand and billing architecture.</p>
                </div>
              </div>

              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                    <input
                      type="text"
                      defaultValue="HireNest Workforce"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Industry Vertical</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all shadow-sm appearance-none">
                      <option>Recruitment & Staffing</option>
                      <option>Technology Services</option>
                      <option>Manufacturing</option>
                      <option>Healthcare</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-xl uppercase tracking-tighter">Enterprise OS Tier</h4>
                      <p className="text-slate-400 text-xs mt-1">Unlimited Agents • Neural Parsing Included</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-400">$2,499</span>
                      <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-widest">Per Cycle</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button className="flex-1 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Manage Subscription</button>
                    <button className="flex-1 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Legacy Invoices</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'supabase' && activeTab !== 'gmail' && activeTab !== 'security' && activeTab !== 'profile' && activeTab !== 'company' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-20 border border-slate-100 border-dashed rounded-2xl">
              <SettingsIcon className="w-12 h-12 mb-4 opacity-10" />
              <p className="font-medium">{activeTab[0].toUpperCase() + activeTab.slice(1)} settings coming in next module.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
