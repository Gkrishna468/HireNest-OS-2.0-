/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Network, 
  Cpu,
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Star,
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Globe,
  Building2,
  Zap,
  Users,
  Briefcase,
  XCircle,
  Edit2,
  Save,
  Trash2,
  LayoutGrid,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { safeArray, safeString } from '@/utils/safe';
import { cn } from '@/lib/utils';
import { getAllVendorRatings, VendorPerformance } from '@/services/vendorService';
import { motion, AnimatePresence } from 'motion/react';
import type { Vendor, Candidate } from '@/types';

export default function Vendors() {
  const { vendors, candidates, loading, addVendor, updateVendor } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [ratings, setRatings] = useState<Record<string, VendorPerformance>>({});
  
  const [formData, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    type: 'vendor' as 'vendor' | 'recruiter',
    isRecruiter: false,
    recruiterCompany: '',
    website: '',
    specialization: '',
    spcos: [
      { name: '', role: 'Founder/Head', email: '', phone: '' },
      { name: '', role: 'Delivery Head', email: '', phone: '' },
      { name: '', role: 'Account Manager', email: '', phone: '' }
    ]
  });

  const [editForm, setEditForm] = useState<Partial<Vendor>>({});

  useEffect(() => {
    async function loadRatings() {
      const data = await getAllVendorRatings();
      setRatings(data);
    }
    loadRatings();
  }, [vendors]);

  const averageRating = Object.values(ratings).length > 0 
    ? Object.values(ratings).reduce((acc, curr) => acc + curr.rating, 0) / Object.values(ratings).length 
    : 3.5;

  const filteredVendors = safeArray(vendors).filter(v => 
    safeString(v.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    safeString(v.company).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof addVendor === 'function') {
        const payload = {
          ...formData,
          name: formData.spcos[0].name || formData.name, // Fallback to first SpCo name
          specialization: formData.specialization.split(',').map(s => s.trim()).filter(Boolean),
          type: (formData.isRecruiter ? 'recruiter' : 'vendor') as any
        };
        await addVendor(payload);
        toast.success('Vendor registered in Neural Ecosystem');
        setIsModalOpen(false);
        setForm({ 
          name: '', company: '', email: '', phone: '', whatsapp: '', location: '', 
          type: 'vendor', isRecruiter: false, recruiterCompany: '', 
          website: '', specialization: '',
          spcos: [
            { name: '', role: 'Founder/Head', email: '', phone: '' },
            { name: '', role: 'Delivery Head', email: '', phone: '' },
            { name: '', role: 'Account Manager', email: '', phone: '' }
          ]
        });
      }
    } catch (err) {
      toast.error('Failed to register vendor');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    try {
      if (typeof updateVendor === 'function') {
        await updateVendor(selectedVendor.id, editForm);
        toast.success('Partner details updated.');
        setIsEditing(false);
        setIsDetailOpen(false);
      }
    } catch (err) {
      toast.error('Failed to update details');
    }
  };

  const openDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditForm(vendor);
    setIsDetailOpen(true);
    setIsEditing(false);
  };

  // Resources (Candidates) for the selected vendor
  const vendorResources = selectedVendor 
    ? safeArray(candidates).filter(c => c.vendorCompanyId === selectedVendor.id || c.vendorId === selectedVendor.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vendor <span className="text-indigo-600">Ecosystem</span></h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 font-medium italic">"Orchestrating high-velocity partnerships and neural quality scores."</p>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Avg Quality: {averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          Add Neural Partner
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search partners, agencies, or specialists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="bg-white h-60 rounded-[2.5rem] border border-slate-100" />)}
        </div>
      ) : filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <motion.div 
              key={vendor.id} 
              whileHover={{ y: -5 }}
              onClick={() => openDetail(vendor)}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="flex items-start justify-between mb-6 relative">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  <Network className="w-7 h-7" />
                </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                      vendor.type === 'recruiter' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {vendor.type}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                       <div className="flex text-amber-400 scale-90">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{(ratings[vendor.id]?.rating || 3.5).toFixed(1)}</span>
                    </div>
                  </div>
              </div>
              
              <div className="relative">
                <h4 className="font-black text-slate-900 text-xl tracking-tight group-hover:text-indigo-600 transition-colors uppercase tracking-widest">{vendor.name}</h4>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{vendor.company}</p>
                
                <div className="mt-3 flex items-center gap-1.5 opacity-60">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vendor.location || 'Remote Global'}</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-4">
                  {safeArray(vendor.specialization).slice(0, 3).map(s => (
                    <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-tight border border-indigo-100/50">{s}</span>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${ratings[vendor.id]?.successRate || 75}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-900">{Math.round(ratings[vendor.id]?.successRate || 75)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resources</span>
                    <div className="flex items-center -space-x-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                           <Users className="w-3 h-3 text-slate-400" />
                         </div>
                       ))}
                       <span className="ml-3 text-[10px] font-black text-indigo-600">+{(ratings[vendor.id]?.totalPlacements || 0) + 12}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 text-center rounded-[3rem] border border-slate-200 border-dashed">
          <div className="max-w-xs mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Zero Partners Detected</p>
            <p className="text-slate-400 text-sm italic">Initiate neural handshake by adding your first delivery partner.</p>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {isDetailOpen && selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]"
            >
              <div className="w-full md:w-80 bg-slate-950 p-8 text-white flex flex-col justify-between">
                <div>
                  <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-6">
                    <Cpu className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight leading-tight uppercase">{selectedVendor.name}</h2>
                  <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">{selectedVendor.company}</p>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-medium truncate">{selectedVendor.email || 'no-email@partner.ai'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Phone className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-medium">{selectedVendor.phone || '+X XXX-XXX-XXXX'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-medium">{selectedVendor.whatsapp || 'WhatsApp Unlinked'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-medium truncate">{selectedVendor.website || 'neural-partnership.io'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verified Partner</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="bg-indigo-600/10 rounded-2xl p-4 border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Success Rate</span>
                       <span className="text-sm font-black">94%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[94%]" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 border border-white/20 rounded-2xl hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    {isEditing ? <XCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {isEditing ? 'Cancel Edit' : 'Modify Entity'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      selectedVendor.type === 'recruiter' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {selectedVendor.type}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDetailOpen(false)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Name</label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Entity</label>
                        <input
                          type="text"
                          value={editForm.company || ''}
                          onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Node</label>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Frequency</label>
                        <input
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Interface</label>
                        <input
                          type="text"
                          value={editForm.whatsapp || ''}
                          onChange={(e) => setEditForm({...editForm, whatsapp: e.target.value})}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cloud Website</label>
                        <input
                          type="text"
                          value={editForm.website || ''}
                          onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Modify Neural SPCOs
                      </h3>
                      <div className="space-y-4">
                        {(editForm.spcos || [{ name: '', role: 'Founder/Head', email: '', phone: '' }]).map((spco: any, index: number) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
                            <input
                              type="text"
                              value={spco.name}
                              placeholder="Name"
                              onChange={(e) => {
                                const newSpcos = [...(editForm.spcos || [])];
                                newSpcos[index] = { ...spco, name: e.target.value };
                                setEditForm({ ...editForm, spcos: newSpcos });
                              }}
                              className="px-3 py-2 border border-slate-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                            />
                            <input
                              type="email"
                              value={spco.email}
                              placeholder="Email"
                              onChange={(e) => {
                                const newSpcos = [...(editForm.spcos || [])];
                                newSpcos[index] = { ...spco, email: e.target.value };
                                setEditForm({ ...editForm, spcos: newSpcos });
                              }}
                              className="px-3 py-2 border border-slate-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                            />
                            <input
                              type="tel"
                              value={spco.phone}
                              placeholder="Phone"
                              onChange={(e) => {
                                const newSpcos = [...(editForm.spcos || [])];
                                newSpcos[index] = { ...spco, phone: e.target.value };
                                setEditForm({ ...editForm, spcos: newSpcos });
                              }}
                              className="px-3 py-2 border border-slate-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3"
                    >
                      <Save className="w-5 h-5" />
                      Commit Neural Update
                    </button>
                  </form>
                ) : (
                  <div className="space-y-12">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Org Tree: Associated Resources</h3>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                          {vendorResources.length} Entities Found
                        </span>
                      </div>

                      {vendorResources.length > 0 ? (
                        <div className="space-y-4 relative">
                          <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-200" />
                          {vendorResources.map((res: Candidate, idx) => (
                            <motion.div 
                              key={res.id} 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative ml-4"
                            >
                              <div className="absolute -left-6 top-1/2 w-6 h-px bg-slate-200" />
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-indigo-100">
                                  <UserCheck className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{res.name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.currentTitle || 'Neural Engineer'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Prob.</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-black text-slate-900">{res.aiMatchScore || 85}%</span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-12 rounded-[2rem] border border-slate-200 border-dashed text-center">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">No resources associated yet.</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-1">
                         <TrendingUp className="w-5 h-5 text-indigo-600 mb-2" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Index</span>
                         <span className="text-2xl font-black text-slate-900 tracking-tighter">0.98</span>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-1">
                         <Briefcase className="w-5 h-5 text-indigo-600 mb-2" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Ops</span>
                         <span className="text-2xl font-black text-slate-900 tracking-tighter">04</span>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-slate-950 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative">
                  <h2 className="text-xl font-black tracking-tight uppercase">Register Neural Partner</h2>
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-1">Expanding your agency delivery nodes</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Focal Person Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setForm({...formData, name: e.target.value})}
                      placeholder="e.g. Elena Vance"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agency / Company Name</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setForm({...formData, company: e.target.value})}
                      placeholder="e.g. Nexus Talent Corp"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Interface</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setForm({...formData, email: e.target.value})}
                      placeholder="partnerships@nexus.io"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Frequency</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setForm({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Interface</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setForm({...formData, whatsapp: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Neural Website</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setForm({...formData, website: e.target.value})}
                      placeholder="www.nexus-talent.io"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specializations (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setForm({...formData, specialization: e.target.value})}
                      placeholder="React, AWS, Python, FinTech..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Neural SPCOs Section */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Neural SPCOs (Points of Contact)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {formData.spcos.map((spco, index) => (
                      <div key={index} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-600 bg-white px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                            {index === 0 ? "Mandatory: FOUNDER / HEAD" : `Optional Node: ${spco.role}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-sm outline-none focus:border-indigo-500 font-medium"
                            value={spco.name}
                            onChange={(e) => {
                              const newSpcos = [...formData.spcos];
                              newSpcos[index].name = e.target.value;
                              setForm({ ...formData, spcos: newSpcos });
                            }}
                            required={index === 0}
                          />
                          <input
                            type="email"
                            placeholder="Email Interface"
                            className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-sm outline-none focus:border-indigo-500 font-medium"
                            value={spco.email}
                            onChange={(e) => {
                              const newSpcos = [...formData.spcos];
                              newSpcos[index].email = e.target.value;
                              setForm({ ...formData, spcos: newSpcos });
                            }}
                            required={index === 0}
                          />
                          <input
                            type="tel"
                            placeholder="Phone Frequency"
                            className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-sm outline-none focus:border-indigo-500 font-medium"
                            value={spco.phone}
                            onChange={(e) => {
                              const newSpcos = [...formData.spcos];
                              newSpcos[index].phone = e.target.value;
                              setForm({ ...formData, spcos: newSpcos });
                            }}
                            required={index === 0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="md:col-span-2 flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-200">
                    <input
                      id="isRecruiter"
                      type="checkbox"
                      checked={formData.isRecruiter}
                      onChange={(e) => setForm({...formData, isRecruiter: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <div>
                      <label htmlFor="isRecruiter" className="text-xs font-black text-slate-900 uppercase tracking-widest block">External Recruiter Entity</label>
                      <p className="text-[10px] text-slate-500 italic mt-0.5">Toggle if this partner operates as an independent talent scout.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Formalize Partnership
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
