/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  ChevronRight,
  ShieldCheck,
  XCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { safeArray, safeString } from '@/utils/safe';

export default function Clients() {
  const { clients, loading, addClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setForm] = useState({
    company: '',
    website: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: ''
  });

  const filteredClients = safeArray(clients).filter(c => 
    safeString(c.company).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof addClient === 'function') {
        await addClient(formData);
        toast.success('Client added successfully');
        setIsModalOpen(false);
        setForm({ company: '', website: '', industry: '', contactPerson: '', email: '', phone: '', location: '' });
      }
    } catch (err) {
      toast.error('Failed to add client');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Client Portfolio</h1>
          <p className="text-slate-500 mt-1">Manage corporate entities, hiring requirements, and account health.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Onboard Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              Recent
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="bg-white h-24 rounded-2xl border border-slate-100 animate-pulse" />)
            ) : filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <div key={client.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{client.company}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          {client.website && (
                            <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                              <Globe className="w-3.5 h-3.5" />
                              <span>{client.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className="text-slate-300">|</span>
                          <span className="font-mono text-xs font-bold uppercase tracking-wider">{client.clientCode || 'NO CODE'}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider">ORG: {client.companyId || 'ROOT_TENANT'}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 border-dashed text-slate-400">
                Onboard your first client to start allocating jobs.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Quick Onboard
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Company Name"
                required
                value={formData.company}
                onChange={e => setForm({...formData, company: e.target.value})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all"
              />
              <input
                type="url"
                placeholder="Website (optional)"
                value={formData.website}
                onChange={e => setForm({...formData, website: e.target.value})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all"
              />
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Add Client
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
