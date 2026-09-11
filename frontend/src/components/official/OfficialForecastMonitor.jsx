import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  RefreshCw,
  AlertCircle,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  MapPin,
  Info,
} from 'lucide-react';
import { getOfficialForecast } from '../../api/official';

const RISK_COLORS = {
  LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MODERATE: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  EXTREME: 'bg-red-100 text-red-700 border-red-200',
};

const SOURCE_LABELS = {
  OBSERVED: { text: 'Observed / Reported', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  FORECAST: { text: 'Forecast / Projected', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

// ─── Weather Metric Card ──────────────────────────────────────────────────────
function WeatherMetric({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-lg p-2 border border-stone-200/60">
      <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-stone-400 uppercase font-bold leading-tight">{label}</p>
        <p className="text-xs font-bold text-stone-800 leading-tight">
          {value !== null && value !== undefined ? `${value}${unit}` : '—'}
        </p>
      </div>
    </div>
  );
}

// ─── Single Day Forecast Card ─────────────────────────────────────────────────
function DayForecastCard({ day }) {
  const isObserved = day.source === 'OBSERVED';
  const sourceInfo = SOURCE_LABELS[day.source] || SOURCE_LABELS.FORECAST;

  return (
    <div className={`rounded-xl border p-3 space-y-2 transition-colors ${isObserved ? 'bg-sky-50/50 border-sky-200/60' : 'bg-white border-stone-200'}`}>
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-800">
            {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${sourceInfo.color}`}>
            {sourceInfo.text}
          </span>
        </div>
        {day.weather_risk && (
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${RISK_COLORS[day.weather_risk] || RISK_COLORS.LOW}`}>
            {day.weather_risk}
          </span>
        )}
      </div>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <WeatherMetric
          icon={Thermometer}
          label="Temp"
          value={day.temperature}
          unit="°C"
          color="bg-rose-100 text-rose-600"
        />
        <WeatherMetric
          icon={Droplets}
          label="Humidity"
          value={day.humidity}
          unit="%"
          color="bg-blue-100 text-blue-600"
        />
        <WeatherMetric
          icon={CloudRain}
          label="Rainfall"
          value={day.precipitation}
          unit="mm"
          color="bg-indigo-100 text-indigo-600"
        />
        <WeatherMetric
          icon={Wind}
          label="Wind"
          value={day.wind_speed}
          unit=" km/h"
          color="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Condition & Temp Range */}
      <div className="flex items-center justify-between text-[10px] text-stone-500">
        <span className="flex items-center gap-1">
          <Sun className="w-3 h-3" />
          {day.condition || 'N/A'}
        </span>
        {day.temperature_min != null && day.temperature_max != null && (
          <span>{day.temperature_min}° – {day.temperature_max}°</span>
        )}
      </div>

      {/* Risk Notes */}
      {day.risk_notes && (
        <p className="text-[10px] text-stone-500 leading-relaxed border-t border-stone-100 pt-1.5">
          {day.risk_notes}
        </p>
      )}
    </div>
  );
}

// ─── Location Section ─────────────────────────────────────────────────────────
function LocationForecast({ location }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-stone-50/60 rounded-xl border border-stone-200/80 overflow-hidden">
      {/* Location Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-100/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-stone-800">
              {location.district || 'Unknown District'}
            </p>
            <p className="text-[10px] text-stone-400 font-medium">
              {location.state} · {location.farm_count} farm{location.farm_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick metrics */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-stone-500">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-rose-400" />
              {location.avg_temperature}°C
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              {location.avg_humidity}%
            </span>
            <span className="flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-indigo-400" />
              {location.total_precipitation}mm
            </span>
          </div>
          {location.overall_risk && (
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${RISK_COLORS[location.overall_risk] || RISK_COLORS.LOW}`}>
              {location.overall_risk}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Forecast Days */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {location.forecast_days.map((day) => (
              <DayForecastCard key={day.date} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OfficialForecastMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastDays, setForecastDays] = useState(5);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOfficialForecast(forecastDays);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load weather forecast data.');
    } finally {
      setLoading(false);
    }
  }, [forecastDays]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const totalLocations = data?.locations?.length || 0;
  const highRiskCount = data?.locations?.filter(
    (l) => l.overall_risk === 'HIGH' || l.overall_risk === 'EXTREME'
  ).length || 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-600" />
            <span>Weather Forecast &amp; Environmental Conditions</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Weather data for farm locations. Today's data is observed/reported; future days are projections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Forecast Days Selector */}
          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="bg-stone-100 text-stone-700 text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={3}>3 Days</option>
            <option value={5}>5 Days</option>
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
          </select>

          <button
            onClick={fetchForecast}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-bold">Data Source Notice</p>
          <p className="mt-0.5">
            Today's weather is <span className="font-bold">observed/reported</span> data.
            Future days are <span className="font-bold">forecasts/projections</span>, not confirmed events.
            Weather forecasts are <span className="font-bold">NOT</span> disease or pest outbreak predictions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data || totalLocations === 0 ? (
        <div className="py-12 text-center">
          <Cloud className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-500">No weather forecast data available</p>
          <p className="text-xs text-stone-400 mt-1">
            Weather data requires farms with registered coordinates.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-sky-50 rounded-xl border border-sky-200/60 p-3 text-center">
              <p className="text-[10px] text-sky-600 uppercase font-bold">Locations</p>
              <p className="text-lg font-extrabold text-sky-800">{totalLocations}</p>
            </div>
            <div className="bg-rose-50 rounded-xl border border-rose-200/60 p-3 text-center">
              <p className="text-[10px] text-rose-600 uppercase font-bold">Forecast Days</p>
              <p className="text-lg font-extrabold text-rose-800">{data.forecast_period_days}</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-3 text-center">
              <p className="text-[10px] text-amber-600 uppercase font-bold">High Risk Areas</p>
              <p className="text-lg font-extrabold text-amber-800">{highRiskCount}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200/60 p-3 text-center">
              <p className="text-[10px] text-emerald-600 uppercase font-bold">Generated</p>
              <p className="text-xs font-bold text-emerald-800">
                {data.generated_at
                  ? new Date(data.generated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Source Legend */}
          <div className="flex items-center gap-4 text-[10px] text-stone-500">
            <span className="font-bold text-stone-600 uppercase">Data Types:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Observed / Reported (Today)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Forecast / Projected (Future)
            </span>
          </div>

          {/* Location Forecasts */}
          <div className="space-y-3">
            {data.locations.map((location) => (
              <LocationForecast key={`${location.district}-${location.state}`} location={location} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
