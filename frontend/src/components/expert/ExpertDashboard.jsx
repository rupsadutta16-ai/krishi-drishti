import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Building2,
  Wheat,
  User,
  Image as ImageIcon,
  ArrowLeft,
  FileCheck,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import {
  getExpertReviewQueue,
  getExpertCaseDetail,
  validateCase,
} from '../../api/expert';

export default function ExpertDashboard({ onLogout }) {
  const [queue, setQueue] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Validation form state
  const [validationResult, setValidationResult] = useState('confirmed');
  const [correctedDisease, setCorrectedDisease] = useState('');
  const [correctedPest, setCorrectedPest] = useState('');
  const [comments, setComments] = useState('');
  const [treatmentRecommendation, setTreatmentRecommendation] = useState('');

  const fetchQueue = async () => {
    setLoadingQueue(true);
    setError(null);
    try {
      const res = await getExpertReviewQueue();
      setQueue(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load expert review queue.');
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectCase = async (caseId) => {
    setLoadingDetail(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await getExpertCaseDetail(caseId);
      setSelectedCase(res.data);
      // Reset form
      setValidationResult('confirmed');
      setCorrectedDisease('');
      setCorrectedPest('');
      setComments('');
      setTreatmentRecommendation('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load case details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleValidationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    const payload = {
      validation_result: validationResult,
      corrected_disease: validationResult === 'corrected' ? correctedDisease.trim() : null,
      corrected_pest: validationResult === 'corrected' ? correctedPest.trim() : null,
      comments: comments.trim() || null,
      treatment_recommendation: treatmentRecommendation.trim() || null,
    };

    try {
      await validateCase(selectedCase.id, payload);
      setSuccessMsg('Expert validation submitted successfully!');
      // Reload queue and clear selection
      await fetchQueue();
      setTimeout(() => {
        setSelectedCase(null);
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit validation.');
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

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-emerald-950 text-white border-b border-emerald-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800 rounded-xl text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight">
                KRISHI DRISHTI · EXPERT PORTAL
              </span>
              <p className="text-[11px] text-emerald-300 font-medium">
                Agronomic Diagnostics & Quality Control
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchQueue}
              disabled={loadingQueue}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-emerald-700/50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Queue</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-red-700/50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {selectedCase ? (
          /* Case Inspection & Validation View */
          <div className="space-y-6 animate-fadeIn">
            {/* Top Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <button
                onClick={() => setSelectedCase(null)}
                className="inline-flex items-center space-x-2 text-xs font-bold text-stone-600 hover:text-emerald-950 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Review Queue</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Case #{selectedCase.id} · Awaiting Expert Verdict
                </span>
              </div>
            </div>

            {/* Case Overview & Environmental Context */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <h1 className="text-xl font-black text-stone-900 tracking-tight">
                  {selectedCase.title}
                </h1>
                <span className="text-xs text-stone-500">
                  Submitted on: {formatDate(selectedCase.updated_at)}
                </span>
              </div>

              {selectedCase.description && (
                <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                  {selectedCase.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-500 font-medium">Farmer ID</span>
                  <p className="font-extrabold text-stone-900 mt-0.5">#{selectedCase.farmer_id}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-500 font-medium">Farm ID</span>
                  <p className="font-extrabold text-stone-900 mt-0.5">#{selectedCase.farm_id}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-500 font-medium">Crop ID</span>
                  <p className="font-extrabold text-stone-900 mt-0.5">#{selectedCase.crop_id}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-500 font-medium">Total Observations</span>
                  <p className="font-extrabold text-stone-900 mt-0.5">
                    {selectedCase.observations?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Observations & AI Findings */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-emerald-800" />
                <span>Field Observations & Image Evidence</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCase.observations?.map((obs, idx) => (
                  <div
                    key={obs.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
                        <span className="text-xs font-bold text-stone-900">
                          Observation #{obs.id} {idx === 0 && '(Initial Request)'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {formatDate(obs.observed_at)}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {obs.image_url ? (
                          <a
                            href={obs.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block shrink-0"
                          >
                            <img
                              src={obs.image_url}
                              alt={`Observation ${obs.id}`}
                              className="w-24 h-24 object-cover rounded-lg border border-stone-300 shadow-xs hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <div className="w-24 h-24 bg-stone-200 rounded-lg flex items-center justify-center text-stone-400 shrink-0">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}

                        <div className="text-xs space-y-1.5 text-stone-600">
                          <p>
                            <span className="font-semibold text-stone-800">Status: </span>
                            <span className="font-bold text-emerald-800 uppercase text-[11px]">
                              {obs.status}
                            </span>
                          </p>
                          {obs.image_quality_score != null && (
                            <p>
                              <span className="font-semibold text-stone-800">Quality Score: </span>
                              {obs.image_quality_score.toFixed(1)} / 100
                            </p>
                          )}
                          {(obs.latitude != null || obs.longitude != null) && (
                            <p className="text-stone-500 text-[11px]">
                              GPS: {obs.latitude?.toFixed(4)}, {obs.longitude?.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Form */}
            <form
              onSubmit={handleValidationSubmit}
              className="bg-white rounded-2xl p-6 border-2 border-emerald-700/60 shadow-lg space-y-5"
            >
              <div className="flex items-center space-x-2.5 pb-3 border-b border-stone-200">
                <FileCheck className="h-6 w-6 text-emerald-800" />
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Submit Expert Agronomic Validation
                  </h2>
                  <p className="text-xs text-stone-500">
                    Your assessment updates the official case record and provides actionable IPM advice to the farmer.
                  </p>
                </div>
              </div>

              {/* Radio Group: Verdict */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Diagnostic Verdict
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      validationResult === 'confirmed'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value="confirmed"
                      checked={validationResult === 'confirmed'}
                      onChange={() => setValidationResult('confirmed')}
                      className="text-emerald-700 focus:ring-emerald-700"
                    />
                    <span className="text-xs">Confirm AI Prediction</span>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      validationResult === 'corrected'
                        ? 'border-amber-700 bg-amber-50 text-amber-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value="corrected"
                      checked={validationResult === 'corrected'}
                      onChange={() => setValidationResult('corrected')}
                      className="text-amber-700 focus:ring-amber-700"
                    />
                    <span className="text-xs">Correct Diagnosis</span>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      validationResult === 'needs_investigation'
                        ? 'border-blue-700 bg-blue-50 text-blue-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value="needs_investigation"
                      checked={validationResult === 'needs_investigation'}
                      onChange={() => setValidationResult('needs_investigation')}
                      className="text-blue-700 focus:ring-blue-700"
                    />
                    <span className="text-xs">Needs Investigation</span>
                  </label>
                </div>
              </div>

              {/* Conditional Corrected Fields */}
              {validationResult === 'corrected' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Corrected Disease Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sheath Blight, Brown Spot"
                      value={correctedDisease}
                      onChange={(e) => setCorrectedDisease(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Corrected Pest / Vector (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Brown Planthopper, Stem Borer"
                      value={correctedPest}
                      onChange={(e) => setCorrectedPest(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>
              )}

              {/* Comments Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Expert Comments & Pathological Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your reasoning, key visual markers identified, or diagnostic confidence..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-sans"
                />
              </div>

              {/* IPM / Treatment Recommendation Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Integrated Pest Management (IPM) & Extension Advisory
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide precise curative/preventative treatments, chemical dosage, biopesticide recommendations, and crop management practices..."
                  value={treatmentRecommendation}
                  onChange={(e) => setTreatmentRecommendation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-sans"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer border border-emerald-700"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Submitting Verdict...' : 'Submit Validation'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Review Queue List View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-stone-900 tracking-tight">
                  Triage Review Queue
                </h1>
                <p className="text-xs text-stone-500">
                  Cases submitted by farmers requiring extension expert validation
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-200">
                {queue.length} Pending Case(s)
              </span>
            </div>

            {loadingQueue ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-800 border-r-transparent mb-3" />
                <p className="text-sm font-medium text-stone-600">Loading triage queue...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">Queue is Clear!</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  There are currently no cases awaiting expert review. All submitted cases have been validated.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCase(item.id)}
                    className="bg-white hover:bg-emerald-50/30 p-5 rounded-2xl border border-stone-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-400">Case #{item.id}</span>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          <span>Pending Expert</span>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 line-clamp-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-stone-500 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                        <span className="inline-flex items-center space-x-1">
                          <User className="h-3.5 w-3.5 text-stone-500" />
                          <span>Farmer #{item.farmer_id}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Farm #{item.farm_id}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <Wheat className="h-3.5 w-3.5 text-amber-700" />
                          <span>Crop #{item.crop_id}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>Submitted: {formatDate(item.updated_at)}</span>
                      <span className="inline-flex items-center space-x-1 text-emerald-800 font-bold">
                        <span>Review & Validate →</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
