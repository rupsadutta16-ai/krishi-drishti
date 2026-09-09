import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, MapPin, Wheat, Plus, Pencil, Radio, TestTube, RefreshCw,
  ChevronRight, Camera, Calendar, Eye, AlertTriangle, CheckCircle2,
  CloudRain, Thermometer, Droplets, Sprout, BarChart3, FileBarChart,
  Cpu, ShieldAlert, Sparkles, History, Send
} from 'lucide-react';
import { getFarms, toggleFarmSensor } from '../../api/farms';
import { getCrops } from '../../api/crops';
import { getObservations, getAIAnalyses, analyzeWeatherRisk } from '../../api/observations';
import { getSoilRecords, analyzeSoilRisk } from '../../api/soil';
import AddFarmModal from './AddFarmModal';
import AddCropModal from './AddCropModal';
import EditCropModal from './EditCropModal';
import EditFarmModal from './EditFarmModal';
import AddSoilModal from './AddSoilModal';
import ReportDetailPage from './ReportDetailPage';

export default function CropsAndFarmsPage({ onBack, onOpenCropModal }) {
  // Data
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Drill-down state
  const [viewLevel, setViewLevel] = useState('farms'); // 'farms' | 'farmDetail' | 'cropDetail'
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropDetailTab, setCropDetailTab] = useState('observations'); // 'observations' | 'reports'
  const [cropReports, setCropReports] = useState([]);
  const [cropObservations, setCropObservations] = useState([]);
  const [loadingCropDetail, setLoadingCropDetail] = useState(false);

  // Weather risk data
  const [cropWeatherRisks, setCropWeatherRisks] = useState({});
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Report detail
  const [selectedReport, setSelectedReport] = useState(null);

  // Modals
  const [addFarmModalOpen, setAddFarmModalOpen] = useState(false);
  const [addCropModalOpen, setAddCropModalOpen] = useState(false);
  const [editCropModalOpen, setEditCropModalOpen] = useState(false);
  const [editCropTarget, setEditCropTarget] = useState(null);
  const [editFarmModalOpen, setEditFarmModalOpen] = useState(false);
  const [editFarmTarget, setEditFarmTarget] = useState(null);
  const [addSoilModalOpen, setAddSoilModalOpen] = useState(false);
  const [selectedFarmIdForSoil, setSelectedFarmIdForSoil] = useState('');

  // ─── Data Fetching ───
  const fetchData = async () => {
    setLoading(true);
    try {
      const [farmsRes, cropsRes, obsRes] = await Promise.allSettled([
        getFarms(),
        getCrops(),
        getObservations(),
      ]);
      setFarms(farmsRes.status === 'fulfilled' ? farmsRes.value || [] : []);
      setCrops(cropsRes.status === 'fulfilled' ? cropsRes.value || [] : []);
      setObservations(obsRes.status === 'fulfilled' ? obsRes.value || [] : []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch weather risks for a set of crops
  const fetchWeatherRisksForCrops = async (cropList, farmList) => {
    setLoadingWeather(true);
    const risksMap = {};
    try {
      await Promise.all(
        cropList.map(async (crop) => {
          const farm = farmList.find((f) => f.id === crop.farm_id);
          try {
            const riskData = await analyzeWeatherRisk({
              farm_id: farm?.id,
              latitude: farm?.latitude || 19.7515,
              longitude: farm?.longitude || 75.7139,
              crop_type: crop.crop_type,
            });
            risksMap[crop.id] = riskData;
          } catch (err) { /* skip */ }
        })
      );
      setCropWeatherRisks((prev) => ({ ...prev, ...risksMap }));
    } finally {
      setLoadingWeather(false);
    }
  };

  // Fetch crop-level detail data (observations + reports for a specific crop)
  const fetchCropDetail = async (crop) => {
    setLoadingCropDetail(true);
    setCropReports([]);
    setCropObservations([]);
    try {
      // Filter observations for this crop
      const cropObs = observations.filter((o) => o.crop_id === crop.id);
      setCropObservations(cropObs);

      // Fetch AI analyses for each observation
      const reportsAcc = [];
      await Promise.all(
        cropObs.map(async (obs) => {
          try {
            const analyses = await getAIAnalyses(obs.id);
            if (Array.isArray(analyses) && analyses.length > 0) {
              analyses.forEach((a) => reportsAcc.push({ ...a, observation: obs }));
            }
          } catch (err) { /* skip */ }
        })
      );
      reportsAcc.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setCropReports(reportsAcc);
    } catch (err) {
      console.error('Error fetching crop detail:', err);
    } finally {
      setLoadingCropDetail(false);
    }
  };

  // ─── Navigation Handlers ───
  const handleSelectFarm = (farm) => {
    setSelectedFarm(farm);
    setSelectedCrop(null);
    setViewLevel('farmDetail');
    const farmCrops = crops.filter((c) => c.farm_id === farm.id);
    if (farmCrops.length > 0) {
      fetchWeatherRisksForCrops(farmCrops, [farm]);
    }
  };

  const handleSelectCrop = (crop) => {
    setSelectedCrop(crop);
    setCropDetailTab('observations');
    setViewLevel('cropDetail');
    fetchCropDetail(crop);
  };

  const handleBack = () => {
    if (selectedReport) {
      setSelectedReport(null);
      return;
    }
    if (viewLevel === 'cropDetail') {
      setSelectedCrop(null);
      setViewLevel('farmDetail');
    } else if (viewLevel === 'farmDetail') {
      setSelectedFarm(null);
      setViewLevel('farms');
    } else {
      onBack && onBack();
    }
  };

  // ─── Sensor Toggle ───
  const handleToggleSensor = async (farm, e) => {
    e && e.stopPropagation();
    try {
      const res = await toggleFarmSensor(farm.id);
      const updatedHasSensor = res?.has_sensor !== undefined ? res.has_sensor : !farm.has_sensor;
      const updatedFarms = farms.map((f) => f.id === farm.id ? { ...f, has_sensor: updatedHasSensor } : f);
      setFarms(updatedFarms);
      if (selectedFarm?.id === farm.id) {
        setSelectedFarm({ ...selectedFarm, has_sensor: updatedHasSensor });
      }
      showToast(updatedHasSensor
        ? `Sensor connected for "${farm.farm_name}"!`
        : `Sensor disconnected for "${farm.farm_name}".`
      );
    } catch (err) {
      console.error('Error toggling sensor:', err);
    }
  };

  // ─── Modal Callbacks ───
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleFarmAdded = () => { showToast('Farm created successfully!'); fetchData(); };
  const handleCropAdded = () => { showToast('Crop registered successfully!'); fetchData(); };
  const handleCropUpdated = () => { showToast('Crop updated!'); fetchData(); };
  const handleCropDeleted = () => { showToast('Crop deleted.'); fetchData(); };
  const handleFarmUpdated = () => { showToast('Farm updated!'); fetchData(); };
  const handleFarmDeleted = () => {
    showToast('Farm deleted.');
    setSelectedFarm(null);
    setViewLevel('farms');
    fetchData();
  };
  const handleSoilSaved = () => { showToast('Soil Health Card data saved!'); };

  // ─── Report Detail Subpage ───
  if (selectedReport) {
    return (
      <ReportDetailPage
        report={selectedReport}
        crops={crops}
        farms={farms}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  // ─── Breadcrumb ───
  const Breadcrumb = () => (
    <div className="flex items-center space-x-2 text-xs font-bold text-stone-500 mb-4">
      <button onClick={() => { setViewLevel('farms'); setSelectedFarm(null); setSelectedCrop(null); }} className="hover:text-emerald-800 transition-colors cursor-pointer">
        Farms
      </button>
      {selectedFarm && (
        <>
          <ChevronRight className="h-3 w-3 text-stone-400" />
          <button
            onClick={() => { setViewLevel('farmDetail'); setSelectedCrop(null); }}
            className="hover:text-emerald-800 transition-colors cursor-pointer text-emerald-800"
          >
            {selectedFarm.farm_name}
          </button>
        </>
      )}
      {selectedCrop && (
        <>
          <ChevronRight className="h-3 w-3 text-stone-400" />
          <span className="text-emerald-950 font-extrabold">{selectedCrop.crop_type}</span>
        </>
      )}
    </div>
  );

  // Get crops count per farm
  const getCropCount = (farmId) => crops.filter((c) => c.farm_id === farmId).length;

  return (
    <div className="min-h-screen bg-stone-50 pt-14 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Toast */}
        {toastMsg && (
          <div className="p-4 bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-between border border-emerald-700 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg('')} className="text-stone-300 hover:text-white text-xs cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Back + Breadcrumb */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-sm font-bold text-emerald-800 hover:text-emerald-900 transition-colors cursor-pointer mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{viewLevel === 'farms' ? 'Back to Dashboard' : 'Back'}</span>
          </button>
          {viewLevel !== 'farms' && <Breadcrumb />}
        </div>

        {/* ═══════════════════════════════════════════════════════
            LEVEL 1: FARM LIST
        ═══════════════════════════════════════════════════════ */}
        {viewLevel === 'farms' && (
          <>
            {/* Page Header */}
            <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
                  <MapPin className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">My Farms & Crops</h1>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Manage your farms, crops, and track observation history.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAddFarmModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer border border-emerald-500/40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Farm</span>
                </button>
                <button
                  onClick={fetchData}
                  className="p-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Farm Grid */}
            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
                <span>Loading farms...</span>
              </div>
            ) : farms.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
                <MapPin className="h-10 w-10 text-stone-400 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">No farms registered yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Add your first farm plot to record location, area, and link crop health observations.
                </p>
                <button
                  onClick={() => setAddFarmModalOpen(true)}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Farm</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {farms.map((farm) => {
                  const cropCount = getCropCount(farm.id);
                  return (
                    <div
                      key={farm.id}
                      onClick={() => handleSelectFarm(farm)}
                      className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group relative"
                    >
                      {/* Crop count badge */}
                      <div className="absolute top-4 right-4">
                        <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center space-x-1">
                          <Wheat className="h-3 w-3" />
                          <span>{cropCount} Crop{cropCount !== 1 ? 's' : ''}</span>
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-emerald-950 mb-2 pr-20">{farm.farm_name}</h3>

                      <div className="space-y-1.5 text-xs text-stone-600 mb-3">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Area</span>
                          <span className="font-semibold text-stone-800">{farm.area_acres ? `${farm.area_acres} Acres` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Location</span>
                          <span className="font-semibold text-stone-800">{farm.village ? `${farm.village}, ` : ''}{farm.district || farm.state || 'Maharashtra'}</span>
                        </div>
                        {farm.latitude && farm.longitude && (
                          <div className="flex justify-between">
                            <span className="text-stone-400">Coordinates</span>
                            <span className="font-mono text-[11px] text-emerald-700">
                              {farm.latitude.toFixed(3)}°, {farm.longitude.toFixed(3)}°
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Sensor Status */}
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 mb-3 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${farm.has_sensor ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                          <span className="text-[11px] font-bold text-stone-700">
                            {farm.has_sensor ? 'IoT Sensor Connected' : 'No Sensor'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleToggleSensor(farm, e)}
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border transition-all cursor-pointer flex items-center space-x-1 ${
                            farm.has_sensor
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                          }`}
                        >
                          <Radio className="h-3 w-3" />
                          <span>{farm.has_sensor ? 'Disconnect' : 'Connect'}</span>
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setAddCropModalOpen(true); }}
                          className="flex-1 py-1.5 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Crop</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFarmIdForSoil(farm.id); setAddSoilModalOpen(true); }}
                          className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-lg border border-amber-200 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <TestTube className="h-3.5 w-3.5 text-amber-700" />
                          <span>Soil</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditFarmTarget(farm); setEditFarmModalOpen(true); }}
                          className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* Drill-in hint */}
                      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors space-x-1">
                        <span>View Crops & Details</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            LEVEL 2: FARM DETAIL -> CROP LIST
        ═══════════════════════════════════════════════════════ */}
        {viewLevel === 'farmDetail' && selectedFarm && (
          <>
            {/* Farm Info Banner */}
            <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
                    <MapPin className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight">{selectedFarm.farm_name}</h1>
                    <p className="text-xs text-stone-300 mt-0.5">
                      {selectedFarm.area_acres ? `${selectedFarm.area_acres} Acres` : ''}{selectedFarm.village ? ` \u00b7 ${selectedFarm.village}` : ''}{selectedFarm.district ? `, ${selectedFarm.district}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Sensor status */}
                  <div className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center space-x-1.5 ${
                    selectedFarm.has_sensor
                      ? 'bg-cyan-900/30 text-cyan-200 border-cyan-700'
                      : 'bg-stone-800/50 text-stone-400 border-stone-700'
                  }`}>
                    <Radio className={`h-3.5 w-3.5 ${selectedFarm.has_sensor ? 'animate-pulse' : ''}`} />
                    <span>{selectedFarm.has_sensor ? 'Sensor Active' : 'No Sensor'}</span>
                  </div>
                  <button
                    onClick={() => setAddCropModalOpen(true)}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer border border-emerald-500/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Crop</span>
                  </button>
                  <button
                    onClick={() => { setEditFarmTarget(selectedFarm); setEditFarmModalOpen(true); }}
                    className="p-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Crops Grid for this Farm */}
            {(() => {
              const farmCrops = crops.filter((c) => c.farm_id === selectedFarm.id);
              if (farmCrops.length === 0) {
                return (
                  <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
                    <Wheat className="h-10 w-10 text-stone-400 mx-auto" />
                    <h3 className="text-sm font-bold text-stone-800">No crops in this farm yet</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Register a crop cycle (e.g., Rice, Wheat, Tomato) to start tracking.
                    </p>
                    <button
                      onClick={() => setAddCropModalOpen(true)}
                      className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register a Crop</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {farmCrops.map((crop) => {
                    const weatherRisk = cropWeatherRisks[crop.id];
                    const obsCount = observations.filter((o) => o.crop_id === crop.id).length;

                    return (
                      <div
                        key={crop.id}
                        onClick={() => handleSelectCrop(crop)}
                        className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-extrabold text-emerald-950">{crop.crop_type}</h3>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-800 border-emerald-200">
                            {crop.growth_stage || 'Sowing'} Stage
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {crop.variety && (
                            <div className="flex justify-between">
                              <span className="text-stone-500">Variety</span>
                              <span className="font-medium text-stone-700">{crop.variety}</span>
                            </div>
                          )}
                          {crop.sowing_date && (
                            <div className="flex justify-between">
                              <span className="text-stone-500">Sowing Date</span>
                              <span className="font-medium text-stone-700">{crop.sowing_date}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-stone-500">Observations</span>
                            <span className="font-bold text-emerald-800">{obsCount}</span>
                          </div>
                          {weatherRisk && (
                            <div className="flex justify-between pt-1 border-t border-stone-100">
                              <span className="text-stone-500">Weather Risk</span>
                              <span className={`font-bold text-[11px] ${
                                weatherRisk.risk_level === 'HIGH' || weatherRisk.risk_level === 'CRITICAL' ? 'text-red-700' : weatherRisk.risk_level === 'MEDIUM' ? 'text-amber-700' : 'text-emerald-700'
                              }`}>
                                {weatherRisk.risk_level || 'LOW'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action row */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenCropModal && onOpenCropModal(); }}
                            className="flex-1 py-2 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 hover:border-emerald-300 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Check Health</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditCropTarget(crop); setEditCropModalOpen(true); }}
                            className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>

                        {/* Drill-in hint */}
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors space-x-1">
                          <span>View Observations & Reports</span>
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            LEVEL 3: CROP DETAIL - OBSERVATIONS + REPORTS TABS
        ═══════════════════════════════════════════════════════ */}
        {viewLevel === 'cropDetail' && selectedCrop && (
          <>
            {/* Crop Info Header */}
            <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
                    <Wheat className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight">{selectedCrop.crop_type}</h1>
                    <p className="text-xs text-stone-300 mt-0.5">
                      {selectedCrop.variety ? `${selectedCrop.variety} \u00b7 ` : ''}{selectedCrop.growth_stage || 'Sowing'} Stage{selectedCrop.sowing_date ? ` \u00b7 Sown: ${selectedCrop.sowing_date}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenCropModal && onOpenCropModal()}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer border border-emerald-500/40"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>New Observation</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white rounded-xl border border-stone-200 p-1 shadow-xs">
              <button
                onClick={() => setCropDetailTab('observations')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  cropDetailTab === 'observations'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Observation History ({cropObservations.length})</span>
              </button>
              <button
                onClick={() => setCropDetailTab('reports')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  cropDetailTab === 'reports'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <FileBarChart className="h-3.5 w-3.5" />
                <span>AI Reports ({cropReports.length})</span>
              </button>
            </div>

            {/* Tab Content */}
            {loadingCropDetail ? (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
                <span>Loading crop data...</span>
              </div>
            ) : (
              <>
                {/* ─── Observations Tab ─── */}
                {cropDetailTab === 'observations' && (
                  <>
                    {cropObservations.length === 0 ? (
                      <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
                        <Camera className="h-10 w-10 text-stone-400 mx-auto" />
                        <h3 className="text-sm font-bold text-stone-800">No observations yet for {selectedCrop.crop_type}</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          Capture a photo of your crop to start health monitoring.
                        </p>
                        <button
                          onClick={() => onOpenCropModal && onOpenCropModal()}
                          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                          <span>New Observation</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cropObservations.map((obs) => {
                          const farm = farms.find((f) => f.id === obs.farm_id);
                          const isRejected = obs.status === 'IMAGE_REJECTED' || (obs.image_quality_score !== null && obs.image_quality_score < 50.0);
                          const dateStr = obs.created_at ? new Date(obs.created_at).toLocaleString() : 'Recent';

                          return (
                            <div key={obs.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                              <div className="flex items-start space-x-4">
                                {obs.image_url ? (
                                  <img
                                    src={obs.image_url}
                                    alt="Crop observation"
                                    className="w-24 h-24 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-24 h-24 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
                                    <Camera className="h-8 w-8" />
                                  </div>
                                )}

                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                      Observation #{obs.id}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase border ${
                                      isRejected
                                        ? 'bg-red-100 text-red-900 border-red-300'
                                        : obs.status === 'AI_ANALYZED'
                                        ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    }`}>
                                      {obs.status || 'READY_FOR_AI'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 flex items-center space-x-1">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                                    <span className="truncate">{farm?.farm_name || `Farm #${obs.farm_id}`}</span>
                                  </p>
                                  <p className="text-[11px] text-stone-400 flex items-center space-x-1">
                                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{dateStr}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-stone-500 font-medium">Quality:</span>
                                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                    isRejected ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
                                  }`}>
                                    {obs.image_quality_score !== null && obs.image_quality_score !== undefined
                                      ? obs.image_quality_score.toFixed(1) : '85.0'} / 100
                                  </span>
                                </div>
                                {obs.latitude && obs.longitude && (
                                  <span className="font-mono text-[10px] text-stone-400">
                                    {obs.latitude.toFixed(2)}°, {obs.longitude.toFixed(2)}°
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ─── Reports Tab ─── */}
                {cropDetailTab === 'reports' && (
                  <>
                    {cropReports.length === 0 ? (
                      <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
                        <Cpu className="h-10 w-10 text-stone-400 mx-auto" />
                        <h3 className="text-sm font-bold text-stone-800">No AI reports for {selectedCrop.crop_type}</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          Run AI analysis on observations to generate pathology reports.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cropReports.map((report) => {
                          const obs = report.observation || {};
                          const dateStr = report.created_at ? new Date(report.created_at).toLocaleString() : 'Recent';

                          return (
                            <div
                              key={report.id}
                              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-4 cursor-pointer"
                              onClick={() => setSelectedReport(report)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                    <span>Report #{report.id}</span>
                                    <span>&bull;</span>
                                    <span>Obs #{obs.id || report.observation_id}</span>
                                  </div>
                                  <h3 className="text-lg font-extrabold text-emerald-950 mt-1">
                                    {report.predicted_disease || 'Healthy Crop (No Disease Detected)'}
                                  </h3>
                                  {report.predicted_pest && (
                                    <p className="text-xs text-amber-700 font-bold mt-0.5">Pest Signal: {report.predicted_pest}</p>
                                  )}
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                  <span className={`px-3 py-1 text-xs font-bold rounded-md border uppercase ${
                                    report.risk_level === 'HIGH' || report.risk_level === 'CRITICAL'
                                      ? 'bg-red-100 text-red-900 border-red-300'
                                      : report.risk_level === 'MEDIUM'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  }`}>
                                    {report.risk_level || 'LOW'} Risk
                                  </span>
                                  <p className="text-[10px] font-bold text-cyan-700">
                                    AI Confidence: {(report.confidence_score ? report.confidence_score * 100 : 95).toFixed(1)}%
                                  </p>
                                  <ChevronRight className="h-4 w-4 text-stone-400" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                                <div>
                                  <span className="text-stone-500 font-medium">Disease Prob.</span>
                                  <p className="font-bold text-stone-900 mt-0.5">
                                    {report.disease_probability ? (report.disease_probability * 100).toFixed(1) + '%' : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-medium">Pest Prob.</span>
                                  <p className="font-bold text-stone-900 mt-0.5">
                                    {report.pest_probability ? (report.pest_probability * 100).toFixed(1) + '%' : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-medium">Model</span>
                                  <p className="font-mono text-emerald-800 font-bold mt-0.5">{report.model_version || 'v1.0.0'}</p>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-medium">Date</span>
                                  <p className="font-bold text-stone-800 mt-0.5">{dateStr}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-800 flex-1 space-y-1">
                                  <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                                    <span>Advisory:</span>
                                  </h4>
                                  <p className="text-xs text-emerald-900 font-medium">
                                    {report.treatment_recommendation || report.notes || 'Monitor crop health closely.'}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2 cursor-pointer flex-shrink-0 border border-emerald-700"
                                >
                                  <ChevronRight className="h-4 w-4 text-emerald-200" />
                                  <span>Full Report</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* ─── Modals ─── */}
      <AddFarmModal
        isOpen={addFarmModalOpen}
        onClose={() => setAddFarmModalOpen(false)}
        onSuccess={handleFarmAdded}
      />
      <AddCropModal
        isOpen={addCropModalOpen}
        onClose={() => setAddCropModalOpen(false)}
        farms={farms}
        onSuccess={handleCropAdded}
        onOpenAddFarm={() => setAddFarmModalOpen(true)}
      />
      <EditCropModal
        isOpen={editCropModalOpen}
        onClose={() => { setEditCropModalOpen(false); setEditCropTarget(null); }}
        crop={editCropTarget}
        farms={farms}
        onUpdated={handleCropUpdated}
        onDeleted={handleCropDeleted}
      />
      <EditFarmModal
        isOpen={editFarmModalOpen}
        onClose={() => { setEditFarmModalOpen(false); setEditFarmTarget(null); }}
        farm={editFarmTarget}
        onUpdated={handleFarmUpdated}
        onDeleted={handleFarmDeleted}
      />
      <AddSoilModal
        isOpen={addSoilModalOpen}
        onClose={() => setAddSoilModalOpen(false)}
        farms={farms}
        selectedFarmId={selectedFarmIdForSoil}
        onSoilSaved={handleSoilSaved}
      />
    </div>
  );
}
