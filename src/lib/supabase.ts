/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const getSupabaseUrl = () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('hirenest_supabase_url');
    if (stored) return stored;
  }
  try {
    return (import.meta.env?.VITE_SUPABASE_URL as string) || (process.env.VITE_SUPABASE_URL as string) || '';
  } catch {
    return (process.env.VITE_SUPABASE_URL as string) || '';
  }
};

const getSupabaseAnonKey = () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('hirenest_supabase_anon_key');
    if (stored) return stored;
  }
  try {
    return (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || (process.env.VITE_SUPABASE_ANON_KEY as string) || '';
  } catch {
    return (process.env.VITE_SUPABASE_ANON_KEY as string) || '';
  }
};

export const isSupabaseConfigured = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!(url && key && url.includes('supabase.co'));
};

const createNewClient = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  
  if (!url || !key || !url.includes('supabase.co')) {
    console.warn('Supabase not configured. Using placeholder client.');
    return null;
  }
  
  return createClient(url, key);
};

export const getSupabase = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const isConfigured = !!(url && key && url.includes('supabase.co'));

  if (!isConfigured) {
    // Return a proxy that handles calls gracefully if not configured
    const createPlaceholderHandler = (name: string): any => {
      const handler: any = (...args: any[]) => {
        return new Proxy({}, {
          get: (target, prop) => {
            if (prop === 'then') {
              return (resolve: any) => resolve({ data: (name === 'select' || name === 'from') ? [] : null, error: null });
            }
            // Return same proxy for any property access (chaining)
            return createPlaceholderHandler(String(prop));
          }
        });
      };
      return handler;
    };

    return new Proxy({} as SupabaseClient, {
      get: (_, prop) => {
        const sProp = String(prop);
        if (sProp === '__isProxy') return true;
        
        if (sProp === 'auth') {
          return {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase URL/Key missing') }),
            signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase URL/Key missing') }),
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        if (sProp === 'storage') {
          return {
            from: () => ({
              upload: () => Promise.resolve({ data: null, error: new Error('Not configured') }),
              download: () => Promise.resolve({ data: null, error: new Error('Not configured') }),
              getPublicUrl: () => ({ data: { publicUrl: '' } }),
            })
          };
        }
        if (sProp === 'channel' || sProp === 'removeChannel') {
          return () => ({
            on: () => ({ subscribe: () => ({}) }),
            subscribe: () => ({}),
            unsubscribe: () => ({}),
          });
        }
        
        return createPlaceholderHandler(sProp);
      }
    });
  }

  // Create instance if it doesn't exist or if current one is a proxy
  // (We check if it's a real client by looking for a property that existence check wouldn't be on a proxy)
  if (!supabaseInstance || (supabaseInstance as any).__isProxy) {
    supabaseInstance = createClient(url, key);
  }
  
  return supabaseInstance;
};

export const reinitializeSupabase = () => {
  supabaseInstance = createNewClient();
};

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const client = getSupabase();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Sanitization Helpers
export const cleanNum = (val: any): number | null => {
  if (val === '' || val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(n) ? null : n;
};

export const cleanUUID = (val: any): string | null => {
  if (!val || typeof val !== 'string' || val.length < 32) return null;
  return val;
};

export const normalizeArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};
