import React from 'react';
import { Camera, CloudRain, Sprout, RefreshCw, ShieldCheck, ArrowDown, FlaskConical, BrainCircuit, BarChart3, UserCheck, Database, TrendingUp } from 'lucide-react';

export default function IntelligenceSection() {
  return (
    <section id="intelligence" className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full uppercase tracking-wider mb-3">
            Multi-Source Assessment
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Complete Crop Health Intelligence
          </h2>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">
            Crop health is assessed using multiple sources — not just a single image. Each source adds context so that assessments are more accurate and actionable.
          </p>
        </div>

        {/* Four Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* 1. Crop Image Analysis */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-7 hover:border-emerald-600/40 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl">
                <Camera className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide bg-cyan-100 text-cyan-800 border border-cyan-200">
                AI-Powered
              </span>
            </div>
            <h3 className="text-lg font-bold text-emerald-950 mb-2">Crop Image Analysis</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Analyze crop images to identify potential issues through visual inspection powered by deep learning models.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Diseases', 'Pests', 'Visible symptoms', 'Crop damage', 'Condition changes'].map((item) => (
                <div key={item} className="flex items-center space-x-2 text-xs text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 flex items-center space-x-2 text-xs text-stone-500">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-600" />
              <span>AI provides a confidence level for image-based predictions</span>
            </div>
          </div>

          {/* 2. Weather-Based Risk Detection */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-7 hover:border-emerald-600/40 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-sky-100 text-sky-800 rounded-xl">
                <CloudRain className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide bg-stone-200 text-stone-700">
                Environmental
              </span>
            </div>
            <h3 className="text-lg font-bold text-emerald-950 mb-2">Weather-Based Risk Detection</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Use weather information to identify environmental conditions that may increase crop-health risk. This is weather-based risk detection, not image classification.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Temperature', 'Humidity', 'Rainfall', 'Wind', 'Recent patterns', 'Forecast'].map((item) => (
                <div key={item} className="flex items-center space-x-2 text-xs text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 text-xs text-stone-500 italic">
              Example: High humidity and recent rainfall may increase fungal disease risk.
            </div>
          </div>

          {/* 3. Soil Assessment */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-7 hover:border-emerald-600/40 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide bg-stone-200 text-stone-700">
                Rule-Based
              </span>
            </div>
            <h3 className="text-lg font-bold text-emerald-950 mb-2">Soil Assessment</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Soil assessment initially uses a rule-based agricultural knowledge system to evaluate growing conditions and identify potential concerns.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['pH level', 'Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Moisture', 'Soil type', 'Crop type'].map((item) => (
                <div key={item} className="flex items-center space-x-2 text-xs text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 text-xs text-stone-500">
              Identifies nutrient deficiencies, soil-related crop stress, suitability issues, and potential risks.
            </div>
          </div>

          {/* 4. Continuous Learning */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-7 hover:border-emerald-600/40 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <RefreshCw className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide bg-emerald-100 text-emerald-700">
                Evolving
              </span>
            </div>
            <h3 className="text-lg font-bold text-emerald-950 mb-2">Continuous Learning</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Krishi Drishti becomes more useful over time by learning from real agricultural observations and validated outcomes.
            </p>

            {/* Learning Pipeline */}
            <div className="space-y-2">
              {[
                { label: 'Farmer Input', icon: UserCheck },
                { label: 'Initial Assessment', icon: BrainCircuit },
                { label: 'Expert / Real-World Feedback', icon: ShieldCheck },
                { label: 'Validated Data', icon: Database },
                { label: 'Learning', icon: TrendingUp },
                { label: 'Improved Future Assessment', icon: BarChart3 },
              ].map((step, idx, arr) => (
                <div key={step.label}>
                  <div className="flex items-center space-x-3">
                    <step.icon className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                    <span className="text-xs font-medium text-stone-700">{step.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="ml-2 pl-0 flex justify-start">
                      <ArrowDown className="h-3 w-3 text-stone-300 my-0.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
