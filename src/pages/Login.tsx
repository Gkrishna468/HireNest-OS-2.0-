/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (typeof signIn === 'function') {
        await signIn(email, password);
      } else {
        throw new Error('Auth system not initialized');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 bg-slate-900 flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Zap className="text-white w-7 h-7 fill-current" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">HireNest OS</h1>
            <p className="text-slate-400 text-sm mt-1">Smart Recruitment Operating System</p>
          </div>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <button 
                  type="button" 
                  onClick={() => toast.info('Please contact your administrator to reset password')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">HireNest Workforce CRM Enterprise OS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
