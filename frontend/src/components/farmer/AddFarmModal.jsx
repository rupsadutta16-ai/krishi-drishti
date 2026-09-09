import React, { useState } from 'react';
import { X, Sprout, MapPin, AlertCircle, CheckCircle2, RefreshCw, Compass } from 'lucide-react';
import { createFarm } from '../../api/farms';
import LeafletMapPicker from './LeafletMapPicker';

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
  "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
  "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
  "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];

export default function AddFarmModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    farm_name: '',
    area_acres: '',
    village: '',
    district: 'Pune',
    state: 'Maharashtra',
  });

  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [locStatus, setLocStatus] = useState('idle'); // idle | fetching | success | denied
  const [locMessage, setLocMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      setLocMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocStatus('fetching');
    setLocMessage('Acquiring your field coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ latitude: lat, longitude: lng });
        setLocStatus('success');
        setLocMessage(`Location acquired (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`);
      },
      (error) => {
        setLocStatus('denied');
        setCoords({ latitude: null, longitude: null });
        if (error.code === error.PERMISSION_DENIED) {
          setLocMessage('Location permission denied. Farm will be saved without GPS coordinates.');
        } else {
          setLocMessage('Unable to retrieve location. Farm will be saved without GPS coordinates.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.farm_name.trim()) {
      setErrorMsg('Please enter a farm name.');
      return;
    }

    const area = formData.area_acres !== '' ? parseFloat(formData.area_acres) : null;
    if (area !== null && (isNaN(area) || area <= 0)) {
      setErrorMsg('Area must be a positive number of acres.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        farm_name: formData.farm_name.trim(),
        area_acres: area,
        village: formData.village.trim() || null,
        district: formData.district || null,
        state: formData.state || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const createdFarm = await createFarm(payload);
      setSuccessMsg('Farm created successfully!');
      setLoading(false);

      setTimeout(() => {
        onSuccess && onSuccess(createdFarm);
        handleClose();
      }, 700);
    } catch (err) {
      setLoading(false);
      const data = err.response?.data;
      const detail = data?.detail ?? data?.message;
      if (Array.isArray(detail)) {
        setErrorMsg(detail.map((d) => d.msg || d.message).join(', '));
      } else if (typeof detail === 'string' && detail.trim()) {
        setErrorMsg(detail);
      } else {
        setErrorMsg('Failed to create farm. Please check your inputs and try again.');
      }
    }
  };

  const handleClose = () => {
    setFormData({
      farm_name: '',
      area_acres: '',
      village: '',
      district: 'Pune',
      state: 'Maharashtra',
    });
    setCoords({ latitude: null, longitude: null });
    setLocStatus('idle');
    setLocMessage('');
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
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Add New Farm</h3>
              <p className="text-xs text-stone-300">Register a new agricultural plot in Krishi Drishti</p>
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

          {/* Farm Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Farm Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="farm_name"
              required
              value={formData.farm_name}
              onChange={handleChange}
              placeholder="e.g. Green Valley Plot #1"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
            />
          </div>

          {/* Area (acres) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Area (Acres)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="area_acres"
              value={formData.area_acres}
              onChange={handleChange}
              placeholder="e.g. 4.5"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
            />
          </div>

          {/* Village */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Village
            </label>
            <input
              type="text"
              name="village"
              value={formData.village}
              onChange={handleChange}
              placeholder="e.g. Ambegaon"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
            />
          </div>

          {/* State & District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              >
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                District
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Geolocation Section */}
          <div className="pt-2 border-t border-stone-200">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Compass className="h-4 w-4 text-emerald-800" />
                  <span className="text-xs font-bold text-stone-800">Field Coordinates (GPS)</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locStatus === 'fetching'}
                  className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-emerald-100 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {locStatus === 'fetching' ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span>{locStatus === 'success' ? 'Update Location' : 'Use My Location'}</span>
                </button>
              </div>

              {locMessage && (
                <p className={`text-xs font-medium ${
                  locStatus === 'success'
                    ? 'text-emerald-700'
                    : locStatus === 'denied'
                    ? 'text-amber-700'
                    : 'text-stone-600'
                }`}>
                  {locMessage}
                </p>
              )}
              {!locMessage && (
                <p className="text-[11px] text-stone-500">
                  Optional: Automatically attach GPS location to your farm profile.
                </p>
              )}
            </div>
          </div>

          {/* Map Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Or Select on Map
            </label>
            <LeafletMapPicker
              value={coords}
              onChange={(c) => {
                setCoords(c);
                setLocStatus('success');
                setLocMessage(`Location selected (${c.latitude.toFixed(4)}°, ${c.longitude.toFixed(4)}°)`);
              }}
            />
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
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Farm...</span>
                </>
              ) : (
                <span>Add Farm</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
