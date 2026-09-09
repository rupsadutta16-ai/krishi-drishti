import React, { useState, useEffect } from 'react';
import { X, Wheat, AlertCircle, CheckCircle2, RefreshCw, PlusCircle } from 'lucide-react';
import { createCrop } from '../../api/crops';

const CROP_TYPES = [
  "Rice", "Cotton", "Wheat", "Soybean", "Tomato", "Maize", "Sugarcane", "Pulses", "Other"
];

// Rice varieties enum options
const CROP_VARIETIES = [
  "Basmati",
  "Sona Masoori",
  "IR64",
  "Swarna",
  "Ponni",
  "PR126",
  "Indrayani",
  "Black Rice",
  "Jasmine",
  "Other"
];

const GROWTH_STAGES = [
  "Sowing", "Germination", "Vegetative", "Flowering", "Fruiting", "Harvesting", "Completed"
];

export default function AddCropModal({ isOpen, onClose, farms = [], onSuccess, onOpenAddFarm }) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    farm_id: '',
    crop_type: 'Rice',
    variety: '',
    sowing_date: today,
    growth_stage: 'Sowing',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (farms && farms.length > 0 && !formData.farm_id) {
      setFormData((prev) => ({ ...prev, farm_id: farms[0].id }));
    }
  }, [farms, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.farm_id) {
      setErrorMsg('Please select a farm. If you have no farms registered, add a farm first.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        farm_id: parseInt(formData.farm_id, 10),
        crop_type: formData.crop_type,
        variety: formData.variety.trim() || null,
        sowing_date: formData.sowing_date || null,
        growth_stage: formData.growth_stage || null,
      };

      const createdCrop = await createCrop(payload);
      setSuccessMsg('Crop registered successfully!');
      setLoading(false);

      setTimeout(() => {
        onSuccess && onSuccess(createdCrop);
        handleClose();
      }, 700);
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErrorMsg(detail.map((d) => d.msg || d.message).join(', '));
      } else if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else {
        setErrorMsg('Failed to register crop. Please check your inputs and try again.');
      }
    }
  };

  const handleClose = () => {
    setFormData({
      farm_id: farms.length > 0 ? farms[0].id : '',
      crop_type: 'Rice',
      variety: '',
      sowing_date: today,
      growth_stage: 'Sowing',
    });
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-700">
              <Wheat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Add New Crop</h3>
              <p className="text-xs text-stone-300">Link a new crop cycle to your registered farm</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Farm Selection Dropdown */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Farm <span className="text-red-500">*</span>
            </label>
            {farms.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
                <span>No farms available. Please add a farm first.</span>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenAddFarm && onOpenAddFarm();
                  }}
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>Add Farm</span>
                </button>
              </div>
            ) : (
              <select
                name="farm_id"
                required
                value={formData.farm_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.farm_name} ({farm.district || 'Maharashtra'}, {farm.area_acres || '?'} acres)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Crop Type & Variety Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Crop Type <span className="text-red-500">*</span>
              </label>
              <select
                name="crop_type"
                required
                value={formData.crop_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              >
                {CROP_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Variety / Cultivar
              </label>
              <select
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              >
                <option value="">Select Variety</option>
                {CROP_VARIETIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sowing Date & Growth Stage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Sowing Date
              </label>
              <input
                type="date"
                name="sowing_date"
                value={formData.sowing_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Growth Stage
              </label>
              <select
                name="growth_stage"
                value={formData.growth_stage}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              >
                {GROWTH_STAGES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || farms.length === 0}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Crop...</span>
                </>
              ) : (
                <span>Add Crop</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
