import React from 'react';
import { Shield, Cpu, Database, Sprout, HeartPulse, MessageSquare } from 'lucide-react';

export default function FeaturesSection({ onOpenAuth }) {
  const features = [
    {
      icon: Cpu,
      title: 'Neural Pathogen Identification',
      description: 'Instant classification of early-stage fungal, bacterial, and pest infestations from high-res leaf images.',
      isAi: true,
      badge: 'AI Core'
    },
    {
      icon: Shield,
      title: 'Government Surveillance Protocol',
      description: 'Enables regional agricultural departments to track disease spread and deploy timely emergency containment.',
      isAi: false,
      badge: 'Surveillance'
    },
    {
      icon: Database,
      title: 'Micro-Climate & Soil Sync',
      description: 'Integrates temperature, humidity, and soil moisture telemetry to calculate outbreak vulnerability indices.',
      isAi: false,
      badge: 'Telemetry'
    },
    {
      icon: MessageSquare,
      title: 'Multi-Lingual Farmer Advisory',
      description: 'Delivers clear, step-by-step biological and chemical application steps in regional Indian languages.',
      isAi: false,
      badge: 'Accessibility'
    },
    {
      icon: HeartPulse,
      title: 'Agronomist Verification Loop',
      description: 'Complex or unknown crop symptoms are routed to verified extension specialists for human confirmation.',
      isAi: false,
      badge: 'Expert Checked'
    },
    {
      icon: Sprout,
      title: 'Seasonal Yield Protection',
      description: 'Continuous field monitoring reduces crop loss by up to 35% through early preventative intervention.',
      isAi: false,
      badge: 'Yield Safeguard'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider mb-3">
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Built for Farmers. Backed by Data Science.
          </h2>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">
            Krishi Drishti combines field technology with artificial intelligence to safeguard crops and empower agricultural decision-makers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-stone-50 p-6 rounded-2xl border border-stone-200 hover:border-emerald-700/60 transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${
                      item.isAi 
                        ? 'bg-emerald-950 text-cyan-400 border border-cyan-500/30' 
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                      item.isAi ? 'bg-cyan-900 text-cyan-200 border border-cyan-700' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-emerald-950 mb-2 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.isAi && (
                  <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-bold text-cyan-700">
                    <span>98.4% Diagnostic Model Precision</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="mt-16 bg-emerald-950 text-white p-8 rounded-2xl border-2 border-emerald-800 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">Ready to safeguard your crop yield?</h3>
            <p className="text-xs text-stone-300 mt-1">Create your Krishi Drishti farmer account and get real-time field advisory.</p>
          </div>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl transition-colors shadow-md border border-amber-700 whitespace-nowrap cursor-pointer"
          >
            Get Started
          </button>
        </div>

      </div>
    </section>
  );
}
