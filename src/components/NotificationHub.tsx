import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export default function NotificationHub() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const subscription = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(c => c + 1);
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all group"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-indigo-100/50 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Enterprise Alerts</h3>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">Real-time system & deal updates</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-5 transition-all hover:bg-slate-50 relative group",
                    !notif.is_read && "bg-indigo-50/20"
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      notif.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                      notif.type === 'warning' ? "bg-amber-100 text-amber-600" :
                      notif.type === 'error' ? "bg-red-100 text-red-600" :
                      "bg-indigo-100 text-indigo-600"
                    )}>
                      {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                       notif.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                       <Zap className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{notif.title}</h4>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap pt-1">
                          {formatDistanceToNow(new Date(notif.created_at))} ago
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                      
                      {notif.link && (
                        <a 
                          href={notif.link}
                          className="mt-3 inline-flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400">All clear! No new alerts.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button className="w-full py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">
              Clear All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
