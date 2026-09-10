import React, { useState, useEffect } from 'react';
import { X, TestTube, CheckCircle2, AlertTriangle, Info, Sparkles, Sprout, ShieldAlert } from 'lucide-react';
import { saveFarmSoil, fetchFarmSoil, getSoilByFarmId } from '../../api/soil';

export default function AddSoilModal({ isOpen, onClose, farms, selectedFarmId, onSoilSaved }) {
  const [farmId, setFarmId] = useState(selectedFarmId || (farms?.[0]?.id || ''));
  const [sampleNo, setSampleNo] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);

  // Primary parameters
  const [ph, setPh] = useState('6.8');
  const [ec, setEc] = useState('0.75');
  const [oc, setOc] = useState('0.55');
  const [nitrogen, setNitrogen] = useState('240');
  const [phosphorus, setPhosphorus] = useState('18');
  const [potassium, setPotassium] = useState('210');
  const [sulphur, setSulphur] = useState('10');

  // Micronutrients
  const [zinc, setZinc] = useState('0.5');
  const [iron, setIron] = useState('5.0');
  const [copper, setCopper] = useState('0.4');
  const [manganese, setManganese] = useState('2.8');
  const [boron, setBoron] = useState('0.45');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (selectedFarmId) {
      setFarmId(selectedFarmId);
    } else if (farms && farms.length > 0 && !farmId) {
      setFarmId(farms[0].id);
    }
  }, [selectedFarmId, farms]);

  // Load existing soil record if available for chosen farm
  useEffect(() => {
    let isCurrent = true;
    if (farmId) {
      const applyRecord = (existing) => {
        if (!existing) return;
        if (existing.sample_no) setSampleNo(existing.sample_no);
        if (existing.test_date) setTestDate(existing.test_date);
        if (existing.ph != null) setPh(String(existing.ph));
        if (existing.ec != null) setEc(String(existing.ec));
        if (existing.oc != null) setOc(String(existing.oc));
        if (existing.nitrogen != null) setNitrogen(String(existing.nitrogen));
        if (existing.phosphorus != null) setPhosphorus(String(existing.phosphorus));
        if (existing.potassium != null) setPotassium(String(existing.potassium));
        if (existing.sulphur != null) setSulphur(String(existing.sulphur));
        if (existing.zinc != null) setZinc(String(existing.zinc));
        if (existing.iron != null) setIron(String(existing.iron));
        if (existing.copper != null) setCopper(String(existing.copper));
        if (existing.manganese != null) setManganese(String(existing.manganese));
        if (existing.boron != null) setBoron(String(existing.boron));
      };

      const cached = getSoilByFarmId(farmId);
      if (cached) applyRecord(cached);

      fetchFarmSoil(farmId).then((remote) => {
        if (isCurrent && remote) {
          applyRecord(remote);
        }
      });
    }
    return () => { isCurrent = false; };
  }, [farmId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmId) {
      setToast({ type: 'error', message: 'Please select a farm plot.' });
      return;
    }

    setSaving(true);
    try {
      const soilData = {
        sample_no: sampleNo || `SHC-${Date.now().toString().slice(-6)}`,
        test_date: testDate,
        ph: parseFloat(ph) || 7.0,
        ec: parseFloat(ec) || 0.5,
        oc: parseFloat(oc) || 0.5,
        nitrogen: parseFloat(nitrogen) || 280,
        phosphorus: parseFloat(phosphorus) || 15,
        potassium: parseFloat(potassium) || 200,
        sulphur: parseFloat(sulphur) || 10,
        zinc: parseFloat(zinc) || 0.6,
        iron: parseFloat(iron) || 5.0,
        copper: parseFloat(copper) || 0.4,
        manganese: parseFloat(manganese) || 2.5,
        boron: parseFloat(boron) || 0.5,
      };

      const saved = await saveFarmSoil(farmId, soilData);
      setToast({ type: 'success', message: 'Soil Health Card saved in system successfully!' });
      
      setTimeout(() => {
        setSaving(false);
        if (onSoilSaved) onSoilSaved(saved);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error saving soil record:', err);
      setToast({ type: 'error', message: 'Failed to save soil record.' });
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <TestTube className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Soil Health Card Details</h2>
              <p className="text-xs text-stone-400">Record parameters from official Soil Test Report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-emerald-900 hover:bg-emerald-800 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-amber-900">
            <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-extrabold text-[11px] uppercase tracking-wider text-amber-950">
                Rule-Based Analysis Notice
              </p>
              <p className="text-[11px] leading-relaxed font-medium">
                Soil risk predictions utilize a rule-based algorithm (ICAR guidelines) and <strong>may not be 100% accurate</strong>. The AI engine continuously learns and improves predictions based on your input parameters and outcome feedback.
              </p>
            </div>
          </div>

          {toast && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 border ${
              toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              {toast.type === 'error' ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Farm selection & Sample details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px] tracking-wider">
                Select Farm Plot <span className="text-red-500">*</span>
              </label>
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              >
                {farms && farms.length > 0 ? (
                  farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.area_acres || f.total_area_hectares || '—'} ha/acres)
                    </option>
                  ))
                ) : (
                  <option value="">No farms found</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px] tracking-wider">
                Soil Card Sample No.
              </label>
              <input
                type="text"
                value={sampleNo}
                onChange={(e) => setSampleNo(e.target.value)}
                placeholder="e.g. SHC-2025-MH-102"
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px] tracking-wider">
                Testing Date
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Section 1: Chemical & Soil Reaction Properties */}
          <div>
            <h3 className="font-extrabold text-stone-900 text-xs flex items-center space-x-1.5 mb-2">
              <TestTube className="h-4 w-4 text-emerald-700" />
              <span>1. Soil Reaction & Physical Indicators</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-stone-800 text-[11px]">Soil pH</label>
                  <span className="text-[9px] text-stone-400 font-semibold">Normal: 6.0 - 7.5</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="11.0"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="6.8"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-stone-800 text-[11px]">EC (dS/m)</label>
                  <span className="text-[9px] text-stone-400 font-semibold">Normal: &lt; 1.0</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={ec}
                  onChange={(e) => setEc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="0.75"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-stone-800 text-[11px]">Organic Carbon (%)</label>
                  <span className="text-[9px] text-stone-400 font-semibold">Normal: &gt; 0.5%</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="5.0"
                  value={oc}
                  onChange={(e) => setOc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="0.55"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Primary Macronutrients & Sulphur */}
          <div>
            <h3 className="font-extrabold text-stone-900 text-xs flex items-center space-x-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <span>2. Primary & Secondary Nutrients (Macronutrients)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <label className="block font-bold text-stone-800 text-[11px] mb-1">Nitrogen (N)</label>
                <input
                  type="number"
                  step="1"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="240"
                />
                <span className="text-[9px] text-stone-400 block mt-1">kg/ha (280-560)</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <label className="block font-bold text-stone-800 text-[11px] mb-1">Phosphorus (P)</label>
                <input
                  type="number"
                  step="0.5"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="18"
                />
                <span className="text-[9px] text-stone-400 block mt-1">kg/ha (11-25)</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <label className="block font-bold text-stone-800 text-[11px] mb-1">Potassium (K)</label>
                <input
                  type="number"
                  step="1"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="210"
                />
                <span className="text-[9px] text-stone-400 block mt-1">kg/ha (118-280)</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <label className="block font-bold text-stone-800 text-[11px] mb-1">Sulphur (S)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sulphur}
                  onChange={(e) => setSulphur(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-600"
                  placeholder="10"
                />
                <span className="text-[9px] text-stone-400 block mt-1">ppm (10-20)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Essential Micronutrients */}
          <div>
            <h3 className="font-extrabold text-stone-900 text-xs flex items-center space-x-1.5 mb-2">
              <Info className="h-4 w-4 text-emerald-700" />
              <span>3. Essential Micronutrients (ppm)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                <label className="block font-bold text-stone-700 text-[10px]">Zinc (Zn)</label>
                <input
                  type="number"
                  step="0.05"
                  value={zinc}
                  onChange={(e) => setZinc(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-center font-bold text-stone-900 text-xs mt-1"
                />
                <span className="text-[8px] text-stone-400 block mt-0.5">&gt; 0.6 ppm</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                <label className="block font-bold text-stone-700 text-[10px]">Iron (Fe)</label>
                <input
                  type="number"
                  step="0.1"
                  value={iron}
                  onChange={(e) => setIron(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-center font-bold text-stone-900 text-xs mt-1"
                />
                <span className="text-[8px] text-stone-400 block mt-0.5">&gt; 4.5 ppm</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                <label className="block font-bold text-stone-700 text-[10px]">Copper (Cu)</label>
                <input
                  type="number"
                  step="0.05"
                  value={copper}
                  onChange={(e) => setCopper(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-center font-bold text-stone-900 text-xs mt-1"
                />
                <span className="text-[8px] text-stone-400 block mt-0.5">&gt; 0.2 ppm</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                <label className="block font-bold text-stone-700 text-[10px]">Manganese (Mn)</label>
                <input
                  type="number"
                  step="0.1"
                  value={manganese}
                  onChange={(e) => setManganese(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-center font-bold text-stone-900 text-xs mt-1"
                />
                <span className="text-[8px] text-stone-400 block mt-0.5">&gt; 2.0 ppm</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center col-span-2 sm:col-span-1">
                <label className="block font-bold text-stone-700 text-[10px]">Boron (B)</label>
                <input
                  type="number"
                  step="0.05"
                  value={boron}
                  onChange={(e) => setBoron(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-center font-bold text-stone-900 text-xs mt-1"
                />
                <span className="text-[8px] text-stone-400 block mt-0.5">&gt; 0.5 ppm</span>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4 text-emerald-300" />
              <span>{saving ? 'Saving Soil Info...' : 'Save Soil Health Card'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
