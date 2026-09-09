import React from 'react';
import { Camera, CloudRain, Sprout, BarChart3, BrainCircuit, ChevronDown, ArrowRight, UserPlus } from 'lucide-react';

export default function Hero({ onOpenAuth, onExploreWorkflow }) {
  const intelligenceSources = [
    { icon: Camera, label: 'Crop Image', color: 'text-emerald-300' },
    { icon: CloudRain, label: 'Weather', color: 'text-cyan-300' },
    { icon: Sprout, label: 'Soil', color: 'text-amber-300' },
    { icon: BarChart3, label: 'History', color: 'text-stone-300' },
    { icon: BrainCircuit, label: 'Intelligent Assessment', color: 'text-cyan-400' },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/hero_farm_bg.jpg')` }}
      />

      {/* Translucent Green Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/90 via-emerald-950/80 to-emerald-950/95 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 flex flex-col items-center">

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Smarter Crop Health.<br />Better Decisions.
        </h1>

        {/* Supporting Text */}
        <p className="mt-6 text-base sm:text-lg text-stone-200 font-normal max-w-3xl leading-relaxed">
          Krishi Drishti combines crop images, weather conditions, soil information, and historical observations to help farmers understand crop health, detect risks early, and take informed action.
        </p>

        {/* CTA Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-7 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 border border-emerald-500/40 cursor-pointer"
          >
            <UserPlus className="h-5 w-5 text-emerald-200" />
            <span>Get Started</span>
          </button>

          <button
            onClick={onExploreWorkflow}
            className="w-full sm:w-auto px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl shadow-lg transition-all border border-white/20 flex items-center justify-center space-x-2 backdrop-blur-sm cursor-pointer"
          >
            <span>Explore How It Works</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Intelligence Sources — subtle icon badges */}
        <div className="mt-14 pt-8 border-t border-emerald-800/50">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
            Powered by multiple intelligence sources
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {intelligenceSources.map((src) => {
              const Icon = src.icon;
              return (
                <div key={src.label} className="flex items-center space-x-2 opacity-70 hover:opacity-100 transition-opacity">
                  <Icon className={`h-4 w-4 ${src.color}`} />
                  <span className="text-xs font-medium text-stone-300">{src.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={onExploreWorkflow}
          className="mt-12 text-stone-400 hover:text-white text-xs font-semibold flex flex-col items-center space-y-1 transition-colors cursor-pointer"
        >
          <span>Scroll to learn more</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
