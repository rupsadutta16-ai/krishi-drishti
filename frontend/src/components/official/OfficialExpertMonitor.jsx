import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Award,
  Building,
  FileText,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { getOfficialExperts, verifyOfficialExpert } from '../../api/official';
import ExpertProfileModal from '../common/ExpertProfileModal';

export default function OfficialExpertMonitor() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | VERIFIED | UNVERIFIED
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOfficialExperts();
      setExperts(data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load expert profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const handleVerify = async (expertId) => {
    setVerifyingId(expertId);
    setSuccessMsg('');
    setError(null);
    try {
      const updated = await verifyOfficialExpert(expertId, true);
      setExperts((prev) =>
        prev.map((e) => (e.id === expertId ? { ...e, is_verified: true } : e))
      );
      if (selectedExpert && selectedExpert.id === expertId) {
        setSelectedExpert((prev) => ({ ...prev, is_verified: true }));
      }
      setSuccessMsg(`✓ Successfully verified expert ${updated.name || ''}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to verify expert.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Filtered list
  const filteredExperts = experts.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      (e.name && e.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.specialization && e.specialization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.organization && e.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.qualification && e.qualification.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'VERIFIED'
        ? e.is_verified
        : !e.is_verified;

    return matchesSearch && matchesStatus;
  });

  const totalCount = experts.length;
  const verifiedCount = experts.filter((e) => e.is_verified).length;
  const unverifiedCount = totalCount - verifiedCount;
  const docUploadedCount = experts.filter((e) => Boolean(e.verification_doc_url)).length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>Expert Panel & Credentials Verification</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Review expert qualifications, view uploaded verification documents, and grant official verification status.
          </p>
        </div>

        <button
          onClick={fetchExperts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Experts</p>
          <p className="text-xl font-extrabold text-stone-800 mt-0.5">{totalCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('VERIFIED')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </p>
          <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{verifiedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('UNVERIFIED')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'UNVERIFIED'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Unverified</span>
          </p>
          <p className="text-xl font-extrabold text-amber-700 mt-0.5">{unverifiedCount}</p>
        </button>

        <div className="p-3 rounded-xl border bg-stone-50 border-stone-200 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <FileText className="w-3 h-3 text-stone-600" />
            <span>Docs Uploaded</span>
          </p>
          <p className="text-xl font-extrabold text-stone-800 mt-0.5">{docUploadedCount}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, specialization, org..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-xs text-stone-400 font-semibold uppercase shrink-0">Filter:</span>
          {['ALL', 'VERIFIED', 'UNVERIFIED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Expert Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredExperts.length === 0 ? (
        <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
          <User className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-600">No experts found</p>
          <p className="text-xs text-stone-400 mt-1">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExperts.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Name & Verification Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                      <User className="w-6 h-6 text-emerald-800" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-sm">{exp.name}</h3>
                      <p className="text-xs text-stone-400">@{exp.username}</p>
                    </div>
                  </div>
                  {exp.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Unverified</span>
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-medium truncate">{exp.specialization || 'General Agronomy'}</span>
                  </div>
                  {exp.qualification && (
                    <div className="flex items-center gap-2 text-stone-500">
                      <span className="w-3.5 text-center font-bold text-[10px] text-emerald-800">Q:</span>
                      <span className="truncate">{exp.qualification}</span>
                    </div>
                  )}
                  {exp.organization && (
                    <div className="flex items-center gap-2 text-stone-500">
                      <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{exp.organization}</span>
                    </div>
                  )}
                </div>

                {/* Verification Document link status */}
                <div className="pt-2 border-t border-stone-100">
                  {exp.verification_doc_url ? (
                    <a
                      href={exp.verification_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Verification Document Uploaded</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-stone-400 italic">No document uploaded</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4 mt-3 border-t border-stone-100">
                <button
                  onClick={() => setSelectedExpert(exp)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {!exp.is_verified && (
                  <button
                    onClick={() => handleVerify(exp.id)}
                    disabled={verifyingId === exp.id}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verifyingId === exp.id ? 'Verifying...' : 'Verify'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expert Profile Modal */}
      {selectedExpert && (
        <ExpertProfileModal
          expert={selectedExpert}
          onClose={() => setSelectedExpert(null)}
          isOfficial={true}
          onVerify={handleVerify}
          verifying={verifyingId === selectedExpert.id}
        />
      )}
    </div>
  );
}
