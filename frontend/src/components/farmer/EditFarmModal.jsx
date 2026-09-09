import React, { useState, useEffect } from 'react';
import { X, Sprout, AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { updateFarm, deleteFarm } from '../../api/farms';
import LeafletMapPicker from './LeafletMapPicker';

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
  "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
  "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
  "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];

export default function EditFarmModal({ isOpen, onClose, farm, onUpdated, onDeleted }) {
  const [formData, setFormData] = useState({
    farm_name: '',
    area_acres: '',
    village: '',
    district: 'Pune',
    state: 'Maharashtra',
  });
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (farm && isOpen) {
      setFormData({
        farm_name: farm.farm_name || '',
        area_acres: farm.area_acres || '',
        village: farm.village || '',
        district: farm.district || 'Pune',
        state: farm.state || 'Maharashtra',
      });
      setCoords({
        latitude: farm.latitude || null,
        longitude: farm.longitude || null,
      });
      setErrorMsg('');
      setSuccessMsg('');
      setConfirmDelete(false);
    }
  }, [farm, isOpen]);

  if (!isOpen || !farm) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.farm_name.trim()) {
      setErrorMsg('Farm name is required.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const area = formData.area_acres !== '' ? parseFloat(formData.area_acres) : null;
      const payload = {
        farm_name: formData.farm_name.trim(),
        area_acres: area || null,
        village: formData.village.trim() || null,
        district: formData.district || null,
        state: formData.state || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const updated = await updateFarm(farm.id, payload);
      setSuccessMsg('Farm updated successfully!');
      setTimeout(() => { onUpdated && onUpdated(updated); onClose(); }, 700);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to update farm.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFarm(farm.id);
      onDeleted && onDeleted(farm.id);
      onClose();
    } catch {
      setErrorMsg('Failed to delete farm. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-700">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Edit Farm</h2>
              <p className="text-xs text-stone-400 mt-0.5">{farm.farm_name}</p>
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

          {/* Farm Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Farm Name <span className="text-red-500">*</span>
            </label>
            <input type="text" name="farm_name" required value={formData.farm_name} onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors" />
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Area (Acres)</label>
            <input type="number" step="0.01" min="0.01" name="area_acres" value={formData.area_acres} onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors" />
          </div>

          {/* Village */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Village</label>
            <input type="text" name="village" value={formData.village} onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors" />
          </div>

          {/* State & District */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">State</label>
              <select name="state" value={formData.state} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">District</label>
              <select name="district" value={formData.district} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700">
                {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Leaflet Map Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Farm Location (Map)
            </label>
            <LeafletMapPicker value={coords} onChange={(c) => setCoords(c)} />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-3 flex-shrink-0">
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Farm</span>
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
                <h3 className="text-sm font-extrabold text-stone-900">Delete Farm?</h3>
                <p className="text-xs text-stone-500 mt-0.5">This will also remove all linked crops and data.</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 bg-stone-50 rounded-lg p-3 border border-stone-200">
              You are about to permanently delete <strong>{farm.farm_name}</strong>. This action cannot be undone.
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
