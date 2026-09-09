import React from 'react';
import { ShieldCheck, ImageOff, HelpCircle, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TrustSection() {
  const trustPoints = [
    {
      icon: ImageOff,
      title: 'Low-confidence image',
      action: 'Request a clearer image',
      description: 'If the image quality is insufficient for reliable analysis, the system asks for a better photo rather than guessing.',
    },
    {
      icon: HelpCircle,
      title: 'Insufficient information',
      action: 'Indicate insufficient data',
      description: 'When there isn\'t enough information to make a meaningful assessment, the system says so transparently.',
    },
    {
      icon: UserCheck,
      title: 'Uncertain diagnosis',
      action: 'Recommend expert review',
      description: 'Borderline or complex cases are flagged for review by local agronomists or extension officers.',
    },
    {
      icon: AlertTriangle,
      title: 'Serious or worsening case',
      action: 'Recommend escalation',
      description: 'If a condition appears serious or is getting worse, the system recommends immediate professional attention.',
    },
    {
      icon: RefreshCw,
      title: 'Follow-up observations',
      action: 'Reassess the crop',
      description: 'After treatment or time, the system encourages re-assessment to verify whether the condition has improved.',
    },
  ];

  return (
    <section id="trust" className="py-20 bg-stone-50 border-t border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full uppercase tracking-wider mb-3">
            Honest & Responsible
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Designed to Be Trustworthy
          </h2>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">
            Krishi Drishti does not blindly provide confident predictions. When the system is uncertain, it asks for more information instead of pretending to know.
          </p>
        </div>

        {/* Trust Points */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="bg-white rounded-xl border border-stone-200 p-5 flex items-start space-x-4 hover:border-emerald-600/40 transition-all">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-bold text-emerald-950">{point.title}</span>
                    <span className="text-[10px] font-semibold text-stone-400">→</span>
                    <span className="text-xs font-semibold text-emerald-700">{point.action}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{point.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Message */}
        <div className="mt-10 bg-emerald-950 text-white rounded-2xl p-6 max-w-3xl mx-auto flex items-center space-x-4">
          <ShieldCheck className="h-8 w-8 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-stone-200 leading-relaxed">
            <strong className="text-white">Krishi Drishti prioritizes safety over confidence.</strong> If there isn't enough information, you'll be told clearly — and guided on what to do next.
          </p>
        </div>
      </div>
    </section>
  );
}
