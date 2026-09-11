import React, { useState, useEffect, useCallback } from 'react';
import { User, Edit, ShieldCheck } from 'lucide-react';
import { getOfficialDashboardOverview } from '../../api/official';
import { logoutUser } from '../../api/auth';
import OfficialCaseMonitor from './OfficialCaseMonitor';
import OfficialValidationMonitor from './OfficialValidationMonitor';
import OfficialExpertMonitor from './OfficialExpertMonitor';
import OfficialHotspotMonitor from './OfficialHotspotMonitor';
import OfficialTrendAnalysis from './OfficialTrendAnalysis';
import OfficialForecastMonitor from './OfficialForecastMonitor';

// ─── Icon helpers ──────────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  cases:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  disease:  'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  pest:     'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3',
  farmers:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  experts:  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  reports:  'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  validation:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  map:      'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  risk:     'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  trend:    'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  forecast: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  alert:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  govt:     'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  priority: 'M5 3l14 9-14 9V3z',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, iconKey, colorClass, loading }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon d={ICONS[iconKey]} className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 bg-stone-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-stone-800">{value ?? '—'}</p>
        )}
      </div>
    </div>
  );
}

// ─── Section Shell ─────────────────────────────────────────────────────────────
function Section({ title, iconKey, children, badge }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-white">
        <span className="text-emerald-700">
          <Icon d={ICONS[iconKey]} className="w-5 h-5" />
        </span>
        <h2 className="font-semibold text-stone-700 text-sm tracking-wide">{title}</h2>
        {badge !== undefined && (
          <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Placeholder row ───────────────────────────────────────────────────────────
function Placeholder({ text }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-stone-50 border border-dashed border-stone-200">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <span className="text-sm text-stone-500 italic">{text}</span>
    </div>
  );
}

// ─── Risk badge helper ─────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const styles = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[level] || 'bg-stone-100 text-stone-500'}`}>
      {level}
    </span>
  );
}

// ─── Overview Stats Grid ───────────────────────────────────────────────────────
function OverviewGrid({ stats, loading }) {
  const cards = [
    { label: 'Total Cases',        value: stats?.total_cases,          iconKey: 'cases',      colorClass: 'bg-emerald-100 text-emerald-700' },
    { label: 'Open Cases',         value: stats?.open_cases,           iconKey: 'alert',      colorClass: 'bg-sky-100 text-sky-700' },
    { label: 'Pending Expert',     value: stats?.pending_expert_cases, iconKey: 'validation', colorClass: 'bg-amber-100 text-amber-700' },
    { label: 'Validated',          value: stats?.validated_cases,      iconKey: 'validation', colorClass: 'bg-violet-100 text-violet-700' },
    { label: 'Resolved',           value: stats?.resolved_cases,       iconKey: 'cases',      colorClass: 'bg-teal-100 text-teal-700' },
    { label: 'Disease Detections', value: stats?.disease_cases,        iconKey: 'disease',    colorClass: 'bg-rose-100 text-rose-700' },
    { label: 'Pest Detections',    value: stats?.pest_cases,           iconKey: 'pest',       colorClass: 'bg-lime-100 text-lime-700' },
    { label: 'Farmer Reports',     value: stats?.total_observations,   iconKey: 'reports',    colorClass: 'bg-cyan-100 text-cyan-700' },
    { label: 'Expert Validations', value: stats?.total_validations,    iconKey: 'validation', colorClass: 'bg-purple-100 text-purple-700' },
    { label: 'Registered Farmers', value: stats?.total_farmers,        iconKey: 'farmers',    colorClass: 'bg-orange-100 text-orange-700' },
    { label: 'Registered Experts', value: stats?.total_experts,        iconKey: 'experts',    colorClass: 'bg-indigo-100 text-indigo-700' },
    { label: 'High Risk',          value: stats?.high_risk_count,      iconKey: 'risk',       colorClass: 'bg-orange-100 text-orange-700' },
    { label: 'Critical Risk',      value: stats?.critical_risk_count,  iconKey: 'risk',       colorClass: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} loading={loading} />
      ))}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'official-overview-stats', label: 'Overview' },
  { id: 'official-case-monitoring', label: 'Cases' },
  { id: 'official-validation-monitoring', label: 'Validations' },
  { id: 'official-expert-monitoring', label: 'Experts' },
  { id: 'official-hotspot-monitoring', label: 'Hotspots' },
  { id: 'official-trend-analysis', label: 'Trends' },
  { id: 'official-forecast-monitoring', label: 'Forecast' },
];

export default function OfficialDashboard({ currentUser, onLogout, onEditProfile }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [activeSection, setActiveSection] = useState('official-overview-stats');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const data = await getOfficialDashboardOverview();
      setStats(data);
    } catch (err) {
      setStatsError(err?.response?.data?.detail || 'Failed to load statistics.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
          }
        },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
      );

      NAV_SECTIONS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
  };

  const userName = currentUser?.data?.name || currentUser?.name || 'Official';
  const dept = currentUser?.data?.official_profile?.department || null;
  const designation = currentUser?.data?.official_profile?.designation || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-100 font-sans">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-emerald-700"><Icon d={ICONS.govt} className="w-6 h-6" /></span>
            <div>
              <span className="font-bold text-stone-800 text-base">Krishi Drishti</span>
              <span className="ml-2 text-xs bg-emerald-700 text-white px-2 py-0.5 rounded-full font-semibold tracking-wide">GOVT</span>
            </div>
          </div>

          {/* User info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-stone-700">{userName}</span>
              {designation && <span className="text-xs text-stone-400">{designation}</span>}
              {dept && !designation && <span className="text-xs text-stone-400">{dept}</span>}
            </div>

            {onEditProfile && (
              <button
                id="official-edit-profile-nav-btn"
                onClick={onEditProfile}
                className="flex items-center gap-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-stone-200"
              >
                <Edit className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
            )}

            <button
              id="official-logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <Icon d={ICONS.logout} className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Section Navigation ── */}
      <nav className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 scrollbar-hide">
            {NAV_SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  activeSection === id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page heading */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Government Official Dashboard</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Real-time crop health surveillance &amp; agri-intelligence for {dept || 'your district'}.
            </p>
          </div>
          <button
            id="official-refresh-stats-btn"
            onClick={fetchStats}
            disabled={loadingStats}
            className="flex items-center gap-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {statsError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <Icon d={ICONS.risk} className="w-5 h-5 shrink-0" />
            <span>{statsError}</span>
          </div>
        )}

        {/* ── Official Profile Info card ── */}
        {/* ── Official Profile Info card (Expert style banner) ── */}
        {currentUser?.data && (
          <div className="bg-emerald-950 rounded-2xl border border-emerald-800/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm text-white">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-900 flex items-center justify-center shrink-0 border border-emerald-700/60 text-emerald-300">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-100">{currentUser.data.name}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded border border-emerald-700/60">
                    Official
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80">{currentUser.data.email}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-200/90 pt-1">
                  {dept && <span><strong className="text-emerald-400 font-semibold">Dept:</strong> {dept}</span>}
                  {designation && <span><strong className="text-emerald-400 font-semibold">Role:</strong> {designation}</span>}
                  {currentUser.data.official_profile?.district && <span><strong className="text-emerald-400 font-semibold">District:</strong> {currentUser.data.official_profile.district}</span>}
                  {currentUser.data.official_profile?.state && <span><strong className="text-emerald-400 font-semibold">State:</strong> {currentUser.data.official_profile.state}</span>}
                  {(!dept && !designation) && (
                    <span className="text-amber-300 text-xs italic">• Complete your official profile details</span>
                  )}
                </div>
              </div>
            </div>

            {onEditProfile && (
              <div className="shrink-0 sm:ml-auto">
                <button
                  id="official-edit-profile-card-btn"
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-emerald-700/80 shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Overview Statistics ── */}
        <section id="official-overview-stats">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Overview Statistics</h2>
          <OverviewGrid stats={stats} loading={loadingStats} />
        </section>

        {/* ── Case Monitoring Table ── */}
        <section id="official-case-monitoring">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Case Monitoring</h2>
          <OfficialCaseMonitor />
        </section>

        {/* ── Step 3: Farmer Reports & Expert Validation Monitoring ── */}
        <section id="official-validation-monitoring">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Expert Validation Monitoring</h2>
          <p className="text-xs text-stone-400 mb-3">
            AI Prediction &rarr; Expert Validation &rarr; Expert Advice.
            The original AI prediction is always preserved alongside any expert correction.
          </p>
          <OfficialValidationMonitor />
        </section>

        {/* ── Step 4: Expert Profiles & Verification ── */}
        <section id="official-expert-monitoring">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Expert Verification &amp; Directory</h2>
          <OfficialExpertMonitor />
        </section>

        {/* ── Step 4: Geographic Hotspot & Risk Area Monitoring ── */}
        <section id="official-hotspot-monitoring">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Geographic Hotspot &amp; Risk Area Surveillance</h2>
          <OfficialHotspotMonitor />
        </section>

        {/* ── Step 5: Agricultural Trend Analysis ── */}
        <section id="official-trend-analysis">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Trend Analysis</h2>
          <OfficialTrendAnalysis />
        </section>

        {/* ── Step 6: Weather Forecast & Environmental Conditions ── */}
        <section id="official-forecast-monitoring">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Weather Forecast &amp; Environmental Conditions</h2>
          <OfficialForecastMonitor />
        </section>


      </main>
    </div>
  );
}
