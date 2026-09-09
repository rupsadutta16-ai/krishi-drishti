import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, History, Calendar, MapPin, Wheat, CheckCircle2, AlertTriangle, ShieldAlert, Camera, RefreshCw, Eye
} from 'lucide-react';
import { getObservations } from '../../api/observations';
import { getFarms } from '../../api/farms';
import { getCrops } from '../../api/crops';

export default function HistoryPage({ onBack, onSelectObservation }) {
  const [observations, setObservations] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHistoryData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [obsRes, farmsRes, cropsRes] = await Promise.allSettled([
        getObservations(),
        getFarms(),
        getCrops(),
      ]);

      if (obsRes.status === 'fulfilled') {
        setObservations(obsRes.value || []);
      }
      if (farmsRes.status === 'fulfilled') {
        setFarms(farmsRes.value || []);
      }
      if (cropsRes.status === 'fulfilled') {
        setCrops(cropsRes.value || []);
      }
    } catch (err) {
      console.error('Error fetching observation history:', err);
      setErrorMsg('Failed to load observation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 pt-14 pb-16">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm font-bold text-emerald-800 hover:text-emerald-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Page Header */}
        <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <History className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Field Observation History ({observations.length})
              </h1>
              <p className="text-xs text-stone-300 mt-0.5">
                Complete log of submitted crop photos, telemetry data, and quality checks.
              </p>
            </div>
          </div>
          <button
            onClick={fetchHistoryData}
            className="p-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-xs text-red-900 font-medium flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Observation History List */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 text-xs flex items-center justify-center space-x-2 shadow-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
            <span>Loading observation history...</span>
          </div>
        ) : observations.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3 shadow-xs">
            <Camera className="h-10 w-10 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">No field observations recorded yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Record your first crop observation by capturing a photo of your plot or leaf sample.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {observations.map((obs) => {
              const farm = farms.find((f) => f.id === obs.farm_id);
              const crop = crops.find((c) => c.id === obs.crop_id);
              const isRejected = obs.status === 'IMAGE_REJECTED' || (obs.image_quality_score !== null && obs.image_quality_score < 50.0);
              const dateStr = obs.created_at ? new Date(obs.created_at).toLocaleString() : 'Recent';

              return (
                <div key={obs.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="flex items-start space-x-4">
                    {/* Image Preview */}
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
                          ID: #{obs.id}
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

                      <h3 className="text-base font-extrabold text-emerald-950 truncate">
                        {crop?.crop_type || `Crop #${obs.crop_id}`}
                      </h3>

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

                  {/* Quality Score & Details Footer */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-stone-500 font-medium">Quality Score:</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        isRejected ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {obs.image_quality_score !== null && obs.image_quality_score !== undefined
                          ? obs.image_quality_score.toFixed(1)
                          : '85.0'} / 100
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

      </div>
    </div>
  );
}
