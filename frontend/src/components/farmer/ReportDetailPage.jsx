import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileBarChart,
  Camera,
  MapPin,
  Wheat,
  Calendar,
  CheckCircle2,
  Send,
  Phone,
  Mail,
  User,
  Building2,
  Download,
  X,
  Cpu,
  FlaskConical,
  Leaf,
  RefreshCw,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { getProfile } from '../../api/profile';
import { reportObservationToExpert, getCaseDetail } from '../../api/cases';
import jsPDF from 'jspdf';


const EXPERT_CONTACTS = [
  {
    id: 1,
    name: 'Dr. Ananya Sharma',
    designation: 'Senior Agronomist',
    specialization: 'Plant Pathology & Disease Management',
    phone: '+91-98765-43210',
    email: 'ananya.sharma@krishiexpert.in',
    address: 'Krishi Vigyan Kendra, Pune, Maharashtra 411001',
    rating: 4.9,
    available: true,
  },
  {
    id: 2,
    name: 'Dr. Ramesh Patil',
    designation: 'Extension Officer',
    specialization: 'Integrated Pest Management',
    phone: '+91-94876-12345',
    email: 'ramesh.patil@agridept.mh.gov.in',
    address: 'District Agriculture Office, Nashik, Maharashtra 422001',
    rating: 4.7,
    available: true,
  },
  {
    id: 3,
    name: 'Ms. Priya Kulkarni',
    designation: 'Crop Protection Specialist',
    specialization: 'Organic Farming & Bio-control',
    phone: '+91-88123-67890',
    email: 'priya.kulkarni@icar.org.in',
    address: 'ICAR Research Station, Aurangabad, Maharashtra 431001',
    rating: 4.8,
    available: false,
  },
];

function InfoRow({ label, value, highlight, mono }) {
  return (
    <div>
      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">{label}</p>
      <p className={`text-xs mt-0.5 ${highlight ? 'font-extrabold text-emerald-900' : 'font-semibold text-stone-800'} ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function ProbabilityBar({ label, value, color }) {
  const pct = value ? Math.min(value * 100, 100) : 0;
  const colorMap = {
    red: { bar: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800' },
    amber: { bar: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800' },
  };
  const c = colorMap[color] || colorMap.red;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-600">{label}</span>
        <span className={`text-xs font-extrabold ${c.text}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className={`w-full h-2 rounded-full ${c.bg}`}>
        <div className={`h-2 rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MetricCell({ label, value, accent }) {
  return (
    <div className="text-xs">
      <span className="text-stone-500 font-medium">{label}</span>
      <p className={`font-extrabold mt-0.5 ${accent ? 'text-cyan-700' : 'text-stone-900'}`}>{value}</p>
    </div>
  );
}

export default function ReportDetailPage({ report, crops, farms, onBack }) {
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const reportRef = useRef(null);

  const obs = report?.observation || {};
  const crop = crops?.find((c) => c.id === obs.crop_id);
  const farm = farms?.find((f) => f.id === obs.farm_id);

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : 'Unknown';

  const dateStr = fmt(report?.created_at);
  const obsDate = fmt(obs.created_at);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setFarmerProfile(p);
      } catch {
        setFarmerProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const [submittingToExpert, setSubmittingToExpert] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);

  useEffect(() => {
    if (obs?.case_id) {
      getCaseDetail(obs.case_id)
        .then((res) => setSubmittedCase(res.data))
        .catch(() => {});
    }
  }, [obs?.case_id]);

  const handleReportToExpert = async () => {
    if (!report?.observation_id) {
      showToast('No observation linked to this report.', 'error');
      return;
    }
    setSubmittingToExpert(true);
    try {
      const response = await reportObservationToExpert(report.observation_id);
      setSubmittedCase(response.data);
      showToast('Report submitted to extension expert for review.', 'success');
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to submit report.';
      showToast(message, 'error');
    } finally {
      setSubmittingToExpert(false);
    }
  };

  const loadImageAsBase64 = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (base64) {
          const dimensions = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth || 400, height: img.naturalHeight || 300 });
            img.onerror = () => resolve({ width: 400, height: 300 });
            img.src = base64;
          });
          return { dataUrl: base64, width: dimensions.width, height: dimensions.height };
        }
      }
    } catch {
      // Fallback
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 400;
          canvas.height = img.naturalHeight || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            width: canvas.width,
            height: canvas.height,
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const imgObj = await loadImageAsBase64(obs.image_url);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const ML = 14; // left margin
      const MR = W - 14; // right edge
      const contentW = MR - ML;

      // ── helper utilities ────────────────────────────────────────────────
      const hex = (h) => {
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        return [r, g, b];
      };
      const setFill = (h) => pdf.setFillColor(...hex(h));
      const setDraw = (h) => pdf.setDrawColor(...hex(h));
      const setTxt  = (h) => pdf.setTextColor(...hex(h));

      let y = 0;

      // ── PAGE 1: Header banner ───────────────────────────────────────────
      setFill('#064e3b'); // emerald-950
      pdf.rect(0, 0, W, 38, 'F');

      setTxt('#6ee7b7'); // emerald-300
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`REPORT #${report.id}  •  OBS #${obs.id || report.observation_id}  •  KRISHI DRISHTI AI`, ML, 10);

      setTxt('#ffffff');
      pdf.setFontSize(13);
      pdf.text(
        pdf.splitTextToSize(report.predicted_disease || 'Healthy Crop — No Disease Detected', contentW - 40),
        ML, 18
      );

      if (report.predicted_pest) {
        setTxt('#fcd34d'); // amber-300
        pdf.setFontSize(8);
        pdf.text(`Pest Signal: ${report.predicted_pest}`, ML, 26);
      }

      setTxt('#a8a29e'); // stone-400
      pdf.setFontSize(7);
      pdf.text(`Analysis Date: ${dateStr}`, ML, 33);

      // Risk badge (right)
      const riskLabel = `${report.risk_level || 'LOW'} RISK`;
      const badgeColor = report.risk_level === 'HIGH' || report.risk_level === 'CRITICAL'
        ? '#991b1b' : report.risk_level === 'MEDIUM' ? '#92400e' : '#064e3b';
      setFill(badgeColor);
      pdf.roundedRect(MR - 30, 7, 30, 9, 2, 2, 'F');
      setTxt('#ffffff');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      const bW = pdf.getTextWidth(riskLabel);
      pdf.text(riskLabel, MR - 30 + (30 - bW) / 2, 13);

      setTxt('#67e8f9'); // cyan-300
      pdf.setFontSize(7);
      pdf.text(`AI Confidence: ${(report.confidence_score ? report.confidence_score * 100 : 95).toFixed(1)}%`, MR - 30, 22, { align: 'left' });

      y = 46;

      // ── Section helper ─────────────────────────────────────────────────
      const checkPage = (needed = 12) => {
        if (y + needed > 280) { pdf.addPage(); y = 14; }
      };

      const sectionHeader = (title) => {
        checkPage(14);
        setFill('#f5f5f4'); // stone-100
        setDraw('#e7e5e4');
        pdf.roundedRect(ML, y, contentW, 8, 1.5, 1.5, 'FD');
        setTxt('#14532d'); // emerald-900
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, ML + 3, y + 5.5);
        y += 11;
      };

      const field = (label, value, col = ML, colW = contentW) => {
        if (!value) return;
        checkPage(8);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        setTxt('#78716c'); // stone-500
        pdf.text(label.toUpperCase(), col, y);
        pdf.setFont('helvetica', 'normal');
        setTxt('#1c1917'); // stone-900
        pdf.setFontSize(7.5);
        const lines = pdf.splitTextToSize(String(value), colW - 2);
        pdf.text(lines, col, y + 4);
        y += 4 + lines.length * 4 + 2;
      };

      const twoCol = (items) => {
        const half = Math.ceil(items.length / 2);
        const left = items.slice(0, half);
        const right = items.slice(half);
        const startY = y;
        let leftY = startY;
        let rightY = startY;
        const colW = contentW / 2 - 2;

        left.forEach(({ label, value }) => {
          if (!value) return;
          checkPage(8);
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'bold');
          setTxt('#78716c');
          pdf.text(label.toUpperCase(), ML, leftY);
          pdf.setFont('helvetica', 'normal');
          setTxt('#1c1917');
          pdf.setFontSize(7.5);
          const lines = pdf.splitTextToSize(String(value), colW);
          pdf.text(lines, ML, leftY + 4);
          leftY += 4 + lines.length * 4 + 3;
        });

        right.forEach(({ label, value }) => {
          if (!value) return;
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'bold');
          setTxt('#78716c');
          pdf.text(label.toUpperCase(), ML + colW + 4, rightY);
          pdf.setFont('helvetica', 'normal');
          setTxt('#1c1917');
          pdf.setFontSize(7.5);
          const lines = pdf.splitTextToSize(String(value), colW);
          pdf.text(lines, ML + colW + 4, rightY + 4);
          rightY += 4 + lines.length * 4 + 3;
        });

        y = Math.max(leftY, rightY) + 2;
      };

      // ── Section: Observation ──────────────────────────────────────────
      sectionHeader('FIELD OBSERVATION DETAILS');

      const obsFields = [
        { label: 'Observed On', value: obsDate },
        { label: 'Status', value: obs.status || 'AI_ANALYZED' },
        { label: 'Image Quality Score', value: obs.image_quality_score != null ? `${obs.image_quality_score.toFixed(1)} / 100` : '85.0 / 100' },
        { label: 'Model Pipeline', value: report.model_version || 'KD-AI v1.0.0' },
        obs.latitude && obs.longitude ? { label: 'GPS Coordinates', value: `${obs.latitude.toFixed(5)}°N, ${obs.longitude.toFixed(5)}°E` } : null,
        obs.notes ? { label: 'Field Notes', value: obs.notes } : null,
      ].filter(Boolean);

      if (imgObj && imgObj.dataUrl) {
        checkPage(50);
        const maxImgW = 70; // mm
        const maxImgH = 48; // mm
        const aspect = imgObj.width / imgObj.height;
        let imgW = maxImgW;
        let imgH = imgW / aspect;
        if (imgH > maxImgH) {
          imgH = maxImgH;
          imgW = imgH * aspect;
        }

        // Draw image frame
        setFill('#f5f5f4');
        setDraw('#e7e5e4');
        pdf.roundedRect(ML, y, imgW, imgH, 1.5, 1.5, 'FD');
        try {
          const imgType = imgObj.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(imgObj.dataUrl, imgType, ML, y, imgW, imgH);
        } catch (e) {
          console.warn('Failed to add image to PDF:', e);
        }

        // Right column for fields next to image
        const rightX = ML + maxImgW + 6;
        const rightW = contentW - maxImgW - 6;
        let rightY = y;

        obsFields.forEach(({ label, value }) => {
          if (!value) return;
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'bold');
          setTxt('#78716c');
          pdf.text(label.toUpperCase(), rightX, rightY);
          pdf.setFont('helvetica', 'normal');
          setTxt('#1c1917');
          pdf.setFontSize(7.5);
          const lines = pdf.splitTextToSize(String(value), rightW);
          pdf.text(lines, rightX, rightY + 3.5);
          rightY += 3.5 + lines.length * 3.5 + 2.5;
        });

        y = Math.max(y + imgH + 4, rightY + 2);
      } else {
        twoCol(obsFields);
      }

      // ── Section: Crop ─────────────────────────────────────────────────
      sectionHeader('CROP INFORMATION');
      if (crop) {
        twoCol([
          { label: 'Crop Type', value: crop.crop_type },
          { label: 'Crop ID', value: `#${crop.id}` },
          crop.variety ? { label: 'Variety', value: crop.variety } : null,
          crop.sowing_date ? { label: 'Sowing Date', value: new Date(crop.sowing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } : null,
          crop.harvest_date ? { label: 'Expected Harvest', value: new Date(crop.harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } : null,
          crop.area_hectares ? { label: 'Area (ha)', value: `${crop.area_hectares} ha` } : null,
        ].filter(Boolean));
      } else {
        field('Crop ID', `#${obs.crop_id || 'Unknown'}`);
      }

      // ── Section: Farm ─────────────────────────────────────────────────
      sectionHeader('FARM INFORMATION');
      if (farm) {
        twoCol([
          { label: 'Farm Name', value: farm.farm_name },
          { label: 'Farm ID', value: `#${farm.id}` },
          farm.location ? { label: 'Location', value: farm.location } : null,
          farm.state ? { label: 'State', value: farm.state } : null,
          farm.district ? { label: 'District', value: farm.district } : null,
          farm.total_area_hectares ? { label: 'Total Area', value: `${farm.total_area_hectares} ha` } : null,
          farm.latitude && farm.longitude ? { label: 'Coordinates', value: `${farm.latitude.toFixed(4)}°N, ${farm.longitude.toFixed(4)}°E` } : null,
        ].filter(Boolean));
      } else {
        field('Farm ID', `#${obs.farm_id || 'Unknown'}`);
      }

      // ── Section: Farmer / Account ─────────────────────────────────────
      sectionHeader('FARMER / ACCOUNT DETAILS');
      if (farmerProfile) {
        twoCol([
          { label: 'Full Name', value: farmerProfile.full_name || farmerProfile.username },
          { label: 'Username', value: farmerProfile.username },
          { label: 'Email', value: farmerProfile.email },
          farmerProfile.phone ? { label: 'Phone', value: farmerProfile.phone } : null,
          farmerProfile.state ? { label: 'State', value: farmerProfile.state } : null,
          farmerProfile.district ? { label: 'District', value: farmerProfile.district } : null,
        ].filter(Boolean));
      } else {
        field('Note', 'Farmer profile unavailable.');
      }

      // ── Section: AI Analysis ──────────────────────────────────────────
      sectionHeader('AI PATHOLOGY ANALYSIS');

      // Probability bars
      const drawBar = (label, value, barHex, bgHex) => {
        checkPage(14);
        const pct = value ? Math.min(value * 100, 100) : 0;
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        setTxt('#44403c');
        pdf.text(label, ML, y);
        setTxt('#1c1917');
        const pctTxt = `${pct.toFixed(1)}%`;
        pdf.text(pctTxt, MR, y, { align: 'right' });
        y += 3;
        setFill(bgHex);
        pdf.roundedRect(ML, y, contentW, 3.5, 1, 1, 'F');
        setFill(barHex);
        pdf.roundedRect(ML, y, contentW * pct / 100, 3.5, 1, 1, 'F');
        y += 7;
      };

      drawBar('Disease Probability', report.disease_probability, '#ef4444', '#fee2e2');
      drawBar('Pest Probability', report.pest_probability, '#f59e0b', '#fef3c7');

      // Metrics grid
      checkPage(14);
      setFill('#f5f5f4');
      setDraw('#e7e5e4');
      pdf.roundedRect(ML, y, contentW, 14, 1.5, 1.5, 'FD');
      const metrics = [
        { label: 'Disease Prob.', value: report.disease_probability ? `${(report.disease_probability * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Pest Prob.', value: report.pest_probability ? `${(report.pest_probability * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Confidence', value: `${(report.confidence_score ? report.confidence_score * 100 : 95).toFixed(1)}%` },
        { label: 'Risk Level', value: report.risk_level || 'LOW' },
      ];
      metrics.forEach((m, i) => {
        const cellX = ML + (contentW / 4) * i;
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        setTxt('#78716c');
        pdf.text(m.label.toUpperCase(), cellX + 2, y + 5);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        setTxt('#0e7490'); // cyan-700
        pdf.text(m.value, cellX + 2, y + 11);
      });
      y += 18;

      // Advisory box
      const advText = report.treatment_recommendation || report.notes ||
        'Monitor crop health closely. Consult a local agronomist if symptoms worsen. Ensure adequate water and nutrient management.';
      checkPage(20);
      setFill('#f0fdf4');
      setDraw('#166534');
      pdf.setLineWidth(0.8);
      const advLines = pdf.splitTextToSize(advText, contentW - 8);
      const advH = advLines.length * 4.5 + 10;
      pdf.roundedRect(ML, y, contentW, advH, 1.5, 1.5, 'FD');
      pdf.setLineWidth(0.2);
      setFill('#166534');
      pdf.rect(ML, y, 1.5, advH, 'F');
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      setTxt('#14532d');
      pdf.text('Actionable Agronomic Advisory', ML + 5, y + 6);
      pdf.setFont('helvetica', 'normal');
      setTxt('#166534');
      pdf.setFontSize(7);
      pdf.text(advLines, ML + 5, y + 11);
      y += advH + 6;

      // ── Footer on every page ──────────────────────────────────────────
      const totalPages = pdf.internal.pages.length - 1;
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        setFill('#064e3b');
        pdf.rect(0, 287, W, 10, 'F');
        setTxt('#6ee7b7');
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Krishi Drishti — AI-Powered Crop Health Monitoring', ML, 293);
        pdf.text(`Page ${p} of ${totalPages}  |  Generated: ${new Date().toLocaleString('en-IN')}`, MR, 293, { align: 'right' });
      }

      pdf.save(`KrishiDrishti_Report_${report.id}_${crop?.crop_type || 'Crop'}.pdf`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const riskColor =
    report?.risk_level === 'HIGH' || report?.risk_level === 'CRITICAL'
      ? { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', dot: 'bg-red-500' }
      : report?.risk_level === 'MEDIUM'
      ? { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-500' }
      : { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', dot: 'bg-emerald-500' };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">

      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center space-x-2 border ${
            toastType === 'error'
              ? 'bg-red-900 border-red-700'
              : 'bg-emerald-900 border-emerald-700'
          }`}
        >
          {toastType === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-300 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="ml-2 text-stone-300 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Expert Contact Modal */}
      {expertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-950 rounded-t-2xl p-5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
                  <Phone className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Krishi Expert Contacts</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Verified agronomists & extension officers</p>
                </div>
              </div>
              <button
                onClick={() => setExpertModalOpen(false)}
                className="p-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {EXPERT_CONTACTS.map((expert) => (
                <div key={expert.id} className="border border-stone-200 rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-stone-900">{expert.name}</h3>
                        <p className="text-xs text-emerald-800 font-bold">{expert.designation}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">{expert.specialization}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${expert.available ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-500 border-stone-300'}`}>
                        {expert.available ? '● Available' : '○ Busy'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-stone-700">{expert.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-stone-700">
                      <Phone className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                      <a href={`tel:${expert.phone}`} className="font-bold hover:text-emerald-700 transition-colors">{expert.phone}</a>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-stone-700">
                      <Mail className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                      <a href={`mailto:${expert.email}`} className="font-medium hover:text-emerald-700 transition-colors truncate">{expert.email}</a>
                    </div>
                    <div className="flex items-start space-x-2 text-xs text-stone-700">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{expert.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setExpertModalOpen(false)}
                className="w-full py-3 bg-emerald-950 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Nav row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-sm font-bold text-emerald-800 hover:text-emerald-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Reports</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer border border-stone-700"
          >
            {downloadingPdf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-stone-300" />}
            <span>{downloadingPdf ? 'Generating PDF…' : 'Download Report PDF'}</span>
          </button>
        </div>

        {/* Printable area */}
        <div ref={reportRef} className="space-y-5">

          {/* Header banner */}
          <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700 flex-shrink-0">
                  <FileBarChart className="h-7 w-7 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    <span>Report #{report.id}</span><span>•</span>
                    <span>Obs #{obs.id || report.observation_id}</span><span>•</span>
                    <span>Krishi Drishti AI</span>
                  </div>
                  <h1 className="text-xl font-extrabold tracking-tight">
                    {report.predicted_disease || 'Healthy Crop — No Disease Detected'}
                  </h1>
                  {report.predicted_pest && (
                    <p className="text-xs text-amber-300 font-bold mt-0.5">Pest Signal: {report.predicted_pest}</p>
                  )}
                  <p className="text-[11px] text-stone-400 mt-1">Analysis: {dateStr}</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3">
                <span className={`px-3 py-1.5 text-xs font-extrabold rounded-xl uppercase border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${riskColor.dot} mr-1.5`} />
                  {report.risk_level || 'LOW'} Risk
                </span>
                <p className="text-xs font-bold text-cyan-300">
                  AI Confidence: {(report.confidence_score ? report.confidence_score * 100 : 95).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Observation image + meta */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center space-x-2">
              <Camera className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-stone-900">Field Observation Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="space-y-3">
                {obs.image_url ? (
                  <img
                    src={obs.image_url}
                    alt="Crop observation"
                    className="w-full h-64 object-cover rounded-xl border border-stone-200 shadow-sm"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-64 rounded-xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center text-stone-400 space-y-2">
                    <Camera className="h-10 w-10" />
                    <span className="text-xs font-medium">No image available</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wide">Quality Score</p>
                    <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                      {obs.image_quality_score != null ? obs.image_quality_score.toFixed(1) : '85.0'} / 100
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wide">Status</p>
                    <p className="text-sm font-extrabold text-emerald-800 mt-0.5 truncate">{obs.status || 'AI_ANALYZED'}</p>
                  </div>
                </div>
              </div>
              {/* Meta */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1">
                    <Calendar className="h-3.5 w-3.5" /><span>Observed On</span>
                  </div>
                  <p className="text-sm font-bold text-stone-800">{obsDate}</p>
                </div>
                {obs.latitude && obs.longitude && (
                  <div>
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1">
                      <MapPin className="h-3.5 w-3.5" /><span>GPS Coordinates</span>
                    </div>
                    <p className="text-sm font-mono font-bold text-stone-800">
                      {obs.latitude.toFixed(5)}°N, {obs.longitude.toFixed(5)}°E
                    </p>
                  </div>
                )}
                {obs.notes && (
                  <div>
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1">
                      <Leaf className="h-3.5 w-3.5" /><span>Field Notes</span>
                    </div>
                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100">{obs.notes}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1">
                    <FlaskConical className="h-3.5 w-3.5" /><span>Model Pipeline</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-emerald-800">{report.model_version || 'KD-AI v1.0.0'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Crop & Farm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center space-x-2">
                <Wheat className="h-4 w-4 text-emerald-700" />
                <h2 className="text-sm font-extrabold text-stone-900">Crop Information</h2>
              </div>
              <div className="p-5 space-y-3">
                {crop ? (
                  <>
                    <InfoRow label="Crop Type" value={crop.crop_type} highlight />
                    <InfoRow label="Crop ID" value={`#${crop.id}`} />
                    {crop.variety && <InfoRow label="Variety" value={crop.variety} />}
                    {crop.sowing_date && <InfoRow label="Sowing Date" value={new Date(crop.sowing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />}
                    {crop.harvest_date && <InfoRow label="Expected Harvest" value={new Date(crop.harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />}
                    {crop.area_hectares && <InfoRow label="Area" value={`${crop.area_hectares} ha`} />}
                  </>
                ) : (
                  <p className="text-xs text-stone-500 font-semibold">Crop #{obs.crop_id || 'Unknown'}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                <h2 className="text-sm font-extrabold text-stone-900">Farm Information</h2>
              </div>
              <div className="p-5 space-y-3">
                {farm ? (
                  <>
                    <InfoRow label="Farm Name" value={farm.farm_name} highlight />
                    <InfoRow label="Farm ID" value={`#${farm.id}`} />
                    {farm.location && <InfoRow label="Location" value={farm.location} />}
                    {farm.state && <InfoRow label="State" value={farm.state} />}
                    {farm.district && <InfoRow label="District" value={farm.district} />}
                    {farm.total_area_hectares && <InfoRow label="Total Area" value={`${farm.total_area_hectares} ha`} />}
                    {farm.latitude && farm.longitude && <InfoRow label="Coordinates" value={`${farm.latitude.toFixed(4)}°N, ${farm.longitude.toFixed(4)}°E`} mono />}
                  </>
                ) : (
                  <p className="text-xs text-stone-500 font-semibold">Farm #{obs.farm_id || 'Unknown'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Farmer profile */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center space-x-2">
              <User className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-stone-900">Farmer / Account Details</h2>
            </div>
            <div className="p-5">
              {loadingProfile ? (
                <div className="flex items-center space-x-2 text-xs text-stone-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
                  <span>Loading profile…</span>
                </div>
              ) : farmerProfile ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoRow label="Full Name" value={farmerProfile.full_name || farmerProfile.username || '—'} highlight />
                  <InfoRow label="Username" value={farmerProfile.username || '—'} />
                  <InfoRow label="Email" value={farmerProfile.email || '—'} />
                  {farmerProfile.phone && <InfoRow label="Phone" value={farmerProfile.phone} />}
                  {farmerProfile.state && <InfoRow label="State" value={farmerProfile.state} />}
                  {farmerProfile.district && <InfoRow label="District" value={farmerProfile.district} />}
                </div>
              ) : (
                <p className="text-xs text-stone-500">Farmer profile unavailable.</p>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-cyan-700" />
              <h2 className="text-sm font-extrabold text-stone-900">AI Pathology Analysis</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProbabilityBar label="Disease Probability" value={report.disease_probability} color="red" />
                <ProbabilityBar label="Pest Probability" value={report.pest_probability} color="amber" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                <MetricCell label="Disease Prob." value={report.disease_probability ? (report.disease_probability * 100).toFixed(1) + '%' : 'N/A'} />
                <MetricCell label="Pest Prob." value={report.pest_probability ? (report.pest_probability * 100).toFixed(1) + '%' : 'N/A'} />
                <MetricCell label="Confidence" value={(report.confidence_score ? report.confidence_score * 100 : 95).toFixed(1) + '%'} accent />
                <MetricCell label="Risk Level" value={report.risk_level || 'LOW'} />
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-800 space-y-1.5">
                <h4 className="text-xs font-extrabold text-emerald-950 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                  <span>Actionable Agronomic Advisory</span>
                </h4>
                <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                  {report.treatment_recommendation || report.notes ||
                    'Monitor crop health closely. Consult a local agronomist if symptoms worsen. Ensure adequate water and nutrient management.'}
                </p>
              </div>
            </div>
          </div>

        </div>
        {/* End printable */}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleReportToExpert}
            disabled={
              submittingToExpert ||
              report?.observation?.status?.toLowerCase() === 'pending_expert' ||
              report?.observation?.status?.toLowerCase() === 'validated' ||
              submittedCase?.status === 'pending_expert' ||
              submittedCase?.status === 'validated'
            }
            className="flex-1 flex items-center justify-center space-x-2 px-5 py-3.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer border border-amber-700"
          >
            <Send className="h-4 w-4 text-amber-200" />
            <span>
              {submittingToExpert
                ? 'Submitting...'
                : (report?.observation?.status?.toLowerCase() === 'pending_expert' || submittedCase?.status === 'pending_expert')
                ? 'Awaiting Expert Review'
                : (report?.observation?.status?.toLowerCase() === 'validated' || submittedCase?.status === 'validated')
                ? 'Expert Validated ✓'
                : 'Submit Report to Extension Expert'}
            </span>
          </button>
          <button
            onClick={() => setExpertModalOpen(true)}
            className="flex-1 flex items-center justify-center space-x-2 px-5 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer border border-emerald-700"
          >
            <Phone className="h-4 w-4 text-emerald-200" />
            <span>View Expert Contact Details</span>
          </button>
        </div>

        {/* Expert validation card */}
        {submittedCase?.validations?.length > 0 && (
          <div className="mt-6 p-4 rounded-xl border border-green-200 bg-green-50">
            <h3 className="font-semibold text-green-800 mb-2">
              Expert Validation & Extension Advice
            </h3>
            {submittedCase.validations.map((v) => (
              <div key={v.id} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-green-700">
                    Verdict: {v.validation_result?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {v.corrected_disease && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Corrected Disease:</span> {v.corrected_disease}
                  </p>
                )}
                {v.corrected_pest && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Corrected Pest:</span> {v.corrected_pest}
                  </p>
                )}
                {v.comments && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Expert Comments:</span> {v.comments}
                  </p>
                )}
                {v.treatment_recommendation && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-green-100">
                    <p className="text-sm font-semibold text-green-800">IPM Recommendation:</p>
                    <p className="text-sm text-gray-700">{v.treatment_recommendation}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Reviewed by {v.expert_name || `Expert ID ${v.expert_id}`}
                  {v.created_at ? ` · ${new Date(v.created_at).toLocaleDateString()}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
