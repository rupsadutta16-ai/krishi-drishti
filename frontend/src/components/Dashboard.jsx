import React, { useState } from 'react';
import { 
  Sprout, 
  Droplets, 
  Sun, 
  Wind, 
  TrendingUp, 
  ShieldAlert, 
  Plus, 
  Search, 
  Bell, 
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const metrics = [
    { title: 'Soil Moisture', value: '42%', status: 'Optimal', icon: Droplets, color: 'text-emerald-800', bg: 'bg-emerald-50' },
    { title: 'Ambient Temp', value: '28°C', status: 'Normal', icon: Sun, color: 'text-amber-800', bg: 'bg-amber-50' },
    { title: 'Wind Speed', value: '12 km/h', status: 'Gentle Breeze', icon: Wind, color: 'text-emerald-800', bg: 'bg-emerald-50' },
    { title: 'Crop Health Index', value: '94/100', status: 'Excellent', icon: Activity, color: 'text-emerald-900', bg: 'bg-emerald-100' },
  ];

  const recentObservations = [
    { id: 1, crop: 'Wheat Field Sector A', observation: 'Slight nitrogen deficiency detected on lower leaf tips', date: '2 hours ago', severity: 'Low', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
    { id: 2, crop: 'Rice Paddy Zone 3', observation: 'Irrigation level target reached; optimal water depth maintained', date: '5 hours ago', severity: 'Normal', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { id: 3, crop: 'Maize Plot North', observation: 'Routine pest scan completed; no infestation detected', date: '1 day ago', severity: 'Optimal', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Top Navbar */}
      <header className="bg-emerald-950 text-white shadow-md border-b-4 border-amber-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-800 rounded-lg text-white">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Krishi-Drishti</span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-amber-900 text-amber-100 rounded-full border border-amber-700">
                Agri Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search crops, fields, logs..."
                className="pl-9 pr-4 py-1.5 bg-emerald-900 text-white placeholder-stone-300 rounded-lg text-sm border border-emerald-800 focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
            </div>
            <button className="p-2 text-stone-200 hover:text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-amber-800 text-white flex items-center justify-between justify-center font-bold text-sm border-2 border-amber-600">
              KD
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Title Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
              Agricultural Monitoring & Field Insights
            </h1>
            <p className="mt-1 text-stone-600 font-medium">
              Real-time crop surveillance, soil telemetry, and data-driven farming advisory.
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-medium rounded-lg shadow-sm transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Field Log</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-medium rounded-lg shadow-sm transition-colors">
              <ShieldAlert className="h-4 w-4" />
              <span>Agri AI Scan</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{item.title}</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">{item.value}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-900 rounded">
                    {item.status}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${item.bg}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Main Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Text, Observations, Analytics & Farming Content */}
          <div className="lg:col-span-7 space-x-0 space-y-6">
            
            {/* Agriculture Summary Card */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-emerald-900" />
                  <h2 className="text-lg font-bold text-emerald-950">Crop Health & Seasonal Guidance</h2>
                </div>
                <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Season 2026 Active
                </span>
              </div>

              <div className="space-y-4 text-stone-700 leading-relaxed text-sm">
                <p>
                  Welcome to <strong className="text-emerald-900">Krishi-Drishti</strong>, your unified precision agriculture workspace. Sustainable farming relies on timely data monitoring, pest surveillance, and balanced nutrient management.
                </p>
                
                <div className="bg-emerald-50 border-l-4 border-emerald-800 p-4 rounded-r-lg">
                  <h3 className="font-bold text-emerald-950 text-sm flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                    <span>Agronomist Recommendation for Wheat & Paddy</span>
                  </h3>
                  <p className="text-xs text-emerald-900 mt-1">
                    Soil moisture levels are currently ideal. Maintain micro-drip irrigation during peak solar hours and inspect leaf undersides for fungal rust signs.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <span className="text-xs text-stone-500 font-semibold">Recommended Fertilization</span>
                    <p className="font-bold text-stone-900 mt-0.5">NPK 19-19-19 (Bio-organic)</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <span className="text-xs text-stone-500 font-semibold">Target Irrigation Volume</span>
                    <p className="font-bold text-stone-900 mt-0.5">25 mm / week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Field Observations List */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-emerald-950 flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-amber-800" />
                  <span>Recent Field Observations</span>
                </h2>
                <button className="text-xs font-bold text-emerald-900 hover:text-emerald-800 flex items-center space-x-1">
                  <span>View All Logs</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {recentObservations.map((obs) => (
                  <div key={obs.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-stone-900">{obs.crop}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${obs.badgeColor}`}>
                          {obs.severity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">{obs.observation}</p>
                    </div>
                    <span className="text-[11px] font-medium text-stone-400 whitespace-nowrap ml-4">
                      {obs.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-emerald-950 text-white p-5 rounded-xl border-t-4 border-amber-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Need automated pest diagnosis?</h3>
                <p className="text-xs text-emerald-200 mt-0.5">Upload leaf photos directly into Krishi-Drishti AI for diagnostic reporting.</p>
              </div>
              <button className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                Start Diagnostics
              </button>
            </div>

          </div>

          {/* RIGHT SIDE: Agriculture Image Showcase & Quick Visual Stats */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Image Card Container */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="relative">
                <img 
                  src="/agriculture_farm.jpg" 
                  alt="Modern Sustainable Agriculture Farm" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-3 right-3 bg-emerald-950/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-emerald-700">
                  Sector 1-A Camera Feed
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="font-bold text-lg text-emerald-950">Sustainable Smart Cultivation</h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Real-time optical monitoring of field canopy density, moisture retention, and solar absorption efficiency across agricultural sectors.
                </p>

                <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3">
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/60">
                    <span className="text-xs text-amber-900 font-bold">Soil Type</span>
                    <p className="text-sm font-extrabold text-stone-800 mt-0.5">Alluvial Loam</p>
                  </div>
                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/60">
                    <span className="text-xs text-emerald-900 font-bold">Expected Yield</span>
                    <p className="text-sm font-extrabold text-stone-800 mt-0.5">+18% vs Last Year</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Status Card */}
            <div className="bg-stone-900 text-white p-5 rounded-xl border-l-4 border-amber-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Krishi Telemetry</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-sm text-stone-300 font-medium">
                Sensors online across 12 monitoring nodes. Water pumps set to automated drip schedule at 17:00 IST.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
