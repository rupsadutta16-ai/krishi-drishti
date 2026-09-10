import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  ShieldCheck,
  Wheat,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { getCases, getCaseDetail, submitCaseToExpert } from '../../api/cases';

const STATUS_BADGES = {
  open: {
    label: 'Open',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
  pending_expert: {
    label: 'Pending Expert',
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  validated: {
    label: 'Validated',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed',
    classes: 'bg-stone-100 text-stone-600 border-stone-200',
    icon: AlertCircle,
  },
};

export default function CasesPage({ onBack }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCases();
      setCases(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleSelectCase = async (caseId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCaseDetail(caseId);
      setSelectedCase(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToExpert = async (caseId) => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await submitCaseToExpert(caseId);
      setSelectedCase(res.data);
      setSuccessMsg('Case submitted to extension expert for review.');
      loadCases();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit case.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'open';
    const config = STATUS_BADGES[s] || STATUS_BADGES.open;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center space-x-3">
          {selectedCase ? (
            <button
              onClick={() => setSelectedCase(null)}
              className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Back to Cases"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : onBack ? (
            <button
              onClick={onBack}
              className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div>
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-6 w-6 text-emerald-800" />
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {selectedCase ? selectedCase.title : 'My Agricultural Cases'}
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedCase
                ? `Case #${selectedCase.id} · Farm #${selectedCase.farm_id} · Crop #${selectedCase.crop_id}`
                : 'Longitudinal plant health records and expert consultation tracking'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => (selectedCase ? handleSelectCase(selectedCase.id) : loadCases())}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg border border-stone-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && !selectedCase && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-800 border-r-transparent mb-3" />
          <p className="text-sm font-medium text-stone-600">Loading cases...</p>
        </div>
      )}

      {/* Detail View */}
      {selectedCase ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Status & Summary Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-3">
                {getStatusBadge(selectedCase.status)}
                <span className="text-xs text-stone-500">
                  Last updated: {formatDate(selectedCase.updated_at)}
                </span>
              </div>

              {selectedCase.status === 'open' && (
                <button
                  onClick={() => handleSubmitToExpert(selectedCase.id)}
                  disabled={submitting}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-amber-700 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5 text-amber-200" />
                  <span>{submitting ? 'Submitting...' : 'Submit Case to Expert'}</span>
                </button>
              )}
            </div>

            {selectedCase.description && (
              <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                {selectedCase.description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-medium">Farm ID</span>
                <p className="font-extrabold text-stone-900 mt-0.5">#{selectedCase.farm_id}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-medium">Crop ID</span>
                <p className="font-extrabold text-stone-900 mt-0.5">#{selectedCase.crop_id}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-medium">Observations</span>
                <p className="font-extrabold text-stone-900 mt-0.5">
                  {selectedCase.observations?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-medium">Validations</span>
                <p className="font-extrabold text-stone-900 mt-0.5">
                  {selectedCase.validations?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Expert Validations Section */}
          {selectedCase.validations?.length > 0 && (
            <div className="bg-emerald-50/40 rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-800" />
                <h2 className="text-base font-bold text-emerald-950">Expert Validations & Advice</h2>
              </div>
              <div className="space-y-3">
                {selectedCase.validations.map((val) => (
                  <div key={val.id} className="p-4 bg-white rounded-xl border border-emerald-100 shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Verdict: {val.validation_result?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {formatDate(val.created_at)}
                      </span>
                    </div>

                    {val.corrected_disease && (
                      <p className="text-xs text-stone-800">
                        <span className="font-semibold text-stone-900">Corrected Disease: </span>
                        {val.corrected_disease}
                      </p>
                    )}
                    {val.corrected_pest && (
                      <p className="text-xs text-stone-800">
                        <span className="font-semibold text-stone-900">Corrected Pest: </span>
                        {val.corrected_pest}
                      </p>
                    )}
                    {val.comments && (
                      <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded border border-stone-100">
                        <span className="font-semibold text-stone-800">Expert Comments: </span>
                        {val.comments}
                      </p>
                    )}
                    {val.treatment_recommendation && (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs">
                        <p className="font-bold text-emerald-900">Integrated Pest Management (IPM) Recommendation:</p>
                        <p className="text-emerald-950 mt-1">{val.treatment_recommendation}</p>
                      </div>
                    )}
                    <p className="text-[11px] text-stone-400">
                      Validated by: {val.expert_name || `Expert #${val.expert_id}`}{' '}
                      {val.expert_organization ? `(${val.expert_organization})` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observations Timeline Section */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
              <Clock className="h-5 w-5 text-emerald-800" />
              <span>Observation History Timeline</span>
            </h2>

            {selectedCase.observations?.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">
                No observations linked to this case yet.
              </p>
            ) : (
              <div className="relative pl-6 border-l-2 border-emerald-700 space-y-6">
                {selectedCase.observations.map((obs, idx) => (
                  <div key={obs.id} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-800 ring-4 ring-emerald-50" />

                    <div className="p-4 bg-stone-50 hover:bg-emerald-50/40 rounded-xl border border-stone-200 transition-colors space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-stone-900">
                            Observation #{obs.id}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full">
                              Initial
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-stone-500">
                          {formatDate(obs.observed_at)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {obs.image_url ? (
                          <img
                            src={obs.image_url}
                            alt={`Observation ${obs.id}`}
                            className="w-20 h-20 object-cover rounded-lg border border-stone-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-stone-200 rounded-lg flex items-center justify-center text-stone-400">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}

                        <div className="space-y-1 text-xs text-stone-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-stone-800">Status:</span>
                            <span className="capitalize font-medium text-emerald-800">
                              {obs.status?.replace('_', ' ')}
                            </span>
                          </div>
                          {obs.image_quality_score != null && (
                            <p>
                              <span className="font-semibold text-stone-800">Image Quality: </span>
                              {obs.image_quality_score.toFixed(1)}/100
                            </p>
                          )}
                          {(obs.latitude != null || obs.longitude != null) && (
                            <p className="text-stone-500">
                              Location: {obs.latitude?.toFixed(4)}, {obs.longitude?.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Case List View */
        <div className="space-y-4">
          {cases.length === 0 && !loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-3">
              <FolderOpen className="h-12 w-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No Cases Found</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Agricultural cases organize disease detections over time and track extension expert consultations. Submit an observation to an expert from the Reports page to create your first case.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className="bg-white hover:bg-emerald-50/30 p-5 rounded-2xl border border-stone-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-stone-500">Case #{c.id}</span>
                      {getStatusBadge(c.status)}
                    </div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-950 line-clamp-1">
                      {c.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                      <span className="inline-flex items-center space-x-1">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Farm #{c.farm_id}</span>
                      </span>
                      <span className="inline-flex items-center space-x-1">
                        <Wheat className="h-3.5 w-3.5 text-amber-700" />
                        <span>Crop #{c.crop_id}</span>
                      </span>
                      <span className="inline-flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        <span>{c.observation_count ?? c.observations?.length ?? 0} observation(s)</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>Updated {formatDate(c.updated_at)}</span>
                    <span className="inline-flex items-center space-x-1 text-emerald-800 font-bold">
                      <span>View Timeline</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
