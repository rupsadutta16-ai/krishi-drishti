import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getOfficialValidations } from '../../api/official';
import { getOfficialCaseDetail } from '../../api/official';

// ─── Tiny SVG helper ──────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const P = {
  brain:    'M9.5 2a2.5 2.5 0 015 0c1.5.3 2.5 1.3 2.5 2.5 1.2.5 2 1.7 2 3 0 1-.4 1.8-1 2.5.6.7 1 1.6 1 2.5 0 1.3-.8 2.5-2 3 0 1.2-1 2.2-2.5 2.5a2.5 2.5 0 01-5 0c-1.5-.3-2.5-1.3-2.5-2.5-1.2-.5-2-1.7-2-3 0-1 .4-1.8 1-2.5-.6-.7-1-1.6-1-2.5 0-1.3.8-2.5 2-3 0-1.2 1-2.2 2.5-2.5z',
  check:    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  edit:     'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  alert:    'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  filter:   'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
  case_:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  arrow:    'M9 5l7 7-7 7',
  close:    'M6 18L18 6M6 6l12 12',
  pill:     'M4 12l.01 0M12 4l0 .01M20 12l-.01 0M12 20l0-.01',
  pin:      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
  img:      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  steth:    'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3a2 2 0 000 4h10a2 2 0 000-4M9 3H5M3 7v10a2 2 0 002 2h10a2 2 0 002-2V7M7 7v4M12 7v4M17 7v4',
};

const RESULT_OPTIONS = ['confirmed', 'corrected', 'needs_investigation'];
const CROP_TYPES     = ['Rice','Cotton','Wheat','Soybean','Tomato','Maize','Sugarcane','Pulses','Other'];

const RESULT_CONFIG = {
  confirmed:          { label: 'AI Confirmed',         colorClass: 'bg-emerald-100 text-emerald-700', icon: P.check  },
  corrected:          { label: 'AI Corrected',          colorClass: 'bg-rose-100 text-rose-700',      icon: P.edit   },
  needs_investigation:{ label: 'Needs Investigation',   colorClass: 'bg-amber-100 text-amber-700',    icon: P.alert  },
};

const RISK_COLORS = {
  LOW:      'bg-green-100 text-green-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open:            'bg-sky-100 text-sky-700',
  pending_expert:  'bg-amber-100 text-amber-700',
  validated:       'bg-violet-100 text-violet-700',
  resolved:        'bg-emerald-100 text-emerald-700',
  closed:          'bg-stone-100 text-stone-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (dt) => dt
  ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const fmtFull = (dt) => dt
  ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';

const fmtP = (v) => v != null ? `${(v * 100).toFixed(1)}%` : null;

function Badge({ text, colorClass, small }) {
  if (!text) return <span className="text-stone-300 text-xs">—</span>;
  return (
    <span className={`font-semibold rounded-full ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} ${colorClass}`}>
      {text}
    </span>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function ValidationStatsBar({ stats, loading, onFilter, activeFilter }) {
  if (loading || !stats) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const cards = [
    { label: 'Total Validations', value: stats.total_validations,  colorClass: 'bg-indigo-100 text-indigo-700',  filter: null },
    { label: 'AI Confirmed',      value: stats.confirmed,          colorClass: 'bg-emerald-100 text-emerald-700', filter: 'confirmed' },
    { label: 'AI Corrected',      value: stats.corrected,          colorClass: 'bg-rose-100 text-rose-700',       filter: 'corrected' },
    { label: 'Escalated',         value: stats.escalated,          colorClass: 'bg-amber-100 text-amber-700',     filter: 'needs_investigation' },
    { label: 'Pending Expert',    value: stats.pending_expert,     colorClass: 'bg-sky-100 text-sky-700',         filter: null },
    { label: 'Last 7 Days',       value: stats.recently_reported,  colorClass: 'bg-violet-100 text-violet-700',   filter: null },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <button
          key={c.label}
          onClick={() => c.filter && onFilter(c.filter === activeFilter ? null : c.filter)}
          className={`text-left rounded-2xl border p-4 transition-all ${
            c.filter && activeFilter === c.filter
              ? 'border-emerald-400 ring-2 ring-emerald-200 shadow-md'
              : 'border-stone-200 hover:shadow-sm'
          } bg-white`}
        >
          <p className="text-xs font-semibold text-stone-400 leading-tight">{c.label}</p>
          <p className={`text-2xl font-black mt-1 ${c.colorClass.split(' ')[1]}`}>{c.value}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, onReset }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 flex flex-wrap gap-2 items-center shadow-sm">
      <Icon d={P.filter} className="w-4 h-4 text-emerald-700 shrink-0" />

      <select
        id="valmon-filter-result"
        value={filters.validation_result || ''}
        onChange={e => onChange('validation_result', e.target.value)}
        className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <option value="">All Results</option>
        {RESULT_OPTIONS.map(r => (
          <option key={r} value={r}>{r.replace('_', ' ')}</option>
        ))}
      </select>

      <select
        id="valmon-filter-crop"
        value={filters.crop_type || ''}
        onChange={e => onChange('crop_type', e.target.value)}
        className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <option value="">All Crops</option>
        {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <input
        id="valmon-filter-state"
        type="text"
        placeholder="State…"
        value={filters.state || ''}
        onChange={e => onChange('state', e.target.value)}
        className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-28"
      />
      <input
        id="valmon-filter-district"
        type="text"
        placeholder="District…"
        value={filters.district || ''}
        onChange={e => onChange('district', e.target.value)}
        className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-32"
      />

      <button
        id="valmon-filter-reset"
        onClick={onReset}
        className="ml-auto text-xs text-stone-400 hover:text-red-500 transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

// ─── Three-layer chain card ───────────────────────────────────────────────────
function ChainCard({ row, onOpenCase }) {
  const cfg = RESULT_CONFIG[row.expert?.validation_result] || {};

  return (
    <div
      id={`valmon-row-${row.case_id}-${row.expert?.id}`}
      className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100">
        <Badge
          text={cfg.label || row.expert?.validation_result}
          colorClass={cfg.colorClass || 'bg-stone-100 text-stone-500'}
        />
        <button
          id={`valmon-open-case-${row.case_id}`}
          onClick={() => onOpenCase(row.case_id)}
          className="ml-auto flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
        >
          Case #{row.case_id}
          <Icon d={P.arrow} className="w-3 h-3" />
        </button>
      </div>

      {/* Body — three layers */}
      <div className="p-5 space-y-4">
        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
          {row.crop_type  && <span><span className="text-stone-600 font-medium">{row.crop_type}</span></span>}
          {row.farmer_name && <span>Farmer: <span className="text-stone-600 font-medium">{row.farmer_name}</span></span>}
          {(row.district || row.state) && (
            <span className="flex items-center gap-0.5">
              <Icon d={P.pin} className="w-3 h-3" />
              {[row.district, row.state].filter(Boolean).join(', ')}
            </span>
          )}
          <span>Reported: {fmt(row.case_created_at)}</span>
          <span>Validated: {fmt(row.expert?.created_at)}</span>
          <Badge
            text={row.case_status?.replace('_', ' ')}
            colorClass={STATUS_COLORS[row.case_status] || 'bg-stone-100 text-stone-500'}
            small
          />
        </div>

        {/* Layer 1 — AI prediction */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon d={P.brain} className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Layer 1 · AI Prediction (original)</span>
          </div>
          {row.ai ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {row.ai.predicted_disease && (
                <>
                  <span className="text-stone-400">Disease</span>
                  <span className="text-stone-700 font-medium">{row.ai.predicted_disease}
                    {row.ai.disease_probability != null && (
                      <span className="text-stone-400 ml-1">({fmtP(row.ai.disease_probability)})</span>
                    )}
                  </span>
                </>
              )}
              {row.ai.predicted_pest && (
                <>
                  <span className="text-stone-400">Pest</span>
                  <span className="text-stone-700 font-medium">{row.ai.predicted_pest}
                    {row.ai.pest_probability != null && (
                      <span className="text-stone-400 ml-1">({fmtP(row.ai.pest_probability)})</span>
                    )}
                  </span>
                </>
              )}
              {row.ai.risk_level && (
                <>
                  <span className="text-stone-400">Risk</span>
                  <Badge text={row.ai.risk_level} colorClass={RISK_COLORS[row.ai.risk_level] || 'bg-stone-100 text-stone-500'} small />
                </>
              )}
              {row.ai.confidence_score != null && (
                <>
                  <span className="text-stone-400">Confidence</span>
                  <span className="text-stone-700">{fmtP(row.ai.confidence_score)}</span>
                </>
              )}
              {(!row.ai.predicted_disease && !row.ai.predicted_pest) && (
                <span className="col-span-2 text-stone-400 italic">No disease/pest predicted</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic"></p>
          )}
        </div>

        {/* Arrow connector */}
        <div className="flex items-center gap-2 text-stone-300 text-xs px-4">
          <div className="flex-1 border-t border-dashed border-stone-200" />
          <span>↓</span>
          <div className="flex-1 border-t border-dashed border-stone-200" />
        </div>

        {/* Layer 2 — Expert decision */}
        <div className={`rounded-xl border p-4 ${
          row.ai_confirmed
            ? 'border-emerald-200 bg-emerald-50/60'
            : row.ai_corrected
            ? 'border-rose-200 bg-rose-50/60'
            : 'border-amber-200 bg-amber-50/60'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon d={P.check} className={`w-4 h-4 ${row.ai_confirmed ? 'text-emerald-600' : row.ai_corrected ? 'text-rose-600' : 'text-amber-600'}`} />
            <span className={`text-xs font-bold uppercase tracking-wide ${row.ai_confirmed ? 'text-emerald-700' : row.ai_corrected ? 'text-rose-700' : 'text-amber-700'}`}>
              Layer 2 · Expert Decision
            </span>
            <span className="ml-auto text-xs text-stone-400">by {row.expert?.expert_name || 'Expert'}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <span className="text-stone-400">Result</span>
            <Badge
              text={cfg.label || row.expert?.validation_result}
              colorClass={cfg.colorClass || 'bg-stone-100 text-stone-500'}
              small
            />
            {row.ai_corrected && row.expert?.corrected_disease && (
              <>
                <span className="text-stone-400">Corrected Disease</span>
                <span className="text-rose-700 font-medium">{row.expert.corrected_disease}</span>
              </>
            )}
            {row.ai_corrected && row.expert?.corrected_pest && (
              <>
                <span className="text-stone-400">Corrected Pest</span>
                <span className="text-rose-700 font-medium">{row.expert.corrected_pest}</span>
              </>
            )}
            {row.expert?.comments && (
              <>
                <span className="text-stone-400 self-start">Comments</span>
                <span className="text-stone-600">{row.expert.comments}</span>
              </>
            )}
          </div>
        </div>

        {/* Arrow connector */}
        {row.expert?.treatment_recommendation && (
          <>
            <div className="flex items-center gap-2 text-stone-300 text-xs px-4">
              <div className="flex-1 border-t border-dashed border-stone-200" />
              <span>↓</span>
              <div className="flex-1 border-t border-dashed border-stone-200" />
            </div>

            {/* Layer 3 — Expert advice */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon d={P.steth} className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  Layer 3 · Expert Advice / Treatment
                </span>
              </div>
              <p className="text-xs text-teal-900 leading-relaxed">{row.expert.treatment_recommendation}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Case detail panel (reused from CaseMonitor logic) ───────────────────────
function CaseDetailPanel({ caseId, onClose }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true); setError(null); setDetail(null);
    getOfficialCaseDetail(caseId)
      .then(setDetail)
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load case.'))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const STATUS_COLORS_FULL = {
    open:'bg-sky-100 text-sky-700', pending_expert:'bg-amber-100 text-amber-700',
    validated:'bg-violet-100 text-violet-700', resolved:'bg-emerald-100 text-emerald-700',
    closed:'bg-stone-100 text-stone-500',
  };

  return (
    <>
      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        id="valmon-case-panel"
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.22s ease-out' }}
      >
        <style>{`@keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
          <h3 className="font-bold text-stone-800">
            {loading ? 'Loading…' : detail ? `Case #${detail.case_id} — Full Detail` : 'Case Detail'}
          </h3>
          <button id="valmon-case-panel-close" onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100">
            <Icon d={P.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && <div className="space-y-3 pt-4">{Array.from({length:5}).map((_,i)=>(<div key={i} className="h-5 bg-stone-100 rounded animate-pulse" style={{width:`${70-i*10}%`}}/>))}</div>}
          {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">{error}</div>}
          {detail && !loading && (
            <>
              <div>
                <h4 className="text-lg font-bold text-stone-800">{detail.title}</h4>
                {detail.description && <p className="text-sm text-stone-500 mt-1">{detail.description}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge text={detail.status?.replace('_',' ')} colorClass={STATUS_COLORS_FULL[detail.status]||'bg-stone-100 text-stone-500'} />
                  {detail.crop_type && <Badge text={detail.crop_type} colorClass="bg-emerald-100 text-emerald-700" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Farmer',detail.farmer_name||`#${detail.farmer_id}`],['Farm',detail.farm_name||'—'],['Village',detail.village||'—'],['District',detail.district||'—'],['State',detail.state||'—'],['Crop Variety',detail.crop_variety||'—'],['Growth Stage',detail.growth_stage||'—'],['Created',fmtFull(detail.created_at)]].map(([l,v])=>(
                  <div key={l} className="bg-stone-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">{l}</p>
                    <p className="text-sm font-medium text-stone-700 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {/* Observations with full chain */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Observations & AI → Expert Chain ({detail.observations.length})</h5>
                {detail.observations.map(obs => (
                  <div key={obs.id} className="border border-stone-200 rounded-xl mb-3 overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <a href={obs.image_url} target="_blank" rel="noreferrer">
                        <img src={obs.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-stone-200 hover:opacity-80 transition-opacity shrink-0" onError={e=>{e.target.style.display='none'}} />
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-stone-400">Obs #{obs.id}</span>
                          <Badge text={obs.status} colorClass="bg-sky-100 text-sky-700" small />
                          {obs.risk_level && <Badge text={obs.risk_level} colorClass={RISK_COLORS[obs.risk_level]||'bg-stone-100 text-stone-500'} small />}
                        </div>
                        <p className="text-xs text-stone-400">{fmtFull(obs.observed_at)}</p>
                        {/* AI layer inline */}
                        {(obs.predicted_disease || obs.predicted_pest) && (
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="text-indigo-600 font-semibold">AI Prediction</p>
                            {obs.predicted_disease && <p className="text-stone-600"><span className="text-stone-400">Disease: </span>{obs.predicted_disease}{obs.disease_probability!=null&&<span className="text-stone-400 ml-1">({fmtP(obs.disease_probability)})</span>}</p>}
                            {obs.predicted_pest && <p className="text-stone-600"><span className="text-stone-400">Pest: </span>{obs.predicted_pest}{obs.pest_probability!=null&&<span className="text-stone-400 ml-1">({fmtP(obs.pest_probability)})</span>}</p>}
                            {obs.confidence_score!=null && <p className="text-stone-400">Confidence: {fmtP(obs.confidence_score)}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {detail.observations.length === 0 && <p className="text-sm text-stone-400 italic">No observations.</p>}
              </div>

              {/* Expert validations */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Expert Validations ({detail.validations.length})</h5>
                {detail.validations.map(v => (
                  <div key={v.id} className="border border-stone-200 rounded-xl p-4 mb-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-700">{v.expert_name || 'Expert'}</span>
                      <Badge text={v.validation_result?.replace('_',' ')} colorClass={RESULT_CONFIG[v.validation_result]?.colorClass||'bg-stone-100 text-stone-500'} small />
                      <span className="ml-auto text-xs text-stone-400">{fmtFull(v.created_at)}</span>
                    </div>
                    {(v.corrected_disease||v.corrected_pest) && (
                      <div className="text-xs space-y-0.5">
                        {v.corrected_disease && <p><span className="text-stone-400">Corrected Disease: </span><span className="text-rose-700 font-medium">{v.corrected_disease}</span></p>}
                        {v.corrected_pest    && <p><span className="text-stone-400">Corrected Pest: </span><span className="text-rose-700 font-medium">{v.corrected_pest}</span></p>}
                      </div>
                    )}
                    {v.comments && <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">{v.comments}</p>}
                    {v.treatment_recommendation && (
                      <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-teal-600 font-semibold mb-0.5">Treatment Recommendation</p>
                        <p className="text-xs text-teal-900">{v.treatment_recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
                {detail.validations.length === 0 && <p className="text-sm text-stone-400 italic">No expert validations yet.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function OfficialValidationMonitor() {
  const [filters, setFilters]           = useState({});
  const [data, setData]                 = useState({ stats: null, validations: [], total: 0 });
  const [skip, setSkip]                 = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const LIMIT = 20;

  const fetchData = useCallback(async (activeFilters, currentSkip) => {
    setLoading(true); setError(null);
    try {
      const result = await getOfficialValidations({ ...activeFilters, skip: currentSkip, limit: LIMIT });
      setData(result);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load validation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const debounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSkip(0);
      fetchData(filters, 0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchData]);

  const handleFilterChange = (name, val) =>
    setFilters(prev => ({ ...prev, [name]: val || undefined }));

  const handleStatsFilter = (val) => {
    setFilters(prev => ({ ...prev, validation_result: val || undefined }));
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <ValidationStatsBar
        stats={data.stats}
        loading={loading}
        onFilter={handleStatsFilter}
        activeFilter={filters.validation_result}
      />

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Results header */}
      <div className="flex items-center gap-2">
        <Icon d={P.check} className="w-4 h-4 text-emerald-700" />
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
          Expert Validations
        </span>
        <span className="ml-auto text-xs text-stone-400">
          {data.total} {data.total === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data.validations.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm bg-white border border-stone-200 rounded-2xl">
          No expert validations found matching the current filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.validations.map(row => (
            <ChainCard
              key={`${row.case_id}-${row.expert?.id}`}
              row={row}
              onOpenCase={setSelectedCaseId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.total > LIMIT && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-stone-400">
            Showing {skip + 1}–{Math.min(skip + LIMIT, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={skip === 0}
              onClick={() => { const ns=Math.max(0,skip-LIMIT); setSkip(ns); fetchData(filters,ns); }}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >← Prev</button>
            <button
              disabled={skip + LIMIT >= data.total}
              onClick={() => { const ns=skip+LIMIT; setSkip(ns); fetchData(filters,ns); }}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >Next →</button>
          </div>
        </div>
      )}

      {/* Case detail panel */}
      {selectedCaseId && (
        <CaseDetailPanel caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
      )}
    </div>
  );
}
