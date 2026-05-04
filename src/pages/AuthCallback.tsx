import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Supabase handles the hash fragment, but we can also be explicit
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          toast.success('Neural Link Established.');
          // Redirect to email if that's where they were headed, or dashboard
          navigate('/email');
        } else {
          // If no session, wait a bit or try to refresh
          const { data: userRes } = await supabase.auth.getUser();
          if (userRes.user) {
            navigate('/email');
          } else {
            console.warn("No session found in callback");
            // Only redirect if we've waited a bit
            const timeout = setTimeout(() => navigate('/login'), 2000);
            return () => clearTimeout(timeout);
          }
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        toast.error("Auth failed: " + err.message);
        navigate('/login');
      } finally {
        // CLEAN UP: Scrub tokens from URL immediately
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', '/');
        }
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-white text-2xl font-black uppercase tracking-widest">Neural Link Establishing...</h2>
        <p className="text-slate-400 mt-2 font-medium">Synchronizing with HireNest AI Core</p>
      </div>
    </div>
  );
}
