import React from 'react';
import {
  Camera, Bug, History, MessageCircle,
  TrendingUp, TrendingDown, Minus,
  CheckCircle, AlertTriangle, XCircle,
  CloudRain, Sprout, BarChart3, Eye
} from 'lucide-react';

export default function FarmerDashboard({ currentUser, onOpenCropModal }) {
  // Simulated time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Sample crop data
  const crops = [
    {
      name: 'Rice',
      health: 'Good',
      risk: 'Low',
      lastChecked: '2 days ago',
      healthColor: 'text-emerald-700',
      riskColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      signals: { image: true, weather: true, soil: true, history: true },
    },
    {
      name: 'Tomato',
      health: 'Needs Attention',
      risk: 'Moderate',
      lastChecked: 'Today',
      healthColor: 'text-amber-700',
      riskColor: 'bg-amber-100 text-amber-800 border-amber-200',
      signals: { image: true, weather: true, soil: false, history: true },
    },
    {
      name: 'Wheat',
      health: 'Good',
      risk: 'Low',
      lastChecked: '5 days ago',
      healthColor: 'text-emerald-700',
      riskColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      signals: { image: true, weather: true, soil: true, history: false },
    },
  ];

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
      title: 'Report Pest',
      description: 'Quickly report a pest observation or count.',
      icon: Bug,
      iconBg: 'bg-amber-100 text-amber-800',
      primary: false,
    },
    {
      title: 'View History',
      description: 'See how crop health has changed over time.',
      icon: History,
      iconBg: 'bg-sky-100 text-sky-800',
      primary: false,
    },
    {
      title: 'Ask Agricultural Assistant',
      description: 'Get answers from the context-aware chatbot.',
      icon: MessageCircle,
      iconBg: 'bg-emerald-100 text-emerald-800',
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-4 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
            {greeting}!
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Here's how your crops are doing today.
          </p>
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
                <span>Risk increased from last observation</span>
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

        {/* My Crops */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">My Crops</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <div key={crop.name} className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-emerald-950">{crop.name}</h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${crop.riskColor}`}>
                    {crop.risk} Risk
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Health</span>
                    <span className={`font-bold ${crop.healthColor}`}>{crop.health}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Last checked</span>
                    <span className="font-medium text-stone-700">{crop.lastChecked}</span>
                  </div>
                </div>

                {/* Available Signals */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center space-x-3">
                  <Signal active={crop.signals.image} icon={Camera} label="Image" />
                  <Signal active={crop.signals.weather} icon={CloudRain} label="Weather" />
                  <Signal active={crop.signals.soil} icon={Sprout} label="Soil" />
                  <Signal active={crop.signals.history} icon={BarChart3} label="History" />
                </div>

                <button 
                  onClick={onOpenCropModal}
                  className="mt-4 w-full py-2 bg-stone-50 hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg border border-stone-200 hover:border-emerald-300 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{crop.health === 'Needs Attention' ? 'Check Crop' : 'View Crop'}</span>
                </button>
              </div>
            ))}
          </div>
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
