import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // Supabase handles the hash fragment automatically in the client
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Returning to login.');
        navigate('/login');
        return;
      }

      if (session) {
        toast.success('Successfully authenticated with HireNest OS');
        navigate('/');
      } else {
        // Checking if we are just in a middle state
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          navigate('/');
        } else {
          navigate('/login');
        }
      }
    }

    handleCallback();
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
