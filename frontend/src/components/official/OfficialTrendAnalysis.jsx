import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Wheat,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { getOfficialTrends } from '../../api/official';

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
];

// ─── Mini SVG Line Chart ──────────────────────────────────────────────────────
function MiniLineChart({ data, dataKeys, colors, height = 120, label }) {
  if (!data || data.length === 0) return <EmptyState text="No data available" />;

  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const chartW = 400;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  // Compute max across all series
  let maxVal = 1;
  for (const d of data) {
    for (const k of dataKeys) {
      if (d[k] > maxVal) maxVal = d[k];
    }
  }

  const xStep = innerW / Math.max(data.length - 1, 1);

  const makePath = (key) => {
    return data
      .map((d, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + innerH - (d[key] / maxVal) * innerH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const formatDate = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // X-axis labels: show every Nth label to avoid crowding
  const labelEvery = Math.max(1, Math.floor(data.length / 7));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: 300 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padding.top + innerH - frac * innerH;
          return (
            <g key={frac}>
              <line x1={padding.left} y1={y} x2={chartW - padding.right} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={padding.left - 4} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af">
                {Math.round(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {dataKeys.map((key, idx) => (
          <path key={key} d={makePath(key)} fill="none" stroke={colors[idx]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== data.length - 1) return null;
          const x = padding.left + i * xStep;
          return (
            <text key={i} x={x} y={chartH - 4} textAnchor="middle" fontSize={8} fill="#9ca3af">
              {formatDate(d.date)}
            </text>
          );
        })}

        {/* Legend */}
        {dataKeys.map((key, idx) => (
          <g key={key} transform={`translate(${padding.left + idx * 80}, 2)`}>
            <rect x={0} y={0} width={8} height={8} rx={2} fill={colors[idx]} />
            <text x={12} y={8} fontSize={8} fill="#6b7280" fontWeight="600">
              {key.replace(/_/g, ' ')}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, height = 90, color = '#059669', label }) {
  if (!data || data.length === 0) return <EmptyState text="No data available" />;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barW = Math.min(28, Math.max(10, 240 / data.length));
  const chartH = height;
  const chartW = Math.min(data.length * (barW + 4) + 40, 500);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: 200 }}>
        {data.map((d, i) => {
          const barH = (d.count / maxVal) * (chartH - 30);
          const x = 20 + i * (barW + 4);
          const y = chartH - 24 - barH;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={chartH - 8} textAnchor="middle" fontSize={8} fill="#6b7280" fontWeight="600">
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={8} fill="#374151" fontWeight="700">
                  {d.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ text }) {
  return (
    <div className="py-8 text-center">
      <BarChart3 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
      <p className="text-xs text-stone-400 italic">{text}</p>
    </div>
  );
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────
function TrendStat({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 border border-stone-200">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-[10px] text-stone-400 uppercase font-bold">{label}</p>
        <p className="text-lg font-extrabold text-stone-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OfficialTrendAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOfficialTrends(period);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load trend analysis data.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const hasData = data && (
    data.cases_over_time.some((d) => d.total > 0) ||
    data.cases_by_crop.length > 0 ||
    data.cases_by_district.length > 0
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Agricultural Trend Analysis</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Historical trends for cases, risk levels, validations, and geographic distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-stone-100 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                  period === p.value
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchTrends}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-stone-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="py-12 text-center">
          <TrendingUp className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-500">No trend data available</p>
          <p className="text-xs text-stone-400 mt-1">
            Trends will appear once cases and observations are recorded in the system.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <TrendStat label="Total Cases" value={data.total_cases_in_range} icon={BarChart3} color="bg-emerald-100 text-emerald-700" />
            <TrendStat label="Disease" value={data.total_disease_in_range} icon={AlertTriangle} color="bg-rose-100 text-rose-700" />
            <TrendStat label="Pest" value={data.total_pest_in_range} icon={XCircle} color="bg-lime-100 text-lime-700" />
            <TrendStat label="High Risk" value={data.total_high_risk_in_range} icon={AlertCircle} color="bg-orange-100 text-orange-700" />
            <TrendStat label="Critical" value={data.total_critical_risk_in_range} icon={XCircle} color="bg-red-100 text-red-700" />
            <TrendStat label="Validations" value={data.total_validations_in_range} icon={CheckCircle2} color="bg-purple-100 text-purple-700" />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases Over Time */}
            <div className="bg-stone-50/60 rounded-xl border border-stone-200/80 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Cases Over Time
              </h3>
              <MiniLineChart
                data={data.cases_over_time}
                dataKeys={['total', 'disease', 'pest']}
                colors={['#059669', '#e11d48', '#65a30d']}
                height={110}
              />
            </div>

            {/* Risk Cases Over Time */}
            <div className="bg-stone-50/60 rounded-xl border border-stone-200/80 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                High &amp; Critical Risk Cases Over Time
              </h3>
              <MiniLineChart
                data={data.risk_cases_over_time}
                dataKeys={['high', 'critical']}
                colors={['#ea580c', '#dc2626']}
                height={110}
              />
            </div>

            {/* Validations Over Time */}
            <div className="bg-stone-50/60 rounded-xl border border-stone-200/80 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                Expert Validations Over Time
              </h3>
              <MiniLineChart
                data={data.validations_over_time}
                dataKeys={['confirmed', 'corrected', 'needs_investigation']}
                colors={['#059669', '#d97706', '#dc2626']}
                height={110}
              />
            </div>

            {/* Cases by Crop */}
            <div className="bg-stone-50/60 rounded-xl border border-stone-200/80 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5 text-amber-600" />
                Cases by Crop Type
              </h3>
              <MiniBarChart
                data={data.cases_by_crop.slice(0, 8)}
                height={100}
                color="#059669"
              />
            </div>

            {/* Cases by District */}
            <div className="bg-stone-50/60 rounded-xl border border-stone-200/80 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Cases by District
              </h3>
              <MiniBarChart
                data={data.cases_by_district.slice(0, 10)}
                height={100}
                color="#0284c7"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
