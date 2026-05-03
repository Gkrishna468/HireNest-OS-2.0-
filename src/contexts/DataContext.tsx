/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getClients, createClient, updateClient } from '@/lib/api/clients';
import { getVendors, createVendor, updateVendor } from '@/lib/api/vendors';
import { getJobs, createJob, approveJob } from '@/lib/api/jobs';
import { getAllCandidates, createCandidate, updateCandidate, deleteCandidate } from '@/lib/api/candidates';
import type { Client, Vendor, Job, Candidate, AgentLog, Deal } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DataContextType {
  clients: Client[];
  vendors: Vendor[];
  jobs: Job[];
  candidates: Candidate[];
  logs: AgentLog[];
  deals: any[];
  userProfile: any | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  addClient: (data: Partial<Client>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  addVendor: (data: Partial<Vendor>) => Promise<void>;
  updateVendor: (id: string, data: Partial<Vendor>) => Promise<void>;
  addJob: (data: Partial<Job>) => Promise<void>;
  addCandidate: (data: Partial<Candidate>) => Promise<void>;
  updateCandidate: (id: string, data: Partial<Candidate>) => Promise<void>;
  updateCandidateStatus: (id: string, stage: Candidate['stage'], status?: string) => Promise<void>;
  approveJobWithBudget: (id: string, budget: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch User Profile first for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      const [cData, vData, jData, candData, dealData] = await Promise.all([
        getClients(),
        getVendors(),
        getJobs(),
        getAllCandidates(),
        supabase.from('deals').select('*').order('created_at', { ascending: false })
      ]);
      setClients(cData);
      setVendors(vData);
      setJobs(jData);
      setCandidates(candData);
      setDeals(dealData.data || []);

      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logsError) {
        console.error('Error fetching agent logs:', logsError);
      }
      
      if (logsData) {
        setLogs(logsData.map(l => ({
          id: l.id,
          type: l.type,
          level: l.level === 'success' ? 'success' : (l.level || 'info'),
          message: l.message,
          metadata: l.metadata,
          companyId: l.company_id,
          createdAt: l.created_at
        } as AgentLog)));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Realtime logs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('agent_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_logs' },
        (payload) => {
          setLogs(prev => [payload.new as any, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addClient = async (data: Partial<Client>) => {
    try {
      if (!data.clientCode) {
        const count = clients.length + 1;
        data.clientCode = `C-${String(count).padStart(3, '0')}`;
      }
      await createClient(data);
      toast.success('Client registered in Neural OS.');
      await refreshAll();
    } catch (err: any) {
      console.error('Add client failed:', err);
      toast.error(`Database Error: ${err.message || 'Failed to save client'}`);
    }
  };

  const updateClientData = async (id: string, data: Partial<Client>) => {
    try {
      await updateClient(id, data);
      toast.success('Client updated.');
      await refreshAll();
    } catch (err: any) {
      toast.error('Update failed');
    }
  };

  const updateVendorData = async (id: string, data: Partial<Vendor>) => {
    try {
      await updateVendor(id, data);
      toast.success('Vendor updated.');
      await refreshAll();
    } catch (err: any) {
      toast.error('Update failed');
    }
  };

  const addVendor = async (data: Partial<Vendor>) => {
    try {
      if (!data.vendorCode) {
        const count = vendors.length + 1;
        data.vendorCode = `V-${String(count).padStart(3, '0')}`;
      }
      if (!data.companyId && userProfile?.company_id) {
        data.companyId = userProfile.company_id;
      }
      await createVendor(data);
      toast.success('Vendor onboarded successfully.');
      await refreshAll();
    } catch (err: any) {
      console.error('Add vendor failed:', err);
      toast.error(`Database Error: ${err.message || 'Failed to save vendor'}`);
    }
  };

  const addJob = async (data: Partial<Job>) => {
    try {
      await createJob(data);
      toast.success('Job broadcasted to marketplace.');
      await refreshAll();
    } catch (err: any) {
      console.error('Add job failed:', err);
      toast.error(`Database Error: ${err.message || 'Failed to save job'}`);
    }
  };

  const addCandidate = async (data: Partial<Candidate>) => {
    try {
      await createCandidate(data);
      toast.success('Candidate profile synchronized.');
      await refreshAll();
    } catch (err: any) {
      console.error('Add candidate failed:', err);
      toast.error(`Database Error: ${err.message || 'Failed to save candidate'}`);
    }
  };

  const updateCandidateData = async (id: string, data: Partial<Candidate>) => {
    await updateCandidate(id, data);
    await refreshAll();
  };

  const updateCandidateStatus = async (id: string, stage: Candidate['stage'], status?: string) => {
    await updateCandidate(id, { stage, status });
    await refreshAll();
  };

  const approveJobWithBudget = async (id: string, budget: string) => {
    await approveJob(id, budget);
    await refreshAll();
  };

  return (
    <DataContext.Provider value={{
      clients, vendors, jobs, candidates, logs, deals, userProfile, loading,
      refreshAll, 
      addClient, updateClient: updateClientData,
      addVendor, updateVendor: updateVendorData,
      addJob, 
      addCandidate, updateCandidate: updateCandidateData,
      updateCandidateStatus, approveJobWithBudget
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
