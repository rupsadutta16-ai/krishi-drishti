import React, { useState, useEffect } from 'react';
import {
  X, Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Upload, Camera, FileText, Image as ImageIcon, MapPin, Wheat
} from 'lucide-react';
import { getFarms } from '../api/farms';
import { getCrops } from '../api/crops';
import { createObservation, runAIAnalysis } from '../api/observations';

export default function CropHealthModal({ isOpen, onClose }) {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // States for API flow
  const [creatingObs, setCreatingObs] = useState(false);
  const [createdObservation, setCreatedObservation] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [farmsRes, cropsRes] = await Promise.allSettled([getFarms(), getCrops()]);
          if (farmsRes.status === 'fulfilled' && farmsRes.value?.length > 0) {
            setFarms(farmsRes.value);
            setSelectedFarmId(farmsRes.value[0].id.toString());
          }
          if (cropsRes.status === 'fulfilled' && cropsRes.value?.length > 0) {
            setCrops(cropsRes.value);
            setSelectedCropId(cropsRes.value[0].id.toString());
          }
        } catch (err) {
          console.error('Error loading farms/crops for observation:', err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setCreatedObservation(null);
      setAiAnalysisResult(null);
      setErrorMsg('');
    }
  };

  const handleCreateObservation = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please upload an image of your crop first.');
      return;
    }
    if (!selectedFarmId || !selectedCropId) {
      setErrorMsg('Please select both a registered Farm and Crop.');
      return;
    }

    setErrorMsg('');
    setCreatingObs(true);
    try {
      const formData = new FormData();
      formData.append('farm_id', selectedFarmId);
      formData.append('crop_id', selectedCropId);
      formData.append('file', selectedFile);

      const observation = await createObservation(formData);
      setCreatedObservation(observation);
    } catch (err) {
      console.error('Error creating observation:', err);
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to create observation on server.');
    } finally {
      setCreatingObs(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!createdObservation) return;
    setErrorMsg('');
    setAnalyzing(true);
    try {
      const selectedCropObj = crops.find((c) => c.id.toString() === selectedCropId);
      const payload = {
        context: {
          crop: selectedCropObj ? { crop_type: selectedCropObj.crop_type, variety: selectedCropObj.variety } : null,
        },
        model_version: 'v1.0.0',
      };

      const result = await runAIAnalysis(createdObservation.id, payload);
      setAiAnalysisResult(result);
    } catch (err) {
      console.error('Error running AI analysis:', err);
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to execute AI analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetModalState = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setCreatedObservation(null);
    setAiAnalysisResult(null);
    setErrorMsg('');
  };

  const selectedCropObj = crops.find((c) => c.id.toString() === selectedCropId);

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
                <span>Record Crop Observation & AI Health Analysis</span>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 rounded border border-cyan-500/40">
                  AI Active
                </span>
              </h3>
              <p className="text-xs text-stone-300">Upload crop image, save observation record & run neural pathology scan</p>
            </div>
          </div>
          <button
            onClick={() => { resetModalState(); onClose(); }}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-xs text-red-900 font-medium flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Farm & Crop Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                <span>Select Farm Plot</span>
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {farms.length === 0 ? (
                  <option value="1">Farm Plot #1</option>
                ) : (
                  farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} (#{f.id})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Wheat className="h-3.5 w-3.5 text-emerald-700" />
                <span>Select Crop Cycle</span>
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {crops.length === 0 ? (
                  <option value="1">Wheat (Crop #1)</option>
                ) : (
                  crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.crop_type} ({c.growth_stage || 'Sowing'})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Upload Crop Image Area */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Upload Crop Image for Observation
            </label>

            <div className="border-2 border-dashed border-emerald-800/30 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-6 text-center transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {filePreview ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 z-20 relative">
                  <img
                    src={filePreview}
                    alt="Crop preview"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-700 shadow-md"
                  />
                  <div className="text-left space-y-1">
                    <p className="text-xs font-bold text-emerald-950 flex items-center space-x-1">
                      <ImageIcon className="h-4 w-4 text-emerald-700" />
                      <span>{selectedFile?.name}</span>
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Size: {(selectedFile?.size / 1024).toFixed(1)} KB • Image ready for observation submission
                    </p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-emerald-800 text-white rounded">
                      Click box to change photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    Click to browse or drag crop photo here
                  </h4>
                  <p className="text-xs text-stone-500">
                    Supports JPG, PNG, WEBP high-resolution field photos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Step 1: Create Observation API Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-stone-200 rounded-xl shadow-xs">
            <div>
              <p className="text-xs font-extrabold text-stone-800">
                Step 1: Save Observation Record
              </p>
              <p className="text-[11px] text-stone-500">
                Submits photo & plot telemetry to <code className="font-mono text-emerald-800 bg-stone-100 px-1 rounded">POST /farmer/observations</code>
              </p>
            </div>

            {createdObservation ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>Observed #{createdObservation.id}</span>
              </div>
            ) : (
              <button
                onClick={handleCreateObservation}
                disabled={creatingObs || !selectedFile}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                {creatingObs ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creating Observation...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Create Observation</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action Step 2: Trigger AI Analysis API Button */}
          {createdObservation && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-950 text-white border border-cyan-500/40 rounded-xl shadow-md">
              <div>
                <p className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Step 2: Run AI Pathology Analysis</span>
                </p>
                <p className="text-[11px] text-stone-300">
                  Triggers AI neural scan on <code className="font-mono text-cyan-300 bg-emerald-900 px-1 rounded">POST /farmer/observations/{createdObservation.id}/analyze</code>
                </p>
              </div>

              <button
                onClick={handleRunAIAnalysis}
                disabled={analyzing}
                className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-stone-500 text-stone-950 font-black text-xs rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-stone-950" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4 text-stone-950" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Analyzing Progress Banner */}
          {analyzing && (
            <div className="bg-emerald-950 p-4 rounded-xl border border-cyan-500/50 text-white text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-cyan-400 font-bold text-xs">
                <Cpu className="h-4 w-4 animate-pulse" />
                <span>Executing Multi-Spectral Disease & Pest Classification</span>
              </div>
              <div className="w-full bg-emerald-900 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full animate-pulse w-4/5"></div>
              </div>
            </div>
          )}

          {/* AI Analysis Results Display */}
          {aiAnalysisResult && !analyzing && (
            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Observation #{aiAnalysisResult.observation_id} • AI Analysis #{aiAnalysisResult.id}
                  </span>
                  <h4 className="text-base font-bold text-emerald-950 mt-0.5">
                    {aiAnalysisResult.predicted_disease || 'Healthy Crop (No Disease Detected)'}
                  </h4>
                  {aiAnalysisResult.predicted_pest && (
                    <p className="text-xs text-amber-700 font-medium">Pest Signal: {aiAnalysisResult.predicted_pest}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border uppercase ${
                    aiAnalysisResult.risk_level === 'HIGH' || aiAnalysisResult.risk_level === 'CRITICAL'
                      ? 'bg-red-100 text-red-900 border-red-300'
                      : aiAnalysisResult.risk_level === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {aiAnalysisResult.risk_level || 'LOW'} Risk
                  </span>
                  <p className="text-[10px] font-bold text-cyan-700 mt-1">
                    Confidence: {(aiAnalysisResult.confidence_score ? aiAnalysisResult.confidence_score * 100 : 95).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-500 font-medium">Disease Probability:</span>
                  <p className="font-bold text-stone-800">
                    {aiAnalysisResult.disease_probability ? (aiAnalysisResult.disease_probability * 100).toFixed(1) + '%' : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Model Pipeline Version:</span>
                  <p className="font-mono text-emerald-800 font-bold">{aiAnalysisResult.model_version || 'v1.0.0'}</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-800 space-y-2">
                <h5 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                  <span>Recommended Agronomic Action Plan:</span>
                </h5>
                <ul className="space-y-1 pl-4 list-disc text-xs text-emerald-900 font-medium">
                  <li>Apply targeted fungicide or systemic bio-agent during early morning low-wind hours.</li>
                  <li>Monitor field moisture levels and avoid over-irrigation around crop root zone.</li>
                  <li>Re-scan crop health in 7-10 days to monitor recovery index.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between">
          
          <button
            onClick={() => { resetModalState(); onClose(); }}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
}
