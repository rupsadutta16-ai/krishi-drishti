import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Globe, Sprout, RefreshCw } from 'lucide-react';
import { getFarmerPublicProfile } from '../../api/expert';

export default function FarmerProfileModal({ farmerId, farmerData, onClose }) {
  const [profile, setProfile] = useState(farmerData || null);
  const [loading, setLoading] = useState(!farmerData && !!farmerId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!farmerData && farmerId) {
      setLoading(true);
      getFarmerPublicProfile(farmerId)
        .then((data) => setProfile(data))
        .catch((err) => {
          console.error('Error fetching farmer profile:', err);
          setError('Could not load farmer profile.');
        })
        .finally(() => setLoading(false));
    }
  }, [farmerId, farmerData]);

  if (!farmerId && !farmerData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="bg-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 border-2 border-emerald-600 flex items-center justify-center text-emerald-200 flex-shrink-0 shadow-md">
              <User className="h-7 w-7" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-800 text-emerald-200 border border-emerald-700">
                Farmer Profile
              </span>
              <h2 className="text-xl font-extrabold tracking-tight mt-1">
                {loading ? 'Loading...' : (profile?.name || 'Farmer')}
              </h2>
              <p className="text-xs text-stone-300 font-mono mt-0.5">ID #{farmerId || profile?.user_id}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-8 flex items-center justify-center space-x-2 text-stone-500 text-xs font-semibold">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
              <span>Fetching farmer details...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          ) : (
            <>
              {/* Contact Details */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">Contact Details</h3>

                <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3 text-xs">
                  <div className="flex items-start space-x-3">
                    <Phone className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">Phone Number</p>
                      {profile?.phone ? (
                        <a href={`tel:${profile.phone}`} className="font-bold text-stone-900 hover:text-emerald-700 transition-colors">
                          {profile.phone}
                        </a>
                      ) : (
                        <p className="text-stone-400 font-medium">Not provided</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 border-t border-stone-100 pt-2.5">
                    <Mail className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">Email Address</p>
                      {profile?.email ? (
                        <a href={`mailto:${profile.email}`} className="font-semibold text-stone-900 hover:text-emerald-700 transition-colors truncate block">
                          {profile.email}
                        </a>
                      ) : (
                        <p className="text-stone-400 font-medium">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Info (State, District, Village) */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">Location & Address</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">State</p>
                    <p className="font-bold text-stone-900 mt-0.5">{profile?.state || 'Not specified'}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">District</p>
                    <p className="font-bold text-stone-900 mt-0.5">{profile?.district || 'Not specified'}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Village / Tehsil</p>
                    <p className="font-bold text-stone-900 mt-0.5">{profile?.village || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Preferred Language */}
              <div className="flex items-center space-x-2 text-xs text-stone-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <Globe className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                <span className="font-medium">
                  Preferred Language: <strong className="text-emerald-900 uppercase">{profile?.preferred_language || 'EN'}</strong>
                </span>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
