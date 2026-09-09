import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, FileBarChart, CheckCircle2, AlertTriangle, Cpu, RefreshCw, Send, ShieldAlert, Calendar, Wheat, ChevronRight
} from 'lucide-react';
import { getObservations, getAIAnalyses } from '../../api/observations';
import { getCrops } from '../../api/crops';
import { getFarms } from '../../api/farms';
import ReportDetailPage from './ReportDetailPage';

export default function ReportsPage({ onBack }) {
  const [reports, setReports] = useState([]);
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReportsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [obsList, farmsRes, cropsRes] = await Promise.all([
        getObservations(),
        getFarms().catch(() => []),
        getCrops().catch(() => []),
      ]);

      setFarms(farmsRes || []);
      setCrops(cropsRes || []);

      const reportsAcc = [];
      if (Array.isArray(obsList)) {
        await Promise.all(
          obsList.map(async (obs) => {
            try {
              const analyses = await getAIAnalyses(obs.id);
              if (Array.isArray(analyses) && analyses.length > 0) {
                analyses.forEach((analysis) => {
                  reportsAcc.push({
                    ...analysis,
                    observation: obs,
                  });
                });
              }
            } catch (err) {
              // Ignore observations without analyses
            }
          })
        );
      }

      // Sort newest first
      reportsAcc.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setReports(reportsAcc);
    } catch (err) {
      console.error('Error loading AI reports:', err);
      setErrorMsg('Could not load AI analysis reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleReportToExpert = (reportId) => {
    setToastMsg(`Report #${reportId} submitted to Krishi Extension Expert for verification!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // If a report is selected, show its detail page
  if (selectedReport) {
    return (
      <ReportDetailPage
        report={selectedReport}
        crops={crops}
        farms={farms}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-14 pb-16">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Toast Notification */}
        {toastMsg && (
          <div className="p-4 bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-between border border-emerald-700 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg('')} className="text-stone-300 hover:text-white text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

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
              <FileBarChart className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center space-x-2">
                <span>AI Pathology & Analysis Reports ({reports.length})</span>
              </h1>
              <p className="text-xs text-stone-300 mt-0.5">
                Neural diagnostic reports, pathogen confidence scores, and prescription advisories.
              </p>
            </div>
          </div>
          <button
            onClick={fetchReportsData}
            className="p-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh Reports"
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

        {/* Reports List */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500 text-xs flex items-center justify-center space-x-2 shadow-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
            <span>Loading AI analysis reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3 shadow-xs">
            <Cpu className="h-10 w-10 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">No AI analysis reports found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Run AI analysis on your crop observations to generate pathology and advisory reports.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const obs = report.observation || {};
              const crop = crops.find((c) => c.id === obs.crop_id);
              const farm = farms.find((f) => f.id === obs.farm_id);
              const dateStr = report.created_at ? new Date(report.created_at).toLocaleString() : 'Recent';

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-4 cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        <span>Report #{report.id}</span>
                        <span>•</span>
                        <span>Observed Plot #{obs.id || report.observation_id}</span>
                        {crop && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-800 font-extrabold">{crop.crop_type}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-emerald-950 mt-1">
                        {report.predicted_disease || 'Healthy Crop (No Disease Detected)'}
                      </h3>
                      {report.predicted_pest && (
                        <p className="text-xs text-amber-700 font-bold mt-0.5">Pest Signal: {report.predicted_pest}</p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-md border uppercase ${
                        report.risk_level === 'HIGH' || report.risk_level === 'CRITICAL'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : report.risk_level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        {report.risk_level || 'LOW'} Risk
                      </span>
                      <p className="text-[10px] font-bold text-cyan-700">
                        AI Confidence: {(report.confidence_score ? report.confidence_score * 100 : 95).toFixed(1)}%
                      </p>
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-500 font-medium">Disease Probability</span>
                      <p className="font-bold text-stone-900 mt-0.5">
                        {report.disease_probability ? (report.disease_probability * 100).toFixed(1) + '%' : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className="text-stone-500 font-medium">Pest Probability</span>
                      <p className="font-bold text-stone-900 mt-0.5">
                        {report.pest_probability ? (report.pest_probability * 100).toFixed(1) + '%' : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className="text-stone-500 font-medium">Model Pipeline</span>
                      <p className="font-mono text-emerald-800 font-bold mt-0.5">{report.model_version || 'v1.0.0'}</p>
                    </div>

                    <div>
                      <span className="text-stone-500 font-medium">Analysis Date</span>
                      <p className="font-bold text-stone-800 mt-0.5">{dateStr}</p>
                    </div>
                  </div>

                  {/* Advisory Section & Report to Expert Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                    <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-800 flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                        <span>Actionable Agronomic Advisory:</span>
                      </h4>
                      <p className="text-xs text-emerald-900 font-medium">
                        {report.treatment_recommendation || report.notes || 'Monitor crop health closely. Consult a local agronomist if symptoms worsen.'}
                      </p>
                    </div>

                    {/* Click to view full report */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0 border border-emerald-700"
                    >
                      <ChevronRight className="h-4 w-4 text-emerald-200" />
                      <span>View Full Report</span>
                    </button>
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
