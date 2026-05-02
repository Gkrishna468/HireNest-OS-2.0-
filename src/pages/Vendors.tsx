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
  Truck, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Star,
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { safeArray, safeString } from '@/utils/safe';
import { cn } from '@/lib/utils';
import { getAllVendorRatings, VendorPerformance } from '@/services/vendorService';

export default function Vendors() {
  const { vendors, loading, addVendor } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, VendorPerformance>>({});
  const [formData, setForm] = useState({
    name: '',
    company: '',
    type: 'vendor' as 'vendor' | 'recruiter',
    isRecruiter: false,
    recruiterCompany: ''
  });

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
          type: (formData.isRecruiter ? 'recruiter' : 'vendor') as any
        };
        await addVendor(payload);
        toast.success('Vendor registered');
        setIsModalOpen(false);
        setForm({ name: '', company: '', type: 'vendor', isRecruiter: false, recruiterCompany: '' });
      }
    } catch (err) {
      toast.error('Failed to register vendor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vendor <span className="text-orange-600">Ecosystem</span></h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 font-medium italic">"Managing high-velocity partnerships and neural quality scores."</p>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Avg Quality: {averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Add Partner
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search partners or agencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="bg-white h-40 rounded-2xl border border-slate-100" />)}
        </div>
      ) : filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Truck className="w-6 h-6" />
                </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border",
                      vendor.type === 'recruiter' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {vendor.type}
                    </span>
                    <div className="flex items-center gap-2">
                       <div className="flex text-yellow-400 scale-90">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const rating = ratings[vendor.id]?.rating || 3.5;
                          return (
                            <Star 
                              key={s} 
                              className={cn(
                                "w-4 h-4",
                                s <= Math.round(rating) ? "fill-current" : "opacity-20"
                              )} 
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{(ratings[vendor.id]?.rating || 3.5).toFixed(1)}</span>
                    </div>
                  </div>
              </div>
              
              <div>
                <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{vendor.name}</h4>
                <p className="text-sm text-slate-500 font-medium">{vendor.company}</p>
                <div className="mt-2 flex items-center gap-1.5 opacity-60">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">ORG: {vendor.companyId || 'ROOT_TENANT'}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-4">
                  {safeArray(vendor.specialization).slice(0, 3).map(s => (
                    <span key={s} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded uppercase border border-slate-100">{s}</span>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Placements</span>
                    <span className="text-sm font-black text-slate-900">{ratings[vendor.id]?.totalPlacements || 0}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Success Rate</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-sm font-black text-slate-900">{Math.round(ratings[vendor.id]?.successRate || 0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 text-center rounded-2xl border border-slate-200 border-dashed text-slate-400">
          No delivery partners registered in this organization.
        </div>
      )}
    </div>
  );
}
