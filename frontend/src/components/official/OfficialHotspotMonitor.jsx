import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  AlertTriangle,
  Flame,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getOfficialHotspots } from '../../api/official';

const CROP_OPTIONS = ['', 'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Potato', 'Tomato', 'Maize'];
const RISK_OPTIONS = ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/** Fit map bounds to markers */
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = points.map((p) => [p.latitude, p.longitude]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [points, map]);
  return null;
}

const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#059669',
};

const getRiskColor = (level) => RISK_COLORS[level?.toUpperCase()] || '#059669';

export default function OfficialHotspotMonitor() {
  const [data, setData] = useState({ points: [], risk_areas: [], total_hotspot_cases: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [caseType, setCaseType] = useState('');
  const [cropType, setCropType] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchHotspots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOfficialHotspots({
        case_type: caseType || undefined,
        crop_type: cropType || undefined,
        risk_level: riskLevel || undefined,
        state: stateFilter || undefined,
        district: districtFilter || undefined,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
      });
      setData(res || { points: [], risk_areas: [], total_hotspot_cases: 0 });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load hotspot monitoring data.');
    } finally {
      setLoading(false);
    }
  }, [caseType, cropType, riskLevel, stateFilter, districtFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  const handleResetFilters = () => {
    setCaseType('');
    setCropType('');
    setRiskLevel('');
    setStateFilter('');
    setDistrictFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const pointsWithCoords = data.points.filter(
    (p) => p.latitude !== null && p.longitude !== null
  );
  const pointsWithoutCoords = data.points.filter(
    (p) => p.latitude === null || p.longitude === null
  );

  const mapCenter =
    pointsWithCoords.length > 0
      ? [
          pointsWithCoords.reduce((s, p) => s + p.latitude, 0) / pointsWithCoords.length,
          pointsWithCoords.reduce((s, p) => s + p.longitude, 0) / pointsWithCoords.length,
        ]
      : [20.5, 78.9]; // India center fallback

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span>Geographic Hotspots &amp; Risk Area Surveillance</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Geographic concentration of crop disease and pest cases aggregated by district and GPS coordinates.
          </p>
        </div>

        <button
          onClick={fetchHotspots}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filter Surveillance Data</span>
          </span>
          <button
            onClick={handleResetFilters}
            className="text-xs text-emerald-700 hover:underline font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Case Type */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Type</label>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Types</option>
              <option value="disease">Disease</option>
              <option value="pest">Pest</option>
            </select>
          </div>

          {/* Crop */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Crop</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c || 'All Crops'}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {RISK_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r || 'All Risks'}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">District</label>
            <input
              type="text"
              placeholder="e.g. Pune"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">State</label>
            <input
              type="text"
              placeholder="e.g. Maharashtra"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout: Left Map & Points / Right Risk Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Geographic Map Section (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col min-h-[420px]">
          {/* Map Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-xs tracking-wider uppercase text-stone-700">
                Hotspot Geographic Map
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-stone-200 rounded text-stone-600">
              {data.points.length} Cases ({pointsWithCoords.length} GPS mapped)
            </span>
          </div>

          {/* Leaflet Map */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-50 z-10">
                <div className="flex items-center gap-2 text-stone-400 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading map...</span>
                </div>
              </div>
            ) : pointsWithCoords.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-50 z-10">
                <div className="text-center text-stone-400 py-8 px-4">
                  <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-stone-500">No GPS-mapped cases found</p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {data.points.length > 0
                      ? `${data.points.length} cases exist but lack coordinates. View district aggregation on the right.`
                      : 'No cases match the current filters.'}
                  </p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={5}
                style={{ height: '100%', minHeight: '360px', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds points={pointsWithCoords} />
                {pointsWithCoords.map((pt) => (
                  <CircleMarker
                    key={pt.case_id}
                    center={[pt.latitude, pt.longitude]}
                    radius={pt.risk_level === 'CRITICAL' ? 10 : pt.risk_level === 'HIGH' ? 8 : 6}
                    pathOptions={{
                      color: getRiskColor(pt.risk_level),
                      fillColor: getRiskColor(pt.risk_level),
                      fillOpacity: 0.7,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 min-w-[180px]">
                        <p className="font-bold text-stone-800">Case #{pt.case_id}: {pt.title}</p>
                        <p><span className="font-semibold">Crop:</span> {pt.crop_type || 'N/A'}</p>
                        <p><span className="font-semibold">Type:</span> {pt.case_type}</p>
                        {pt.suspected_problem && (
                          <p><span className="font-semibold">Problem:</span> {pt.suspected_problem}</p>
                        )}
                        <p><span className="font-semibold">Risk:</span> <span style={{ color: getRiskColor(pt.risk_level) }}>{pt.risk_level || 'N/A'}</span></p>
                        <p><span className="font-semibold">District:</span> {pt.district}</p>
                        <p><span className="font-semibold">State:</span> {pt.state}</p>
                        <p><span className="font-semibold">Coords:</span> {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-stone-500 px-4 py-2 border-t border-stone-100 bg-stone-50/50">
            <span className="font-bold text-stone-600 uppercase">Risk Level:</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Critical</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Low</span>
          </div>
        </div>

        {/* Non-GPS Cases List */}
        {!loading && pointsWithoutCoords.length > 0 && (
          <div className="lg:col-span-12 bg-stone-50 rounded-xl border border-stone-200 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
              Cases Without GPS Coordinates ({pointsWithoutCoords.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {pointsWithoutCoords.map((pt) => (
                <div
                  key={pt.case_id}
                  className="bg-white border border-stone-200 rounded-lg p-2.5 text-xs space-y-0.5"
                >
                  <p className="font-bold text-stone-700">Case #{pt.case_id}: {pt.title}</p>
                  <p className="text-stone-500">{pt.district}, {pt.state}</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-stone-400">{pt.crop_type || 'N/A'}</span>
                    <span className="font-semibold" style={{ color: getRiskColor(pt.risk_level) }}>{pt.risk_level || 'LOW'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Areas Section (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>Elevated Risk Areas</span>
            </h3>
            <span className="text-xs text-stone-400 font-medium">
              {data.risk_areas.length} Districts
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-stone-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data.risk_areas.length === 0 ? (
            <div className="py-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
              <p className="text-xs text-stone-500 italic">No risk area data matching filters.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {data.risk_areas.map((area) => (
                <div
                  key={`${area.district}-${area.state}`}
                  onClick={() => setDistrictFilter(area.district)}
                  className="bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl p-4 transition-colors cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-stone-800 text-sm group-hover:text-emerald-700 transition-colors">
                        {area.district}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-medium">{area.state}</p>
                    </div>
                    {area.critical_risk_cases > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-200">
                        Critical Risk
                      </span>
                    ) : area.high_risk_cases > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700 border border-orange-200">
                        High Risk
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Moderate
                      </span>
                    )}
                  </div>

                  {/* Summary Numbers */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Active Cases</span>
                      <span className="font-extrabold text-stone-800">{area.total_active_cases}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">High Risk</span>
                      <span className="font-extrabold text-orange-600">{area.high_risk_cases}</span>
                    </div>
                  </div>

                  {area.dominant_problem && (
                    <p className="text-[11px] text-stone-500 pt-1">
                      <strong className="text-stone-700 font-semibold">Dominant problem:</strong>{' '}
                      <span className="text-emerald-800 font-bold">{area.dominant_problem}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
