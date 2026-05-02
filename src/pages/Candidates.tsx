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
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {candidate.name?.[0] || 'C'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {candidate.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{candidate.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {safeArray(candidate.skills).slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                            {skill}
                          </span>
                        ))}
                        {safeArray(candidate.skills).length > 3 && (
                          <span className="px-2 py-0.5 text-slate-400 text-[10px] font-bold">
                            +{safeArray(candidate.skills).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900">
                          {candidate.yearsExperience || candidate.experience || 0} yrs
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider", getStageColor(candidate.stage))}>
                        {candidate.stage}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {candidate.source === 'resume' ? (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded font-bold uppercase tracking-widest text-[9px]">AI Resume</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-bold uppercase tracking-widest text-[9px]">Portal</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 opacity-60">ID: {candidate.companyId || 'ROOT'}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{candidate.vendorName || candidate.vendorCode || 'Direct'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200">
                          <Zap className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-all border border-transparent">
                          <MoreVertical className="w-4 h-4" />
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
