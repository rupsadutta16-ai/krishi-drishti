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
  Brain,
  AlertCircle,
  ThumbsUp,
  Edit,
  Eye,
  Droplets,
  Thermometer,
  Wind,
  MapPin,
  Sprout,
  TestTube,
  BadgeAlert,
} from 'lucide-react';

import {
  getExpertReviewQueue,
  getExpertCaseDetail,
  validateCase,
  getAIAnalysis,
  getWeatherData,
  getSoilData,
} from '../../api/expert';
import { getCurrentUser } from '../../api/auth';

export default function ExpertDashboard({ onLogout, onEditProfile }) {
  const [queue, setQueue] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Current expert user data (for profile completeness check)
  const [currentUser, setCurrentUser] = useState(null);

  // Weather & soil context
  const [weatherData, setWeatherData] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Per-observation AI analyses
  const [aiAnalyses, setAiAnalyses] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  // Validation form state
  const [validationResult, setValidationResult] = useState('confirmed');
  const [correctedDisease, setCorrectedDisease] = useState('');
  const [correctedPest, setCorrectedPest] = useState('');
  const [comments, setComments] = useState('');
  const [treatmentRecommendation, setTreatmentRecommendation] = useState('');

  // Profile completeness: expert profile is incomplete if missing key fields
  const isProfileIncomplete = currentUser && (
    !currentUser.expert_profile?.specialization ||
    !currentUser.expert_profile?.qualification ||
    !currentUser.expert_profile?.organization
  );

  const fetchQueue = async () => {
    setLoadingQueue(true);
    setError(null);
    try {
      const res = await getExpertReviewQueue();
      setQueue(res.data || []);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load expert review queue.';
      setError(errorMsg);
      console.error('Error fetching queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Load current user to check profile completeness
    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => {});
  }, []);

  const fetchEnvironmentalContext = async (farmId) => {
    if (!farmId) return;
    setLoadingContext(true);
    try {
      const [weatherRes, soilRes] = await Promise.all([
        getWeatherData(farmId).catch(() => null),
        getSoilData(farmId).catch(() => null),
      ]);
      if (weatherRes) setWeatherData(weatherRes.data);
      if (soilRes) setSoilData(soilRes.data);
    } catch (err) {
      console.warn('Could not load environmental context:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  const fetchAIAnalysis = async (observationId) => {
    if (aiAnalyses[observationId]) return; // already loaded
    setLoadingAI((prev) => ({ ...prev, [observationId]: true }));
    try {
      const res = await getAIAnalysis(observationId);
      setAiAnalyses((prev) => ({ ...prev, [observationId]: res.data }));
    } catch (err) {
      console.warn(`Could not load AI analysis for observation ${observationId}:`, err);
      setAiAnalyses((prev) => ({ ...prev, [observationId]: null }));
    } finally {
      setLoadingAI((prev) => ({ ...prev, [observationId]: false }));
    }
  };

  const handleSelectCase = async (caseItem) => {
    setLoadingDetail(true);
    setError(null);
    setSuccessMsg('');
    setCaseDetail(null);
    setWeatherData(null);
    setSoilData(null);
    setAiAnalyses({});
    try {
      const res = await getExpertCaseDetail(caseItem.id);
      setCaseDetail(res.data);
      setSelectedCase(caseItem);
      // Reset form
      setValidationResult('confirmed');
      setCorrectedDisease('');
      setCorrectedPest('');
      setComments('');
      setTreatmentRecommendation('');
      // Load environmental context and AI analyses
      if (res.data.farm_id) {
        await fetchEnvironmentalContext(res.data.farm_id);
      }
      // Load AI analyses for all observations
      const obsIds = res.data.observations?.map((o) => o.id) || [];
      await Promise.all(obsIds.map((oid) => fetchAIAnalysis(oid)));
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load case details.';
      setError(errorMsg);
      console.error('Error loading case detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleValidationSubmit = async (e) => {
    e.preventDefault();
    if (!caseDetail) return;

    // Validation
    if (!comments.trim()) {
      setError('Please provide expert comments explaining your assessment.');
      return;
    }

    if (!treatmentRecommendation.trim()) {
      setError('Please provide treatment recommendations for the farmer.');
      return;
    }

    if (validationResult === 'corrected' && !correctedDisease.trim()) {
      setError('Please specify the corrected disease name.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    const payload = {
      validation_result: validationResult,
      corrected_disease: validationResult === 'corrected' ? correctedDisease.trim() : null,
      corrected_pest: validationResult === 'corrected' ? correctedPest.trim() : null,
      comments: comments.trim(),
      treatment_recommendation: treatmentRecommendation.trim(),
    };

    try {
      await validateCase(caseDetail.id, payload);
      setSuccessMsg('✓ Expert validation submitted successfully! Case marked as validated.');
      // Reload queue and clear selection
      await fetchQueue();
      setTimeout(() => {
        setSelectedCase(null);
        setCaseDetail(null);
      }, 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit validation.';
      setError(errorMsg);
      console.error('Error submitting validation:', err);
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

  const getStatusBadgeColor = (status) => {
    const statusMap = {
      'pending_expert': 'bg-amber-100 text-amber-900 border-amber-200',
      'open': 'bg-blue-100 text-blue-900 border-blue-200',
      'validated': 'bg-emerald-100 text-emerald-900 border-emerald-200',
      'resolved': 'bg-green-100 text-green-900 border-green-200',
      'closed': 'bg-stone-100 text-stone-900 border-stone-200',
    };
    return statusMap[status] || 'bg-stone-100 text-stone-900 border-stone-200';
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
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-emerald-600/50"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">My Profile</span>
              </button>
            )}
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

        {/* ─── Profile Completeness Banner ─── */}
        {isProfileIncomplete && onEditProfile && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 shadow-lg border border-amber-400/50">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <BadgeAlert className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-sm tracking-tight">
                    ⚠️ Important: Complete your profile to get verified
                  </p>
                  <p className="text-amber-100 text-xs mt-0.5 max-w-lg">
                    Your expert profile is incomplete. Add your <strong>specialization</strong>, <strong>qualification</strong>, and <strong>organization</strong> to help farmers and admins verify your credentials and trust your validations.
                  </p>
                  {/* Show what's missing */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {!currentUser?.expert_profile?.specialization && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white/20 text-white rounded-full border border-white/30">
                        ✗ Specialization missing
                      </span>
                    )}
                    {!currentUser?.expert_profile?.qualification && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white/20 text-white rounded-full border border-white/30">
                        ✗ Qualification missing
                      </span>
                    )}
                    {!currentUser?.expert_profile?.organization && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white/20 text-white rounded-full border border-white/30">
                        ✗ Organization missing
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 sm:ml-auto">
                <button
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-700 font-extrabold text-xs rounded-xl shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer border border-white/50"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile Now
                </button>
              </div>
            </div>
          </div>
        )}

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

        {selectedCase && caseDetail ? (
          /* Case Inspection & Validation View */
          <div className="space-y-6 animate-fadeIn">
            {/* Top Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setCaseDetail(null);
                }}
                className="inline-flex items-center space-x-2 text-xs font-bold text-stone-600 hover:text-emerald-950 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Review Queue</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadgeColor(caseDetail.status)}`}>
                  Case #{caseDetail.id} · Status: {caseDetail.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Case Overview & Environmental Context */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <h1 className="text-xl font-black text-stone-900 tracking-tight">
                  {caseDetail.title}
                </h1>
                <span className="text-xs text-stone-500">
                  Submitted: {formatDate(caseDetail.updated_at)}
                </span>
              </div>

              {caseDetail.description && (
                <div>
                  <p className="text-xs font-semibold text-stone-700 mb-2">Farmer's Report:</p>
                  <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    {caseDetail.description}
                  </p>
                </div>
              )}

              {/* Case identity cards with names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 font-medium block">👤 Farmer</span>
                  <p className="font-extrabold text-emerald-900 mt-0.5">
                    {caseDetail.farmer_name || `Farmer #${caseDetail.farmer_id}`}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">User #${caseDetail.farmer_id}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-blue-700 font-medium block">🏞 Farm</span>
                  <p className="font-extrabold text-blue-900 mt-0.5">
                    {caseDetail.farm?.farm_name || `Farm #${caseDetail.farm_id}`}
                  </p>
                  {caseDetail.farm?.village && (
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      {caseDetail.farm.village}, {caseDetail.farm.district || ''}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-amber-700 font-medium block">🌾 Crop</span>
                  <p className="font-extrabold text-amber-900 mt-0.5">
                    {(() => {
                      const c = caseDetail.crop;
                      if (!c) return `Crop #${caseDetail.crop_id}`;
                      const type = c.crop_type?.toLowerCase().replace('_', ' ') || 'Unknown';
                      const variety = c.variety ? ` (${c.variety})` : '';
                      return `${type}${variety}`;
                    })()}
                  </p>
                  {caseDetail.crop?.growth_stage && (
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      Stage: {caseDetail.crop.growth_stage}
                    </p>
                  )}
                </div>
              </div>

              {/* Environmental Context: Weather + Soil */}
              {(weatherData || soilData) && (
                <div className="border-t border-stone-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    🌍 Environmental Context
                  </p>

                  {/* Weather */}
                  {weatherData && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-sky-50 rounded-xl border border-sky-100">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5 text-sky-600" />
                        <div>
                          <p className="text-[10px] text-sky-600">Temperature</p>
                          <p className="text-xs font-bold text-sky-900">
                            {weatherData.temperature?.toFixed(1)}°C
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-sky-600" />
                        <div>
                          <p className="text-[10px] text-sky-600">Humidity</p>
                          <p className="text-xs font-bold text-sky-900">
                            {weatherData.humidity?.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind className="h-3.5 w-3.5 text-sky-600" />
                        <div>
                          <p className="text-[10px] text-sky-600">Wind</p>
                          <p className="text-xs font-bold text-sky-900">
                            {weatherData.wind_speed?.toFixed(0)} km/h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-sky-600" />
                        <div>
                          <p className="text-[10px] text-sky-600">Condition</p>
                          <p className="text-xs font-bold text-sky-900">
                            {weatherData.condition || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {weatherData.precipitation != null && (
                        <div className="flex items-center gap-1.5">
                          <Droplets className="h-3.5 w-3.5 text-sky-600" />
                          <div>
                            <p className="text-[10px] text-sky-600">Rainfall</p>
                            <p className="text-xs font-bold text-sky-900">
                              {weatherData.precipitation?.toFixed(1)} mm
                            </p>
                          </div>
                        </div>
                      )}
                      {weatherData.has_sensor && (
                        <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-1 rounded-lg self-center">
                          <span className="inline-block w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                          IoT Sensor Active
                        </div>
                      )}
                    </div>
                  )}

                  {/* Soil */}
                  {soilData ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Soil Type</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.soil_type || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">pH</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.ph ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Moisture</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.moisture != null ? `${soilData.moisture.toFixed(0)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wheat className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Texture</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.texture || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Nitrogen</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.nitrogen != null ? `${soilData.nitrogen} kg/ha` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Phosphorus</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.phosphorus != null ? `${soilData.phosphorus} kg/ha` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Potassium</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.potassium != null ? `${soilData.potassium} kg/ha` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sprout className="h-3.5 w-3.5 text-amber-600" />
                        <div>
                          <p className="text-[10px] text-amber-600">Organic Carbon</p>
                          <p className="text-xs font-bold text-amber-900">
                            {soilData.organic_carbon != null ? `${soilData.organic_carbon.toFixed(2)}%` : soilData.oc != null ? `${soilData.oc}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs">
                      <div className="flex items-center gap-2 text-stone-600">
                        <TestTube className="h-4 w-4 text-stone-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-stone-700">No Soil Health Card submitted for this plot</span>
                          <p className="text-[11px] text-stone-500">The farmer has not yet entered soil test records for this farm plot.</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-stone-200 text-stone-600 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                        Not Available
                      </span>
                    </div>
                  )}

                </div>
              )}

              {/* Observation count */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs">
                <span className="text-purple-700 font-medium block">📷 Total Observations</span>
                <p className="font-extrabold text-purple-900 mt-0.5">
                  {caseDetail.observations?.length || 0} observation{caseDetail.observations?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Observations & AI Findings */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-emerald-800" />
                <span>Field Observations & Image Evidence</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseDetail.observations?.map((obs, idx) => {
                  const aiAnalysis = aiAnalyses[obs.id];
                  const isLoadingAI = loadingAI[obs.id];
                  return (
                    <div
                      key={obs.id}
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 flex flex-col justify-between hover:bg-white transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
                          <span className="text-xs font-bold text-stone-900">
                            Observation #{obs.id} {idx === 0 && '(Initial)'}
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
                                className="w-24 h-24 object-cover rounded-lg border border-stone-300 shadow-xs hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </a>
                          ) : (
                            <div className="w-24 h-24 bg-stone-200 rounded-lg flex items-center justify-center text-stone-400 shrink-0">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )}

                          <div className="text-xs space-y-2 text-stone-600 flex-1">
                            <p>
                              <span className="font-semibold text-stone-800">Status: </span>
                              <span className="font-bold text-emerald-800 uppercase text-[10px] px-2 py-0.5 bg-emerald-50 rounded-full">
                                {obs.status}
                              </span>
                            </p>
                            {obs.image_quality_score != null && (
                              <p>
                                <span className="font-semibold text-stone-800">Quality: </span>
                                <span className={obs.image_quality_score >= 70 ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                                  {obs.image_quality_score.toFixed(0)}/100
                                </span>
                              </p>
                            )}
                            {obs.latitude != null && obs.longitude != null && (
                              <p className="text-stone-500 text-[10px]">
                                📍 {obs.latitude?.toFixed(4)}°, {obs.longitude?.toFixed(4)}°
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Analysis Section */}
                      {aiAnalysis && (
                        <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <Brain className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                                AI Analysis
                              </span>
                            </div>
                            <span className="text-[10px] text-indigo-600">
                              Model: {aiAnalysis.model_version} · Confidence: {(aiAnalysis.confidence_score ?? 0).toFixed(0)}%
                            </span>
                          </div>
                          {aiAnalysis.risk_level && (
                            <div className="text-[10px] font-bold text-indigo-700">
                              Risk Level: <span className="uppercase">{aiAnalysis.risk_level}</span>
                            </div>
                          )}
                          {(aiAnalysis.predicted_disease || aiAnalysis.predicted_pest) && (
                            <div className="text-xs space-y-1">
                              {aiAnalysis.predicted_disease && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-indigo-600 font-semibold">Disease:</span>
                                  <span className="font-bold text-indigo-900">{aiAnalysis.predicted_disease}</span>
                                  {aiAnalysis.disease_probability != null && (
                                    <span className="text-[10px] text-indigo-500">
                                      ({(aiAnalysis.disease_probability * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                </div>
                              )}
                              {aiAnalysis.predicted_pest && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-indigo-600 font-semibold">Pest:</span>
                                  <span className="font-bold text-indigo-900">{aiAnalysis.predicted_pest}</span>
                                  {aiAnalysis.pest_probability != null && (
                                    <span className="text-[10px] text-indigo-500">
                                      ({(aiAnalysis.pest_probability * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {isLoadingAI && (
                        <div className="mt-2 p-3 bg-stone-100 rounded-xl border border-stone-200">
                          <div className="flex items-center space-x-2 text-xs text-stone-500">
                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" />
                            <span>Loading AI analysis...</span>
                          </div>
                        </div>
                      )}
                      {!aiAnalysis && !isLoadingAI && (
                        <div className="mt-2 p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-500">
                          <div className="flex items-center space-x-1.5">
                            <Brain className="h-3.5 w-3.5" />
                            <span>AI analysis not available for this observation.</span>
                          </div>
                        </div>
                      )}

                      {obs.image_url && (
                        <a
                          href={obs.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold hover:text-emerald-900"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Full Image</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Previous Validations */}
            {caseDetail.validations && caseDetail.validations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-800" />
                  <span>Previous Expert Validations</span>
                </h2>
                <div className="space-y-3">
                  {caseDetail.validations.map((val) => {
                    const resultColor = {
                      confirmed: 'emerald',
                      corrected: 'amber',
                      needs_investigation: 'blue',
                    }[val.validation_result] || 'stone';
                    return (
                      <div key={val.id} className="p-4 border-l-4 border-${resultColor}-600 bg-${resultColor}-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-${resultColor}-900">
                            {val.expert_name ? `Validation by ${val.expert_name}` : `Validation by Expert #${val.expert_id}`}
                            {val.expert_organization && ` · ${val.expert_organization}`}
                          </p>
                          <span className="text-[10px] text-stone-500">
                            {formatDate(val.created_at)}
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-${resultColor}-800 font-semibold">
                            <span className="font-bold uppercase">Result:</span> {val.validation_result.replace('_', ' ')}
                          </p>
                          {val.corrected_disease && (
                            <p className="text-${resultColor}-700">
                              <span className="font-semibold">Corrected Disease:</span> {val.corrected_disease}
                            </p>
                          )}
                          {val.corrected_pest && (
                            <p className="text-${resultColor}-700">
                              <span className="font-semibold">Corrected Pest:</span> {val.corrected_pest}
                            </p>
                          )}
                          {val.comments && (
                            <p className="text-${resultColor}-700 mt-1">
                              <span className="font-semibold">Observations:</span> {val.comments}
                            </p>
                          )}
                          {val.treatment_recommendation && (
                            <p className="text-${resultColor}-700">
                              <span className="font-semibold">Treatment:</span> {val.treatment_recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expert Validation Form */}
            <form
              onSubmit={handleValidationSubmit}
              className="bg-white rounded-2xl p-6 border-2 border-emerald-700/60 shadow-lg space-y-5"
            >
              <div className="flex items-center space-x-2.5 pb-3 border-b border-stone-200">
                <FileCheck className="h-6 w-6 text-emerald-800" />
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Submit Your Expert Agronomic Validation
                  </h2>
                  <p className="text-xs text-stone-500">
                    Provide your professional assessment to guide the farmer's next actions.
                  </p>
                </div>
              </div>

              {/* Radio Group: Verdict */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  ⭐ Your Diagnostic Verdict
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      value: 'confirmed',
                      label: '✓ Confirm AI Prediction',
                      color: 'emerald',
                      desc: 'AI diagnosis is accurate',
                    },
                    {
                      value: 'corrected',
                      label: '✎ Correct Diagnosis',
                      color: 'amber',
                      desc: 'Different disease/pest',
                    },
                    {
                      value: 'needs_investigation',
                      label: '❓ Needs Investigation',
                      color: 'blue',
                      desc: 'Requires more data',
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start space-x-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        validationResult === option.value
                          ? `border-${option.color}-700 bg-${option.color}-50 text-${option.color}-950 font-bold`
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="verdict"
                        value={option.value}
                        checked={validationResult === option.value}
                        onChange={() => setValidationResult(option.value)}
                        className={`text-${option.color}-700 focus:ring-${option.color}-700`}
                      />
                      <div>
                        <p className="text-xs font-bold">{option.label}</p>
                        <p className="text-[11px] opacity-75">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional Corrected Fields */}
              {validationResult === 'corrected' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200 animate-fadeIn space-y-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-amber-900 mb-2">
                      ⚠️ What is the Correct Disease/Condition?
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Disease Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sheath Blight, Brown Spot, Bacterial Leaf Streak"
                      value={correctedDisease}
                      onChange={(e) => setCorrectedDisease(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                      required={validationResult === 'corrected'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Pest / Vector (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Brown Planthopper, Stem Borer, Leaf Folder"
                      value={correctedPest}
                      onChange={(e) => setCorrectedPest(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>
              )}

              {/* Comments Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  📝 Expert Pathological Observations & Reasoning
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain your reasoning, key visual markers identified, diagnostic confidence, why you agree/disagree with AI prediction..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-sans"
                  required
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {comments.length} characters • Required field
                </p>
              </div>

              {/* IPM / Treatment Recommendation Textarea */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  🌾 Integrated Pest Management (IPM) & Agricultural Advice
                </label>
                <textarea
                  rows={4}
                  placeholder="Precise curative/preventative treatments, chemical dosage with quantity, biopesticide alternatives, crop management practices, harvesting timeline, storage recommendations..."
                  value={treatmentRecommendation}
                  onChange={(e) => setTreatmentRecommendation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-sans"
                  required
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {treatmentRecommendation.length} characters • Required field
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || !comments.trim() || !treatmentRecommendation.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-colors border border-emerald-700"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Submitting Verdict...' : '✓ Submit Validation'}</span>
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
                  📋 Expert Review Queue
                </h1>
                <p className="text-xs text-stone-500">
                  All farmer-submitted cases awaiting expert validation · Provided by all farmers across the platform
                </p>
              </div>
              <span className="px-4 py-2 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-200">
                {queue.length} Pending Case{queue.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingQueue ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-800 border-r-transparent mb-3" />
                <p className="text-sm font-medium text-stone-600">Loading triage queue...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-stone-800">🎉 Queue is Clear!</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  There are currently no cases awaiting expert review. All submitted farmer cases have been validated.
                </p>
                <p className="text-xs text-emerald-700 font-semibold">
                  Check back soon for new farmer submissions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCase(item)}
                    className="bg-white hover:bg-emerald-50/50 p-5 rounded-2xl border border-stone-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-400">Case #{item.id}</span>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          <span>Pending Expert</span>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 line-clamp-2 group-hover:text-emerald-900">
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
                          <span>{item.farmer_name || `Farmer #${item.farmer_id}`}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                          <span>{item.farm?.farm_name || `Farm #${item.farm_id}`}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <Wheat className="h-3.5 w-3.5 text-amber-700" />
                          <span>
                            {item.crop ? `${item.crop.crop_type?.toLowerCase().replace('_', ' ') || 'Unknown'}${item.crop.variety ? ` (${item.crop.variety})` : ''}` : `Crop #${item.crop_id}`}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>Submitted: {formatDate(item.updated_at)}</span>
                      <span className="inline-flex items-center space-x-1 text-emerald-800 font-bold group-hover:translate-x-1 transition-transform">
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
