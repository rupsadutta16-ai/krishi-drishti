import React, { useState } from 'react';
import { X, User, Shield, Briefcase, Building, Phone, Mail, MapPin, MessageSquare, CheckCircle2, Star } from 'lucide-react';

export default function ExpertProfileModal({ expert, onClose }) {
  const [requested, setRequested] = useState(false);

  if (!expert) return null;

  const handleRequestConsultation = () => {
    setRequested(true);
  };

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
            <div className="w-16 h-16 rounded-2xl bg-emerald-800 border-2 border-emerald-600 flex items-center justify-center text-emerald-200 flex-shrink-0 shadow-md">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-800 text-emerald-200 border border-emerald-700">
                  Agronomist Expert
                </span>
                {expert.is_verified && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">{expert.name || 'Expert User'}</h2>
              <p className="text-xs text-stone-300 font-medium">{expert.specialization || 'General Agriculture & Crop Health'}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Qualifications & Org */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="flex items-start space-x-2.5">
              <Briefcase className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-stone-400 font-bold uppercase">Qualification</p>
                <p className="text-xs font-bold text-stone-800">{expert.qualification || 'Agri Specialist'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Building className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-stone-400 font-bold uppercase">Organization</p>
                <p className="text-xs font-bold text-stone-800">{expert.organization || 'Krishi Drishti Expert Panel'}</p>
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">Contact & Location</h3>
            
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2 text-xs">
              {expert.phone ? (
                <div className="flex items-center space-x-2.5 text-stone-800">
                  <Phone className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                  <a href={`tel:${expert.phone}`} className="font-bold hover:text-emerald-700 transition-colors">
                    {expert.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center space-x-2.5 text-stone-400">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>Phone not provided</span>
                </div>
              )}

              {expert.email && (
                <div className="flex items-center space-x-2.5 text-stone-800">
                  <Mail className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                  <a href={`mailto:${expert.email}`} className="font-semibold hover:text-emerald-700 transition-colors truncate">
                    {expert.email}
                  </a>
                </div>
              )}

              {expert.address ? (
                <div className="flex items-start space-x-2.5 text-stone-800">
                  <MapPin className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{expert.address}</span>
                </div>
              ) : (
                <div className="flex items-start space-x-2.5 text-stone-400">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Address not provided</span>
                </div>
              )}
            </div>
          </div>

          {/* Consultation Request Action */}
          <div className="pt-2">
            {requested ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Consultation Request Registered</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Sent</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestConsultation}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-emerald-200" />
                <span>Request Consultation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
