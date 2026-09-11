import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getOfficialCases, getOfficialCaseDetail } from '../../api/official';

// ─── Tiny SVG helper ──────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const PATHS = {
  filter:  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
  search:  'M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z',
  arrow:   'M9 5l7 7-7 7',
  close:   'M6 18L18 6M6 6l12 12',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  case:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  img:     'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  check:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  pin:     'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
};

// ─── Constants ─────────────────────────────────────────────────────────────────
const CROP_TYPES  = ['Rice','Cotton','Wheat','Soybean','Tomato','Maize','Sugarcane','Pulses','Other'];
const RISK_LEVELS = ['LOW','MEDIUM','HIGH','CRITICAL'];
const STATUSES    = ['open','pending_expert','validated','resolved','closed'];
const CASE_TYPES  = ['disease','pest'];

const STATUS_COLORS = {
  open:           'bg-sky-100 text-sky-700',
  pending_expert: 'bg-amber-100 text-amber-700',
  validated:      'bg-violet-100 text-violet-700',
  resolved:       'bg-emerald-100 text-emerald-700',
  closed:         'bg-stone-100 text-stone-500',
};

const RISK_COLORS = {
  LOW:      'bg-green-100 text-green-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

// ─── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ text, colorClass }) {
  if (!text) return <span className="text-stone-300 text-xs">—</span>;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
      {text}
    </span>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, onReset, loading }) {
  const sel = (name, options, label) => (
    <select
      id={`official-filter-${name}`}
      value={filters[name] || ''}
      onChange={e => onChange(name, e.target.value)}
      className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon d={PATHS.filter} className="w-4 h-4 text-emerald-700" />
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Filters</span>
        <button
          id="official-filter-reset"
          onClick={onReset}
          className="ml-auto text-xs text-stone-400 hover:text-red-500 transition-colors"
        >
          Reset all
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {sel('status',    STATUSES.map(s => s.replace('_', ' ')).map((_, i) => STATUSES[i]),
                          'All Statuses')}
        {sel('crop_type', CROP_TYPES,  'All Crops')}
        {sel('risk_level',RISK_LEVELS, 'All Risk Levels')}
        {sel('case_type', CASE_TYPES,  'Disease / Pest')}

        <input
          id="official-filter-state"
          type="text"
          placeholder="State…"
          value={filters.state || ''}
          onChange={e => onChange('state', e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-28"
        />
        <input
          id="official-filter-district"
          type="text"
          placeholder="District…"
          value={filters.district || ''}
          onChange={e => onChange('district', e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-32"
        />
        <input
          id="official-filter-date-from"
          type="date"
          value={filters.date_from || ''}
          onChange={e => onChange('date_from', e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <span className="text-stone-300 text-xs">to</span>
        <input
          id="official-filter-date-to"
          type="date"
          value={filters.date_to || ''}
          onChange={e => onChange('date_to', e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />

        {loading && (
          <svg className="w-4 h-4 text-emerald-600 animate-spin ml-1" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── Case table ────────────────────────────────────────────────────────────────
function CaseTable({ cases, total, skip, limit, onPageChange, onSelect, loading }) {
  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon d={PATHS.case} className="w-4 h-4 text-emerald-700" />
          <span className="text-sm font-semibold text-stone-700">Case Monitoring</span>
        </div>
        <span className="text-xs text-stone-400">
          {total} {total === 1 ? 'case' : 'cases'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 text-left">
              {['ID','Crop','Type','Suspected Problem','Risk','Confidence','Status','District / State','Created','Last Obs.',''].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-stone-50">
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-stone-100 rounded animate-pulse w-16" />
                    </td>
                  ))}
                </tr>
              ))
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-stone-400 text-sm">
                  No cases found matching the current filters.
                </td>
              </tr>
            ) : (
              cases.map(c => (
                <tr
                  key={c.case_id}
                  id={`official-case-row-${c.case_id}`}
                  onClick={() => onSelect(c.case_id)}
                  className="border-t border-stone-50 hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">#{c.case_id}</td>
                  <td className="px-4 py-3 font-medium text-stone-700 whitespace-nowrap">
                    {c.crop_type || '—'}
                    {c.crop_variety && <span className="text-stone-400 text-xs ml-1">({c.crop_variety})</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.case_type ? (
                      <Badge
                        text={c.case_type}
                        colorClass={c.case_type === 'Disease' ? 'bg-rose-100 text-rose-700' : 'bg-lime-100 text-lime-700'}
                      />
                    ) : <span className="text-stone-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-600 max-w-[160px] truncate" title={c.suspected_problem}>
                    {c.suspected_problem || <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge text={c.risk_level} colorClass={RISK_COLORS[c.risk_level] || 'bg-stone-100 text-stone-500'} />
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {c.confidence != null ? `${(c.confidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      text={c.status?.replace('_', ' ')}
                      colorClass={STATUS_COLORS[c.status] || 'bg-stone-100 text-stone-500'}
                    />
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">
                    {[c.district, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">{fmt(c.created_at)}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">{fmt(c.latest_observation_at)}</td>
                  <td className="px-4 py-3">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600">
                      <Icon d={PATHS.arrow} className="w-4 h-4" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              id="official-cases-prev"
              disabled={skip === 0}
              onClick={() => onPageChange(Math.max(0, skip - limit))}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              id="official-cases-next"
              disabled={skip + limit >= total}
              onClick={() => onPageChange(skip + limit)}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Case Detail Panel ─────────────────────────────────────────────────────────
function CaseDetailPanel({ caseId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setDetail(null);
    getOfficialCaseDetail(caseId)
      .then(setDetail)
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load case.'))
      .finally(() => setLoading(false));
  }, [caseId]);

  // Close on Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—';
  const fmtP = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Slide-in panel */}
      <div
        ref={panelRef}
        id="official-case-detail-panel"
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]"
        style={{ animation: 'slideInRight 0.22s ease-out' }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
          <div className="flex items-center gap-2">
            <Icon d={PATHS.case} className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-stone-800">
              {loading ? 'Loading…' : detail ? `Case #${detail.case_id}` : 'Case Detail'}
            </h3>
          </div>
          <button
            id="official-case-detail-close"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-lg hover:bg-stone-100"
          >
            <Icon d={PATHS.close} className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading && (
            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 bg-stone-100 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
              ))}
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          {detail && !loading && (
            <>
              {/* Title & meta */}
              <div>
                <h4 className="text-lg font-bold text-stone-800">{detail.title}</h4>
                {detail.description && (
                  <p className="text-sm text-stone-500 mt-1">{detail.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge
                    text={detail.status?.replace('_', ' ')}
                    colorClass={STATUS_COLORS[detail.status] || 'bg-stone-100 text-stone-500'}
                  />
                  {detail.crop_type && (
                    <Badge text={detail.crop_type} colorClass="bg-emerald-100 text-emerald-700" />
                  )}
                  {detail.growth_stage && (
                    <Badge text={detail.growth_stage} colorClass="bg-teal-100 text-teal-700" />
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Farmer',     detail.farmer_name || `#${detail.farmer_id}`],
                  ['Farm',       detail.farm_name   || '—'],
                  ['Village',    detail.village     || '—'],
                  ['District',   detail.district    || '—'],
                  ['State',      detail.state       || '—'],
                  ['Crop Variety', detail.crop_variety || '—'],
                  ['Created',    fmt(detail.created_at)],
                  ['Updated',    fmt(detail.updated_at)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-stone-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-stone-700 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Observations */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
                  Farmer Reports / Observations ({detail.observations.length})
                </h5>
                {detail.observations.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">No observations yet.</p>
                ) : (
                  <div className="space-y-3">
                    {detail.observations.map((obs, i) => (
                      <div key={obs.id} className="border border-stone-200 rounded-xl overflow-hidden">
                        <div className="flex items-start gap-3 p-4">
                          {/* Thumbnail */}
                          <a href={obs.image_url} target="_blank" rel="noreferrer" className="shrink-0">
                            <img
                              src={obs.image_url}
                              alt={`Observation #${obs.id}`}
                              className="w-16 h-16 rounded-lg object-cover border border-stone-200 hover:opacity-80 transition-opacity"
                              onError={e => { e.target.style.display='none'; }}
                            />
                          </a>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-mono text-stone-400">Obs #{obs.id}</span>
                              <Badge
                                text={obs.status}
                                colorClass="bg-sky-100 text-sky-700"
                              />
                              {obs.risk_level && (
                                <Badge text={obs.risk_level} colorClass={RISK_COLORS[obs.risk_level] || 'bg-stone-100 text-stone-500'} />
                              )}
                            </div>
                            <p className="text-xs text-stone-400">{fmt(obs.observed_at)}</p>
                            {(obs.predicted_disease || obs.predicted_pest) && (
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                {obs.predicted_disease && (
                                  <div className="bg-rose-50 rounded-lg px-2 py-1">
                                    <span className="text-rose-400">Disease: </span>
                                    <span className="text-rose-700 font-medium">{obs.predicted_disease}</span>
                                    {obs.disease_probability != null && (
                                      <span className="text-rose-400 ml-1">({fmtP(obs.disease_probability)})</span>
                                    )}
                                  </div>
                                )}
                                {obs.predicted_pest && (
                                  <div className="bg-lime-50 rounded-lg px-2 py-1">
                                    <span className="text-lime-500">Pest: </span>
                                    <span className="text-lime-700 font-medium">{obs.predicted_pest}</span>
                                    {obs.pest_probability != null && (
                                      <span className="text-lime-400 ml-1">({fmtP(obs.pest_probability)})</span>
                                    )}
                                  </div>
                                )}
                                {obs.confidence_score != null && (
                                  <div className="col-span-2 text-stone-400">
                                    Confidence: <span className="text-stone-600 font-medium">{fmtP(obs.confidence_score)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {obs.image_quality_score != null && (
                              <p className="text-xs text-stone-400 mt-1">Image quality: {(obs.image_quality_score * 100).toFixed(0)}%</p>
                            )}
                            {(obs.latitude != null && obs.longitude != null) && (
                              <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                                <Icon d={PATHS.pin} className="w-3 h-3" />
                                {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expert Validations */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
                  Expert Validations ({detail.validations.length})
                </h5>
                {detail.validations.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">No expert validations yet.</p>
                ) : (
                  <div className="space-y-3">
                    {detail.validations.map(v => (
                      <div key={v.id} className="border border-stone-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon d={PATHS.check} className="w-4 h-4 text-violet-600" />
                          <span className="text-sm font-semibold text-stone-700">
                            {v.expert_name || 'Expert'}
                          </span>
                          <Badge
                            text={v.validation_result?.replace('_', ' ')}
                            colorClass="bg-violet-100 text-violet-700"
                          />
                          <span className="ml-auto text-xs text-stone-400">{fmt(v.created_at)}</span>
                        </div>
                        {(v.corrected_disease || v.corrected_pest) && (
                          <div className="text-xs space-y-0.5 mb-2">
                            {v.corrected_disease && <p><span className="text-stone-400">Disease: </span><span className="text-stone-700">{v.corrected_disease}</span></p>}
                            {v.corrected_pest    && <p><span className="text-stone-400">Pest: </span><span className="text-stone-700">{v.corrected_pest}</span></p>}
                          </div>
                        )}
                        {v.comments && (
                          <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2 mb-2">{v.comments}</p>
                        )}
                        {v.treatment_recommendation && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                            <p className="text-xs text-emerald-500 font-semibold mb-0.5">Treatment Recommendation</p>
                            <p className="text-xs text-emerald-800">{v.treatment_recommendation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function OfficialCaseMonitor() {
  const [filters, setFilters] = useState({});
  const [data, setData]       = useState({ total: 0, cases: [] });
  const [skip, setSkip]       = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const LIMIT = 50;

  const fetchCases = useCallback(async (activeFilters, currentSkip) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOfficialCases({ ...activeFilters, skip: currentSkip, limit: LIMIT });
      setData(result);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce filter changes
  const debounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSkip(0);
      fetchCases(filters, 0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchCases]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value || undefined }));
  };

  const handleReset = () => {
    setFilters({});
    setSkip(0);
  };

  const handlePageChange = (newSkip) => {
    setSkip(newSkip);
    fetchCases(filters, newSkip);
  };

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <CaseTable
        cases={data.cases}
        total={data.total}
        skip={skip}
        limit={LIMIT}
        onPageChange={handlePageChange}
        onSelect={setSelectedCaseId}
        loading={loading}
      />

      {selectedCaseId && (
        <CaseDetailPanel
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </div>
  );
}
