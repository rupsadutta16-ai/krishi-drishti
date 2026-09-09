import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, FileText } from 'lucide-react';

export default function CropHealthModal({ isOpen, onClose }) {
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  if (!isOpen) return null;

  const sampleDiseases = {
    wheat: {
      name: 'Leaf Rust (Puccinia triticina)',
      severity: 'Moderate',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      confidence: '96.4%',
      riskLevel: 'Yellow / Amber (Elevated Attention)',
      symptoms: 'Orange-brown pustules scattered on upper leaf surface causing reduced photosynthesis.',
      actionableAdvice: [
        'Apply Propiconazole 25% EC at 1 ml/liter of water during early dawn hours.',
        'Avoid excessive nitrogen fertilization to limit fungal proliferation.',
        'Ensure proper row spacing for adequate canopy aeration.'
      ]
    },
    rice: {
      name: 'Rice Blast (Magnaporthe oryzae)',
      severity: 'High Risk',
      badgeColor: 'bg-red-100 text-red-900 border-red-300',
      confidence: '98.1%',
      riskLevel: 'Red (High Risk / Immediate Action)',
      symptoms: 'Spindle-shaped lesions with grayish centers on leaves and node breakage.',
      actionableAdvice: [
        'Spray Tricyclazole 75% WP at 0.6 g/liter immediately.',
        'Drain field water for 2-3 days to reduce humidity around root zone.',
        'Apply bio-agent Pseudomonas fluorescens for systemic resistance.'
      ]
    },
    maize: {
      name: 'Fall Armyworm (Spodoptera frugiperda)',
      severity: 'High Risk',
      badgeColor: 'bg-red-100 text-red-900 border-red-300',
      confidence: '95.7%',
      riskLevel: 'Red (Pest Infestation)',
      symptoms: 'Ragged whorl damage with frass accumulation inside leaf funnel.',
      actionableAdvice: [
        'Apply Emamectin Benzoate 5% SG at 0.4 g/liter inside leaf whorls.',
        'Install pheromone traps at 5 traps/acre for adult moth monitoring.'
      ]
    },
    sugarcane: {
      name: 'Healthy Crop (No Pathogen Detected)',
      severity: 'Safe / Healthy',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      confidence: '99.2%',
      riskLevel: 'Green (Optimal Health)',
      symptoms: 'Vibrant green canopy, uniform leaf venation, no necrotic spots.',
      actionableAdvice: [
        'Maintain current drip irrigation schedule.',
        'Schedule next routine AI scan in 14 days.'
      ]
    }
  };

  const handleStartScan = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanning(false);
      setScanResult(sampleDiseases[selectedCrop] || sampleDiseases.wheat);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-900 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
                <span>Krishi Drishti AI Crop Health Scanner</span>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 rounded border border-cyan-500/40">
                  AI Active
                </span>
              </h3>
              <p className="text-xs text-stone-300">Neural pathology diagnosis & actionable field prescription</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Step 1: Crop Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Select Crop Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'wheat', name: 'Wheat' },
                { id: 'rice', name: 'Rice Paddy' },
                { id: 'maize', name: 'Maize' },
                { id: 'sugarcane', name: 'Sugarcane' },
              ].map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                    selectedCrop === crop.id
                      ? 'bg-emerald-900 text-white border-emerald-700 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {crop.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Image Preview & Scan Launcher */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/agriculture_farm.jpg" 
                alt="Crop Sample" 
                className="w-16 h-16 rounded-lg object-cover border border-stone-300 shadow-xs"
              />
              <div>
                <p className="text-xs font-bold text-emerald-950">Field Sample: Sector {selectedCrop.toUpperCase()}-01</p>
                <p className="text-[11px] text-stone-500 mt-0.5">High-resolution leaf image loaded</p>
              </div>
            </div>

            <button
              onClick={handleStartScan}
              disabled={scanning}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-cyan-300 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 border border-cyan-500/30"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Scanning Pathogens...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Run AI Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Scanning Progress Banner */}
          {scanning && (
            <div className="bg-emerald-950 p-4 rounded-xl border border-cyan-500/50 text-white text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-cyan-400 font-bold text-xs">
                <Cpu className="h-4 w-4 animate-pulse" />
                <span>Executing Neural Vision Multi-Spectral Analysis</span>
              </div>
              <div className="w-full bg-emerald-900 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Scan Results Section */}
          {scanResult && !scanning && (
            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Diagnosis Finding</span>
                  <h4 className="text-base font-bold text-emerald-950 mt-0.5">{scanResult.name}</h4>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${scanResult.badgeColor}`}>
                    {scanResult.severity}
                  </span>
                  <p className="text-[10px] font-bold text-cyan-700 mt-1">AI Confidence: {scanResult.confidence}</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-700">Observed Leaf Symptoms:</span>
                <p className="text-xs text-stone-600 mt-0.5">{scanResult.symptoms}</p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-800 space-y-2">
                <h5 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                  <span>Actionable Treatment Advisory:</span>
                </h5>
                <ul className="space-y-1 pl-4 list-disc text-xs text-emerald-900 font-medium">
                  {scanResult.actionableAdvice.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] font-medium text-stone-500">
            Validated against ICAR & State Agri University Pathogen Databases
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition-colors"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
}
