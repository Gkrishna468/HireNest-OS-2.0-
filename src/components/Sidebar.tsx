/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Building2, 
  Truck, 
  FileText, 
  Bot, 
  Zap, 
  Settings, 
  LogOut,
  History,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Handshake,
  Globe,
  BrainCircuit,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';

const navItems = [
  { icon: ShieldCheck, label: 'Command Center', path: '/exec-suite' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: BrainCircuit, label: 'Agent Intelligence', path: '/intelligence' },
  { icon: Mail, label: 'Email Center', path: '/email' },
  { icon: MessageSquare, label: 'WhatsApp Business', path: '/whatsapp' },
  { icon: Globe, label: 'Marketplace', path: '/marketplace' },
  { icon: Handshake, label: 'Collaboration Hub', path: '/collaboration' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { icon: Users, label: 'Candidates', path: '/candidates' },
  { icon: Building2, label: 'Clients', path: '/clients' },
  { icon: Truck, label: 'Vendors', path: '/vendors' },
  { icon: FileText, label: 'Resumes', path: '/resumes' },
  { icon: Bot, label: 'AI Agents', path: '/agents' },
  { icon: Zap, label: 'AI Matching', path: '/ai-matching' },
  { icon: History, label: 'Follow-ups', path: '/follow-ups' },
  { icon: TrendingUp, label: 'Deal Room', path: '/deal-room' },
  { icon: Bot, label: 'Agent Chat', path: '/agent-chat' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { signOut, user } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Zap className="text-white w-5 h-5 fill-current" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">HireNest</h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize truncate">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>

        <div className="px-3 pt-2">
          <div className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
            isSupabaseConfigured() 
              ? "bg-green-500/10 text-green-400 border-green-500/20" 
              : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSupabaseConfigured() ? "bg-green-400" : "bg-red-400")} />
            {isSupabaseConfigured() ? 'Cloud Sync Active' : 'Offline Mode'}
          </div>
        </div>
      </div>
    </aside>
  );
}
