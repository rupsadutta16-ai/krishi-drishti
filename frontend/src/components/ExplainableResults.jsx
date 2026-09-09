import React from 'react';
import { Camera, CloudRain, Sprout, BarChart3, AlertTriangle, HelpCircle } from 'lucide-react';

export default function ExplainableResults() {
  return (
    <section id="explainable" className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider mb-3">
            Transparent Assessment
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Understand Why, Not Just What
          </h2>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">
            Every assessment explains the contributing factors so you can understand why your crop may be at risk and what to do next.
          </p>
        </div>

        {/* Example Assessment Card */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden shadow-sm max-w-3xl mx-auto">

          {/* Assessment Header */}
          <div className="bg-emerald-950 text-white px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Example Assessment</p>
              <h3 className="text-lg font-bold text-white mt-0.5">Crop Health Assessment</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Overall Risk</p>
              <span className="inline-block mt-1 px-3 py-1 bg-red-500/20 text-red-300 border border-red-400/40 text-sm font-extrabold rounded-lg">
                High
              </span>
            </div>
          </div>

          {/* Four Signal Cards */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Image Analysis */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Camera className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Image Analysis</span>
              </div>
              <p className="text-sm font-semibold text-stone-800">Possible fungal symptoms</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-stone-500">Confidence</span>
                <span className="text-xs font-bold text-cyan-700">87%</span>
              </div>
              <div className="mt-1 w-full bg-stone-100 rounded-full h-1.5">
                <div className="bg-cyan-600 h-1.5 rounded-full" style={{ width: '87%' }} />
              </div>
            </div>

            {/* Weather Risk */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CloudRain className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Weather Risk</span>
              </div>
              <p className="text-sm font-semibold text-red-700">High</p>
              <p className="text-xs text-stone-500 mt-1">High humidity + recent rainfall increase fungal risk</p>
            </div>

            {/* Soil Assessment */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sprout className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Soil Assessment</span>
              </div>
              <p className="text-sm font-semibold text-amber-700">Moderate</p>
              <p className="text-xs text-stone-500 mt-1">Low nitrogen based on current soil inputs</p>
            </div>

            {/* Historical Pattern */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-stone-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Historical Pattern</span>
              </div>
              <p className="text-sm font-semibold text-orange-700">Risk Increasing</p>
              <p className="text-xs text-stone-500 mt-1">Compared with previous observations</p>
            </div>
          </div>

          {/* Why Section */}
          <div className="mx-6 mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-3">
              <HelpCircle className="h-5 w-5 text-amber-700" />
              <h4 className="text-sm font-bold text-amber-900">Why is this crop at risk?</h4>
            </div>
            <ul className="space-y-2 text-xs text-stone-700 leading-relaxed">
              <li className="flex items-start space-x-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Image analysis detected patterns consistent with early-stage fungal infection (87% confidence).</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Current weather conditions (high humidity, recent rainfall) are favorable for fungal disease development.</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Low nitrogen levels in the soil may be reducing the plant's natural disease resistance.</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Risk has been increasing over recent observations, suggesting the condition is progressing.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
