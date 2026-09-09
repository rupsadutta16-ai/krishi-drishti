import React from 'react';
import { ArrowRight, UserPlus } from 'lucide-react';

export default function FinalCTA({ onOpenAuth, onExploreWorkflow }) {
  return (
    <section className="relative py-20 bg-emerald-950 border-t border-emerald-800">
      {/* Subtle background image layer */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url('/hero_farm_bg.jpg')` }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Start Monitoring Your Crops Smarter
        </h2>
        <p className="mt-4 text-base text-stone-300 leading-relaxed max-w-2xl mx-auto">
          Detect risks early, understand what may be affecting your crops, and make better-informed decisions.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-3 border border-emerald-400/40 cursor-pointer"
          >
            <UserPlus className="h-5 w-5" />
            <span>Get Started</span>
          </button>

          <button
            onClick={onExploreWorkflow}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl shadow-lg transition-all border border-white/20 flex items-center justify-center space-x-2 backdrop-blur-sm cursor-pointer"
          >
            <span>Learn How It Works</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
