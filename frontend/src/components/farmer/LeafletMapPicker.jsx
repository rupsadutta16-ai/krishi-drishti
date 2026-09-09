import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon (bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMapPicker({ value, onChange }) {
  const [position, setPosition] = useState(
    value?.latitude && value?.longitude
      ? [value.latitude, value.longitude]
      : [18.5204, 73.8567] // Default: Pune, Maharashtra
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  const handleLocationSelect = (lat, lng) => {
    const rounded = { latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) };
    setPosition([lat, lng]);
    onChange(rounded);
    setError('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleLocationSelect(lat, lng);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
        setGpsLoading(false);
      },
      () => {
        setError('Could not get your location. Please allow location access or search manually.');
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        handleLocationSelect(lat, lng);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 14);
        }
      } else {
        setError('Location not found. Try a more specific search term.');
      }
    } catch {
      setError('Search failed. Please check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Controls */}
      <div className="bg-emerald-950 px-4 py-3 flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex flex-1 items-center bg-white/10 rounded-lg overflow-hidden border border-emerald-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search location (e.g. Nashik, Maharashtra)"
            className="flex-1 px-3 py-1.5 bg-transparent text-white text-xs placeholder-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1.5 text-stone-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>{searching ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
        {/* GPS */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
          className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
        >
          <Navigation className={`h-3.5 w-3.5 ${gpsLoading ? 'animate-pulse' : ''}`} />
          <span>{gpsLoading ? 'Locating...' : 'Use My Location'}</span>
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">{error}</div>
      )}

      {/* Selected coords display */}
      {value?.latitude && value?.longitude && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center space-x-2">
          <MapPin className="h-3.5 w-3.5 text-emerald-700" />
          <span className="text-xs font-mono text-emerald-800">
            {value.latitude.toFixed(5)}°, {value.longitude.toFixed(5)}°
          </span>
          <span className="text-xs text-stone-500 ml-1">— Click map or search to change</span>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '280px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onLocationSelect={handleLocationSelect} />
        {value?.latitude && value?.longitude && (
          <Marker position={[value.latitude, value.longitude]} />
        )}
      </MapContainer>

      <p className="text-[10px] text-stone-400 px-4 py-2 bg-stone-50">
        Click anywhere on the map to pin your farm location.
      </p>
    </div>
  );
}
