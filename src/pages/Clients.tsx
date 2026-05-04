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
  ExternalLink,
  Briefcase,
  Star,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { safeArray, safeString } from '@/utils/safe';

import { motion, AnimatePresence } from 'motion/react';

export default function Clients() {
  const { clients, jobs, loading, addClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
        // Robustness: Ensure website has protocol if entered
        let cleanWebsite = formData.website;
        if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
          cleanWebsite = `https://${cleanWebsite}`;
        }
        
        await addClient({ ...formData, website: cleanWebsite });
        toast.success('Client onboarded successfully');
        setIsModalOpen(false);
        setForm({ company: '', website: '', industry: '', contactPerson: '', email: '', phone: '', location: '' });
      }
    } catch (err) {
      console.error('Onboard error:', err);
      toast.error('Failed to add client');
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Corporate Onboarding</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Registering new entity in Neural OS</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Entity Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setForm({...formData, company: e.target.value})}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Domain</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setForm({...formData, website: e.target.value})}
                    placeholder="www.acme.co"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Industry Vertical</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setForm({...formData, industry: e.target.value})}
                    placeholder="e.g. FinTech"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Point of Contact</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setForm({...formData, contactPerson: e.target.value})}
                    placeholder="Full Name"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Interface</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setForm({...formData, email: e.target.value})}
                    placeholder="contact@company.com"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Headquarters</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setForm({...formData, location: e.target.value})}
                    placeholder="City, Country"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2 text-right md:col-span-1 pt-6">
                   <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors mr-6"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30"
                  >
                    Authorize Entity
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailOpen && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">{selectedClient.company} Dashboard</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Enterprise Talent Requirements</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/50 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Open Positions</p>
                      <p className="text-3xl font-black text-slate-900">
                        {safeArray(jobs).filter(j => (j.clientId === selectedClient.id || j.clientName === selectedClient.company) && j.status === 'open').length}
                      </p>
                   </div>
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Placements</p>
                      <p className="text-3xl font-black text-emerald-600">12</p>
                   </div>
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Neural Health</p>
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-black text-slate-900">98%</p>
                        <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      Assigned Job Requisitions
                   </h3>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {safeArray(jobs)
                        .filter(j => j.clientId === selectedClient.id || j.clientName === selectedClient.company)
                        .map(job => (
                          <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all group flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                                  job.status === 'open' ? "bg-emerald-500" : "bg-slate-400"
                                )}>
                                  <Target className="w-5 h-5" />
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-900 tracking-tight">{job.title}</h4>
                                   <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{job.type}</span>
                                      <span className="text-slate-200">•</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{job.location}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                  job.status === 'open' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                )}>
                                  {job.status}
                                </div>
                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                   <ArrowRight className="w-5 h-5" />
                                </button>
                             </div>
                          </div>
                        ))}
                      
                      {safeArray(jobs).filter(j => j.clientId === selectedClient.id || j.clientName === selectedClient.company).length === 0 && (
                        <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                           <p className="text-xs font-bold text-slate-400 italic">No job requisitions found for this entity.</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                >
                  Close Portfolio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client <span className="text-indigo-600">Portfolio</span></h1>
          <p className="text-slate-500 mt-1 font-medium">"Managing {clients.length} corporate partnerships across the global neural marketplace."</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          Onboard Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search portfolios, entities, or sectors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="bg-white h-24 rounded-[2rem] border border-slate-100 animate-pulse" />)
            ) : filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <div key={client.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 
                        onClick={() => { setSelectedClient(client); setIsDetailOpen(true); }}
                        className="font-black text-slate-900 text-lg uppercase tracking-tight cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        {client.company}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Star className="w-3 h-3 fill-amber-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Score: {Math.floor(Math.random() * 20) + 80}
                          </span>
                        </div>
                        <span className="text-slate-200">|</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Briefcase className="w-3 h-3 text-indigo-500" />
                          <span className="text-indigo-600">
                            {safeArray(jobs).filter(j => j.clientId === client.id || j.clientName === client.company).length} Jobs
                          </span>
                        </div>
                        <span className="text-slate-200">|</span>
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">{client.clientCode || 'NO CODE'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setSelectedClient(client); setIsDetailOpen(true); }}
                      className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-20 text-center rounded-[3rem] border border-slate-200 border-dashed">
                <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Zero Entities Synchronized</p>
                  <p className="text-slate-400 text-xs italic">Initiate onboarding to populate your corporate portfolio.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              Quick Entity Gate
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5 relative">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Name</label>
                <input
                  type="text"
                  placeholder="Neural Corp"
                  required
                  value={formData.company}
                  onChange={e => setForm({...formData, company: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none text-sm transition-all font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Domain Node</label>
                <input
                  type="text"
                  placeholder="neural.ai"
                  value={formData.website}
                  onChange={e => setForm({...formData, website: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none text-sm transition-all font-medium"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 text-xs mt-4"
              >
                Register Entity
              </button>
            </form>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Portfolio Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Hubs</p>
                 <p className="text-2xl font-black text-slate-900">{clients.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
                 <p className="text-2xl font-black text-emerald-600">92%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
