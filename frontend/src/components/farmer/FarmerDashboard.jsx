import React, { useState, useEffect } from 'react';
import {
  Camera, Bug, History, MessageCircle,
  TrendingUp, CheckCircle2, AlertTriangle, Plus,
  CloudRain, Sprout, BarChart3, Eye, MapPin, Wheat, RefreshCw, AlertCircle, Pencil, Thermometer, Droplets, TestTube, Sparkles, ShieldAlert, Cpu, Radio, Wifi
} from 'lucide-react';
import { getFarms, toggleFarmSensor } from '../../api/farms';
import { getCrops } from '../../api/crops';
import { analyzeWeatherRisk } from '../../api/observations';
import { getSoilRecords, analyzeSoilRisk } from '../../api/soil';
import AddFarmModal from './AddFarmModal';
import AddCropModal from './AddCropModal';
import EditCropModal from './EditCropModal';
import EditFarmModal from './EditFarmModal';
import AddSoilModal from './AddSoilModal';

export default function FarmerDashboard({ currentUser, onOpenCropModal, onEditProfile }) {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [soilRecords, setSoilRecords] = useState({});
  const [cropWeatherRisks, setCropWeatherRisks] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [addFarmModalOpen, setAddFarmModalOpen] = useState(false);
  const [addCropModalOpen, setAddCropModalOpen] = useState(false);
  const [addSoilModalOpen, setAddSoilModalOpen] = useState(false);
  const [selectedFarmIdForSoil, setSelectedFarmIdForSoil] = useState('');
  const [editCropModalOpen, setEditCropModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [editFarmModalOpen, setEditFarmModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [farmsRes, cropsRes] = await Promise.allSettled([
        getFarms(),
        getCrops(),
      ]);

      const fetchedFarms = farmsRes.status === 'fulfilled' ? farmsRes.value || [] : [];
      const fetchedCrops = cropsRes.status === 'fulfilled' ? cropsRes.value || [] : [];

      setFarms(fetchedFarms);
      setCrops(fetchedCrops);

      if (farmsRes.status === 'rejected') {
        setErrorMsg('Could not load farms from the backend. Try adding a farm again after the API is running.');
      }

      // Load soil records from persistence
      const loadedSoil = getSoilRecords();
      setSoilRecords(loadedSoil);

      // Automatically fetch weather risk analysis for every crop owned by the farmer
      if (fetchedCrops.length > 0) {
        fetchWeatherRisksForCrops(fetchedCrops, fetchedFarms);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setErrorMsg('Could not load farm & crop data from backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherRisksForCrops = async (cropList, farmList) => {
    setLoadingWeather(true);
    const risksMap = {};

    try {
      await Promise.all(
        cropList.map(async (crop) => {
          const farm = farmList.find((f) => f.id === crop.farm_id);
          const lat = farm?.latitude || 19.7515;
          const lng = farm?.longitude || 75.7139;

          try {
            const riskData = await analyzeWeatherRisk({
              farm_id: farm?.id,
              latitude: lat,
              longitude: lng,
              crop_type: crop.crop_type,
            });
            risksMap[crop.id] = riskData;
          } catch (err) {
            console.error(`Failed to fetch weather risk for crop #${crop.id}:`, err);
          }
        })
      );
      setCropWeatherRisks(risksMap);
    } catch (err) {
      console.error('Weather risk bulk fetch error:', err);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSoilSaved = () => {
    const loadedSoil = getSoilRecords();
    setSoilRecords(loadedSoil);
    setToastMsg('Soil Health Card data recorded successfully!');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleToggleSensor = async (farm) => {
    try {
      const res = await toggleFarmSensor(farm.id);
      const updatedHasSensor = res && res.has_sensor !== undefined ? res.has_sensor : !farm.has_sensor;

      const updatedFarms = farms.map((f) =>
        f.id === farm.id ? { ...f, has_sensor: updatedHasSensor } : f
      );
      setFarms(updatedFarms);

      setToastMsg(
        updatedHasSensor
          ? `📡 Sensor connected for "${farm.farm_name}"! Simulated Temp & Humidity enabled.`
          : `Sensor disconnected for "${farm.farm_name}". Switched to Weather API.`
      );
      setTimeout(() => setToastMsg(''), 4000);

      fetchWeatherRisksForCrops(crops, updatedFarms);
    } catch (err) {
      console.error('Error toggling sensor:', err);
    }
  };

  const handleFarmAdded = (newFarm) => {
    setToastMsg(`Farm "${newFarm.farm_name}" created successfully!`);
    fetchData();
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleCropAdded = (newCrop) => {
    setToastMsg(`Crop "${newCrop.crop_type}" registered successfully!`);
    fetchData();
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleCropUpdated = () => {
    setToastMsg('Crop updated successfully!');
    fetchData();
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleCropDeleted = () => {
    setToastMsg('Crop deleted.');
    fetchData();
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleFarmUpdated = () => {
    setToastMsg('Farm updated successfully!');
    fetchData();
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleFarmDeleted = () => {
    setToastMsg('Farm deleted.');
    fetchData();
    setTimeout(() => setToastMsg(''), 4000);
  };

  const quickActions = [
    {
      title: 'Check Crop Health',
      description: 'Upload or capture an image and start a new assessment.',
      icon: Camera,
      iconBg: 'bg-emerald-100 text-emerald-800',
      primary: true,
      onClick: onOpenCropModal,
    },
    {
      title: 'Add Soil Info',
      description: 'Input Soil Health Card values (pH, NPK, OC) for rule-based soil risk analysis.',
      icon: TestTube,
      iconBg: 'bg-emerald-100 text-emerald-800',
      primary: false,
      onClick: () => {
        setSelectedFarmIdForSoil(farms[0]?.id || '');
        setAddSoilModalOpen(true);
      },
    },
    {
      title: 'Add New Farm',
      description: 'Register a new farm plot with area and GPS coordinates.',
      icon: MapPin,
      iconBg: 'bg-emerald-100 text-emerald-800',
      primary: false,
      onClick: () => setAddFarmModalOpen(true),
    },
    {
      title: 'Add New Crop',
      description: 'Add a crop cycle to an existing registered farm.',
      icon: Wheat,
      iconBg: 'bg-emerald-100 text-emerald-800',
      primary: false,
      onClick: () => setAddCropModalOpen(true),
    },
    {
      title: 'Ask Agricultural Assistant',
      description: 'Get answers from the context-aware chatbot.',
      icon: MessageCircle,
      iconBg: 'bg-emerald-100 text-emerald-800',
      primary: false,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-4 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Toast Alert */}
        {toastMsg && (
          <div className="mb-6 p-4 bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-between border border-emerald-700 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg('')} className="text-stone-300 hover:text-white text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Header Greeting */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
              {greeting}!
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Here's your agricultural advisory workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer border border-amber-700"
              >
                <Pencil className="h-4 w-4 text-amber-200" />
                <span>Add Additional Farmer Info</span>
              </button>
            )}
            <button
              onClick={() => setAddFarmModalOpen(true)}
              className="px-3.5 py-2 bg-stone-100 hover:bg-emerald-50 text-emerald-950 font-bold text-xs rounded-xl border border-stone-300 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-emerald-700" />
              <span>Add Farm</span>
            </button>

            <button
              onClick={() => setAddCropModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-emerald-300" />
              <span>Add Crop</span>
            </button>
          </div>
        </div>

        {/* Overall Crop Health Summary */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Overall Crop Environmental Health</p>
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-2xl font-black text-amber-700">AUTOMATED WEATHER RISK ACTIVE</span>
              </div>
              <div className="mt-2 flex items-center space-x-2 text-xs text-stone-600">
                <CloudRain className="h-3.5 w-3.5 text-cyan-600" />
                <span>Calculated from live telemetry: Mean Temp, Min/Max Temp, Humidity & Precipitation</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-stone-500">Live Weather Telemetry</p>
              <p className="text-sm font-bold text-emerald-950">GPS Farm Coordinates</p>
              <button 
                onClick={onOpenCropModal}
                className="mt-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>New Crop Photo Scan</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── AUTOMATED CROP WEATHER RISK ANALYSIS SECTION ─── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-emerald-950 flex items-center space-x-2">
              <CloudRain className="h-5 w-5 text-cyan-600" />
              <span>Weather-Based Crop Risk Analysis ({crops.length} Crops)</span>
            </h2>
            {loadingWeather && (
              <span className="text-xs text-cyan-800 flex items-center space-x-1 font-bold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Fetching Weather API...</span>
              </span>
            )}
          </div>

          {crops.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
              No crops registered yet. Register your crops to see automated weather risk analysis based on farm coordinates.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crops.map((crop) => {
                const farm = farms.find((f) => f.id === crop.farm_id);
                const risk = cropWeatherRisks[crop.id];
                const metrics = risk?.weather_metrics;
                const isSensorActive = farm?.has_sensor || metrics?.has_sensor || metrics?.temperature_source === 'SENSOR';

                return (
                  <div key={crop.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Farm: {farm?.farm_name || `Farm #${crop.farm_id}`}
                          </span>
                          {isSensorActive && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-100 text-cyan-900 border border-cyan-300 flex items-center space-x-1">
                              <Radio className="h-3 w-3 text-cyan-700 animate-pulse" />
                              <span>IoT Sensor Connected</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold text-emerald-950 mt-0.5">{crop.crop_type} Plot</h3>
                      </div>
                      {risk ? (
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border uppercase ${
                          risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL'
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : risk.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {risk.risk_level || 'LOW'} RISK
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 animate-pulse font-bold">Analyzing weather...</span>
                      )}
                    </div>

                    {/* Weather Metrics Display (Mean, Min, Max Temp, Humidity, Precip) */}
                    {metrics ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-3 gap-2 text-[11px] bg-stone-50 p-3 rounded-xl border border-stone-200">
                          <div>
                            <span className="text-stone-500 font-medium flex items-center space-x-1">
                              <Thermometer className="h-3 w-3 text-amber-600" />
                              <span>Mean Temp</span>
                            </span>
                            <p className="font-bold text-stone-900 mt-0.5">{metrics.mean_temperature.toFixed(1)}°C</p>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${
                              isSensorActive ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {isSensorActive ? '📡 Sensor' : '☁️ Weather API'}
                            </span>
                          </div>

                          <div>
                            <span className="text-stone-500 font-medium flex items-center space-x-1">
                              <Droplets className="h-3 w-3 text-cyan-600" />
                              <span>Humidity</span>
                            </span>
                            <p className="font-bold text-stone-900 mt-0.5">{metrics.relative_humidity.toFixed(0)}%</p>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${
                              isSensorActive ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {isSensorActive ? '📡 Sensor' : '☁️ Weather API'}
                            </span>
                          </div>

                          <div>
                            <span className="text-stone-500 font-medium flex items-center space-x-1">
                              <CloudRain className="h-3 w-3 text-blue-600" />
                              <span>Precipitation</span>
                            </span>
                            <p className="font-bold text-stone-900 mt-0.5">{metrics.precipitation.toFixed(1)} mm</p>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-stone-100 text-stone-600 border-stone-200 inline-block mt-1">
                              ☁️ Weather API
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-12 bg-stone-50 rounded-xl flex items-center justify-center text-xs text-stone-400">
                        Fetching live telemetry...
                      </div>
                    )}

                    {/* Risk Advisory & Actionable Advice */}
                    {risk?.potential_risks?.length > 0 && (
                      <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60 space-y-1 text-xs">
                        <p className="font-bold text-emerald-950 text-[11px]">Environmental Pathogen Risk:</p>
                        <p className="text-stone-700 leading-snug">{risk.potential_risks[0]}</p>
                        {risk.recommendations?.length > 0 && (
                          <p className="text-emerald-900 font-medium text-[11px] pt-1">
                            💡 <span className="font-bold">Advice:</span> {risk.recommendations[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── AUTOMATED CROP SOIL RISK & NUTRIENT ANALYSIS SECTION ─── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-emerald-950 flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-emerald-700" />
                <span>Soil-Based Crop Risk & Nutrient Analysis ({crops.length} Crops)</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                  Rule-Based (Beta)
                </span>
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedFarmIdForSoil(farms[0]?.id || '');
                setAddSoilModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer border border-emerald-800"
            >
              <TestTube className="h-3.5 w-3.5 text-emerald-300" />
              <span>Add / Update Soil Info</span>
            </button>
          </div>

          {/* Rule-based disclaimer banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 mb-4 flex items-start space-x-3 text-amber-900 text-xs">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-extrabold text-[11px] uppercase tracking-wider text-amber-950">
                Rule-Based Accuracy Notice
              </p>
              <p className="text-[11px] leading-snug font-medium">
                Soil analysis uses an agronomic rule-based model (ICAR guidelines) and <strong>may not be 100% accurate</strong>. The system continuously learns and refines predictions based on user inputs and crop outcome feedback.
              </p>
            </div>
          </div>

          {crops.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
              No crops registered yet. Register your crops to see automated soil nutrient analysis based on your Soil Health Card.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crops.map((crop) => {
                const farm = farms.find((f) => f.id === crop.farm_id);
                const soilData = soilRecords[crop.farm_id];
                const soilAnalysis = analyzeSoilRisk(soilData, crop.crop_type);

                return (
                  <div key={`soil-${crop.id}`} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Farm: {farm?.farm_name || `Farm #${crop.farm_id}`}
                        </span>
                        <h3 className="text-base font-extrabold text-emerald-950">{crop.crop_type} Plot</h3>
                      </div>
                      {soilAnalysis ? (
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border uppercase ${
                          soilAnalysis.risk_level === 'HIGH' || soilAnalysis.risk_level === 'CRITICAL'
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : soilAnalysis.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {soilAnalysis.risk_level} RISK
                        </span>
                      ) : (
                        <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded border border-stone-200">
                          No Soil Card
                        </span>
                      )}
                    </div>

                    {soilData && soilAnalysis ? (
                      <div className="space-y-3">
                        {/* Health score bar */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-stone-700 flex items-center space-x-1">
                              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                              <span>Soil Quality Score</span>
                            </span>
                            <span className="font-extrabold text-emerald-900">{soilAnalysis.healthScore} / 100</span>
                          </div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                soilAnalysis.healthScore >= 75
                                  ? 'bg-emerald-600'
                                  : soilAnalysis.healthScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${soilAnalysis.healthScore}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-stone-500 pt-0.5">
                            <span>Sample: #{soilData.sample_no || 'SHC-REC'}</span>
                            <span>Test Date: {soilData.test_date || 'Recent'}</span>
                          </div>
                        </div>

                        {/* Parameter Grid */}
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-[9px] font-bold text-stone-500 uppercase block">pH</span>
                            <span className="text-xs font-extrabold text-emerald-950">{soilData.ph}</span>
                          </div>
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-[9px] font-bold text-stone-500 uppercase block">EC (dS/m)</span>
                            <span className="text-xs font-extrabold text-emerald-950">{soilData.ec}</span>
                          </div>
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-[9px] font-bold text-stone-500 uppercase block">OC (%)</span>
                            <span className="text-xs font-extrabold text-emerald-950">{soilData.oc}%</span>
                          </div>
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-[9px] font-bold text-stone-500 uppercase block">N-P-K</span>
                            <span className="text-[11px] font-extrabold text-emerald-950">{soilData.nitrogen}-{soilData.phosphorus}-{soilData.potassium}</span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        {soilAnalysis.statusBadges?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {soilAnalysis.statusBadges.map((b, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                  b.level === 'HIGH'
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : b.level === 'MEDIUM'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Agronomic Recommendations */}
                        {soilAnalysis.recommendations?.length > 0 && (
                          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 space-y-1 text-xs">
                            <p className="font-extrabold text-emerald-950 text-[11px]">
                              🌱 Rule-Based Agronomic Advisory ({crop.crop_type}):
                            </p>
                            <p className="text-stone-800 leading-snug font-medium text-[11px]">
                              {soilAnalysis.recommendations[0]}
                            </p>
                            {soilAnalysis.recommendations[1] && (
                              <p className="text-stone-700 leading-snug font-medium text-[11px] pt-0.5">
                                💡 {soilAnalysis.recommendations[1]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-stone-50 p-4 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
                        <TestTube className="h-6 w-6 text-stone-400 mx-auto" />
                        <p className="text-xs font-bold text-stone-700">No Soil Health Card added for this plot</p>
                        <p className="text-[11px] text-stone-500">
                          Add your Soil Health Card values (pH, NPK, Organic Carbon) to calculate crop risk and get automated fertilizing advisories.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedFarmIdForSoil(crop.farm_id);
                            setAddSoilModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <TestTube className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Add Soil Info for {farm?.farm_name || 'Farm'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Registered Farms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-emerald-950 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-emerald-700" />
              <span>My Registered Farms ({farms.length})</span>
            </h2>
            <button
              onClick={() => setAddFarmModalOpen(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Farm</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-stone-500 text-xs flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
              <span>Loading farms...</span>
            </div>
          ) : farms.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-stone-200 text-center space-y-3">
              <MapPin className="h-8 w-8 text-stone-400 mx-auto" />
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
              {farms.map((farm) => (
                <div key={farm.id} className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-emerald-950">{farm.farm_name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ID: #{farm.id}
                    </span>
                  </div>

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

                  {/* IoT Sensor Connection Control */}
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${farm.has_sensor ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                      <span className="text-[11px] font-bold text-stone-700">
                        {farm.has_sensor ? 'IoT Sensor Connected' : 'No Sensor'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleSensor(farm)}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border transition-all cursor-pointer flex items-center space-x-1 ${
                        farm.has_sensor
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                      }`}
                    >
                      <Radio className="h-3 w-3" />
                      <span>{farm.has_sensor ? 'Disconnect' : 'Connect Sensor'}</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddCropModalOpen(true)}
                      className="flex-1 py-1.5 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Crop</span>
                    </button>
                    <button
                      onClick={() => { setSelectedFarmIdForSoil(farm.id); setAddSoilModalOpen(true); }}
                      className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-lg border border-amber-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <TestTube className="h-3.5 w-3.5 text-amber-700" />
                      <span>Soil Card</span>
                    </button>
                    <button
                      onClick={() => { setSelectedFarm(farm); setEditFarmModalOpen(true); }}
                      className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Crops Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-emerald-950 flex items-center space-x-2">
              <Wheat className="h-5 w-5 text-emerald-700" />
              <span>My Crops ({crops.length})</span>
            </h2>
            <button
              onClick={() => setAddCropModalOpen(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Crop</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-stone-500 text-xs flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
              <span>Loading crops...</span>
            </div>
          ) : crops.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-stone-200 text-center space-y-3">
              <Wheat className="h-8 w-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-800">No crops registered yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Register crop cycles (e.g. Rice, Wheat, Tomato) under your farm plots to track growth stages and advisory details.
              </p>
              <button
                onClick={() => setAddCropModalOpen(true)}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Register a Crop</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map((crop) => {
                const farmName = farms.find((f) => f.id === crop.farm_id)?.farm_name || `Farm #${crop.farm_id}`;
                const weatherRisk = cropWeatherRisks[crop.id];

                return (
                  <div key={crop.id} className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-emerald-950">{crop.crop_type}</h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-800 border-emerald-200">
                        {crop.growth_stage || 'Sowing'} Stage
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Farm</span>
                        <span className="font-bold text-emerald-900">{farmName}</span>
                      </div>
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
                      {weatherRisk && (
                        <div className="flex justify-between pt-1 border-t border-stone-100">
                          <span className="text-stone-500">Weather Risk</span>
                          <span className={`font-bold text-[11px] ${
                            weatherRisk.risk_level === 'HIGH' || weatherRisk.risk_level === 'CRITICAL' ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            {weatherRisk.risk_level || 'LOW'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Available Signals */}
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center space-x-3">
                      <Signal active={true} icon={Camera} label="Image" />
                      <Signal active={true} icon={CloudRain} label="Weather" />
                      <Signal active={true} icon={Sprout} label="Soil" />
                      <Signal active={true} icon={BarChart3} label="History" />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={onOpenCropModal}
                        className="flex-1 py-2 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 hover:border-emerald-300 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Check Health</span>
                      </button>
                      <button
                        onClick={() => { setSelectedCrop(crop); setEditCropModalOpen(true); }}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className={`text-left rounded-xl border p-5 transition-all hover:shadow-md cursor-pointer ${
                    action.primary
                      ? 'bg-emerald-950 text-white border-emerald-800 hover:bg-emerald-900'
                      : 'bg-white border-stone-200 hover:border-emerald-600/40'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg inline-flex mb-3 ${
                    action.primary ? 'bg-emerald-800 text-emerald-200' : action.iconBg
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-sm font-bold mb-1 ${action.primary ? 'text-white' : 'text-emerald-950'}`}>
                    {action.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${action.primary ? 'text-stone-300' : 'text-stone-500'}`}>
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Add Farm Modal */}
      <AddFarmModal
        isOpen={addFarmModalOpen}
        onClose={() => setAddFarmModalOpen(false)}
        onSuccess={handleFarmAdded}
      />

      {/* Add Crop Modal */}
      <AddCropModal
        isOpen={addCropModalOpen}
        onClose={() => setAddCropModalOpen(false)}
        farms={farms}
        onSuccess={handleCropAdded}
        onOpenAddFarm={() => setAddFarmModalOpen(true)}
      />

      {/* Edit Crop Modal */}
      <EditCropModal
        isOpen={editCropModalOpen}
        onClose={() => { setEditCropModalOpen(false); setSelectedCrop(null); }}
        crop={selectedCrop}
        farms={farms}
        onUpdated={handleCropUpdated}
        onDeleted={handleCropDeleted}
      />

      {/* Edit Farm Modal */}
      <EditFarmModal
        isOpen={editFarmModalOpen}
        onClose={() => { setEditFarmModalOpen(false); setSelectedFarm(null); }}
        farm={selectedFarm}
        onUpdated={handleFarmUpdated}
        onDeleted={handleFarmDeleted}
      />

      {/* Add Soil Modal */}
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

// Small signal indicator component
function Signal({ active, icon: Icon, label }) {
  return (
    <div className={`flex items-center space-x-1 ${active ? 'opacity-100' : 'opacity-30'}`} title={`${label}: ${active ? 'Available' : 'Not available'}`}>
      <Icon className={`h-3 w-3 ${active ? 'text-emerald-700' : 'text-stone-400'}`} />
      <span className={`text-[10px] font-medium ${active ? 'text-stone-600' : 'text-stone-400'}`}>{active ? '✓' : '—'}</span>
    </div>
  );
}
