import React, { useState, useEffect } from 'react';
import { X, Wheat, AlertCircle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { updateCrop, deleteCrop } from '../../api/crops';

const CROP_TYPES = [
  "Rice", "Cotton", "Wheat", "Soybean", "Tomato", "Maize", "Sugarcane", "Pulses", "Other"
];
const CROP_VARIETIES = [
  "Basmati", "Sona Masoori", "IR64", "Swarna", "Ponni",
  "PR126", "Indrayani", "Black Rice", "Jasmine", "Other"
];
const GROWTH_STAGES = [
  "Sowing", "Germination", "Vegetative", "Flowering", "Fruiting", "Harvesting", "Completed"
];

export default function EditCropModal({ isOpen, onClose, crop, farms = [], onUpdated, onDeleted }) {
  const [formData, setFormData] = useState({
    crop_type: '',
    variety: '',
    sowing_date: '',
    growth_stage: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (crop && isOpen) {
      setFormData({
        crop_type: crop.crop_type || 'Rice',
        variety: crop.variety || '',
        sowing_date: crop.sowing_date || '',
        growth_stage: crop.growth_stage || 'Sowing',
      });
      setErrorMsg('');
      setSuccessMsg('');
      setConfirmDelete(false);
    }
  }, [crop, isOpen]);

  if (!isOpen || !crop) return null;

  const farmName = farms.find((f) => f.id === crop.farm_id)?.farm_name || `Farm #${crop.farm_id}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const payload = {
        crop_type: formData.crop_type,
        variety: formData.variety || null,
        sowing_date: formData.sowing_date || null,
        growth_stage: formData.growth_stage || null,
      };
      const updated = await updateCrop(crop.id, payload);
      setSuccessMsg('Crop updated successfully!');
      setTimeout(() => { onUpdated && onUpdated(updated); onClose(); }, 700);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to update crop.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCrop(crop.id);
      onDeleted && onDeleted(crop.id);
      onClose();
    } catch (err) {
      setErrorMsg('Failed to delete crop. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-700">
              <Wheat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Edit Crop</h2>
              <p className="text-xs text-stone-400 mt-0.5">{farmName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-emerald-900 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Crop Type</label>
              <select name="crop_type" value={formData.crop_type} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                {CROP_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Variety</label>
              <select name="variety" value={formData.variety} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                <option value="">Select Variety</option>
                {CROP_VARIETIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Sowing Date</label>
              <input type="date" name="sowing_date" value={formData.sowing_date} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Growth Stage</label>
              <select name="growth_stage" value={formData.growth_stage} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                {GROWTH_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Crop</span>
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={onClose} type="button"
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5">
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">Delete Crop?</h3>
                <p className="text-xs text-stone-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 bg-stone-50 rounded-lg p-3 border border-stone-200">
              You are about to permanently delete <strong>{crop.crop_type}</strong>
              {crop.variety ? ` (${crop.variety})` : ''} from <strong>{farmName}</strong>.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5">
                {deleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
