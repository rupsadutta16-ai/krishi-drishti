import React, { useState, useEffect } from 'react';
import {
  Camera, Bug, History, MessageCircle,
  TrendingUp, CheckCircle2, AlertTriangle, Plus,
  CloudRain, Sprout, BarChart3, Eye, MapPin, Wheat, RefreshCw, AlertCircle
} from 'lucide-react';
import { getFarms } from '../../api/farms';
import { getCrops } from '../../api/crops';
import AddFarmModal from './AddFarmModal';
import AddCropModal from './AddCropModal';

export default function FarmerDashboard({ currentUser, onOpenCropModal }) {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [addFarmModalOpen, setAddFarmModalOpen] = useState(false);
  const [addCropModalOpen, setAddCropModalOpen] = useState(false);

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

      if (farmsRes.status === 'fulfilled') {
        setFarms(farmsRes.value || []);
      }
      if (cropsRes.status === 'fulfilled') {
        setCrops(cropsRes.value || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setErrorMsg('Could not load farm & crop data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <button onClick={() => setToastMsg('')} className="text-stone-300 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Header Greeting */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
              {greeting}!
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Here's your agricultural advisory workspace.
            </p>
          </div>
          <div className="flex items-center space-x-2">
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

        {/* Overall Crop Health Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Overall Crop Health</p>
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-2xl font-black text-amber-700">MODERATE RISK</span>
              </div>
              <div className="mt-2 flex items-center space-x-2 text-xs text-stone-600">
                <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                <span>Risk evaluated from registered farms & satellite telemetry</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-stone-500">Last checked</p>
              <p className="text-sm font-bold text-stone-800">Today</p>
              <button 
                onClick={onOpenCropModal}
                className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>New Assessment</span>
              </button>
            </div>
          </div>
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

                  <button
                    onClick={() => setAddCropModalOpen(true)}
                    className="w-full py-1.5 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Crop to Farm</span>
                  </button>
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
                    </div>

                    {/* Available Signals */}
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center space-x-3">
                      <Signal active={true} icon={Camera} label="Image" />
                      <Signal active={true} icon={CloudRain} label="Weather" />
                      <Signal active={true} icon={Sprout} label="Soil" />
                      <Signal active={true} icon={BarChart3} label="History" />
                    </div>

                    <button 
                      onClick={onOpenCropModal}
                      className="mt-4 w-full py-2 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 hover:border-emerald-300 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Check Crop Health</span>
                    </button>
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
