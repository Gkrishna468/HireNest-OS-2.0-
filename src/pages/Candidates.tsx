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
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Calendar,
  Zap,
  ArrowRight,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { safeArray, safeString, safeNumber, safeDate } from '@/utils/safe';

export default function Candidates() {
  const { candidates, loading, clients, addCandidate, updateCandidateStatus } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const filteredCandidates = safeArray(candidates).filter(c => 
    safeString(c.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    safeString(c.skills?.join(' ')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'sourced': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'screening': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'interview': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'offer': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'hired': return 'bg-green-100 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* CANDIDATE DETAIL MODAL */}
      {selectedCandidate && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
          >
            {/* Left Panel: Profile */}
            <div className="w-full md:w-80 bg-slate-50 p-8 border-r border-slate-100 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-6 md:hidden">
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full shadow-sm"><XCircle className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-xl shadow-indigo-600/20">
                  {selectedCandidate.name?.[0]}
                </div>
                <h2 className="text-xl font-black text-slate-900">{selectedCandidate.name}</h2>
                <p className="text-sm text-slate-500 font-medium">{selectedCandidate.current_title || 'Expert Candidate'}</p>
                <div className="mt-4 inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100 tracking-widest">
                  Match Score: {selectedCandidate.ai_match_score || 92}%
                </div>
              </div>

              <div className="space-y-6 mt-auto">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Origin Handshake</h4>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">VN-ORG-{selectedCandidate.companyId?.slice(0,4).toUpperCase() || 'ROOT'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase py-0.5">Verified Vendor</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-bold">{selectedCandidate.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-bold">{selectedCandidate.phone || '+91 9XXXX XXXXX'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Details & Org Tree */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="hidden md:flex justify-end mb-6">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
                >
                  <XCircle className="w-6 h-6 text-slate-300 group-hover:text-slate-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-2">Intelligence Summary</h3>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "This candidate shows high potential in {selectedCandidate.skills?.slice(0,2).join(' & ')} with a strong neural match for your recent Java/Oracle mandates."
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">Expertise Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {safeArray(selectedCandidate.skills).map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[11px] font-black rounded-xl border border-indigo-100 uppercase tracking-widest">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Network className="w-24 h-24" />
                  </div>
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Vendor Partnership Tree
                  </h3>
                  
                  <div className="flex flex-col items-center gap-4 relative">
                    {/* ROOT */}
                    <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest backdrop-blur-md">
                      HireNest Master Node
                    </div>
                    {/* CONNECTING LINE */}
                    <div className="w-px h-8 bg-gradient-to-b from-white/20 to-indigo-500/50" />
                    {/* VENDOR */}
                    <div className="px-6 py-3 bg-indigo-600 rounded-2xl border border-indigo-400 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30">
                      VN-{selectedCandidate.companyId?.slice(0,6).toUpperCase() || 'CORE-VENDOR'}
                    </div>
                    {/* CONNECTING LINE */}
                    <div className="w-px h-8 bg-gradient-to-b from-indigo-500/50 to-emerald-500/50" />
                    {/* CANDIDATE */}
                    <div className="px-6 py-3 bg-emerald-500 rounded-2xl border border-emerald-400 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30">
                      {selectedCandidate.name} (Verified)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Talent Pool</h1>
          <p className="text-slate-500 mt-1">Global workspace for unified candidate intelligence and pipeline management.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Add Candidate
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, skill, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          Filters
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white h-24 rounded-2xl border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : filteredCandidates.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expertise & Skills</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status/Stage</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization / Source</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((candidate) => (
                  <tr 
                    key={candidate.id} 
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0 border border-indigo-200">
                          {candidate.name?.[0] || 'C'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate text-sm group-hover:text-indigo-600 transition-colors">
                            {candidate.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">{candidate.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {safeArray(candidate.skills).slice(0, 2).map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase tracking-tighter border border-slate-200">
                            {skill}
                          </span>
                        ))}
                        {safeArray(candidate.skills).length > 2 && (
                          <span className="px-1 py-0.5 text-slate-400 text-[9px] font-bold">
                            +{safeArray(candidate.skills).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 scale-90 origin-left">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900 border-b border-dotted border-slate-300">
                          {candidate.yearsExperience || candidate.experience || 0} yrs
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className={cn("inline-flex px-2 py-0.5 text-[9px] font-black rounded-lg border uppercase tracking-widest", getStageColor(candidate.stage))}>
                        {candidate.stage}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[80px]">
                            {candidate.companyId?.slice(0,8) || 'ROOT'}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-medium italic mt-0.5">Direct Source</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200 group/btn">
                          <Zap className="w-3.5 h-3.5 group-hover/btn:fill-indigo-600" />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-20 text-center rounded-2xl border border-slate-200 border-dashed">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Candidates Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-1">
            Build your talent ecosystem by importing CSVs, scraping LinkedIn, or manually adding profiles.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Add Candidate
          </button>
        </div>
      )}
    </div>
  );
}
