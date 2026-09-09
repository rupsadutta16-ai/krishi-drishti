import React from 'react';
import { Wheat, Camera, FlaskConical, CloudSun, BrainCircuit, FileText, RefreshCw, Info } from 'lucide-react';

export default function WorkflowSection() {
  const steps = [
    {
      number: '01',
      title: 'Select Your Crop',
      description: 'Choose the crop you want to assess — rice, wheat, tomato, sugarcane, or others.',
      icon: Wheat,
      iconBg: 'bg-emerald-100 text-emerald-900',
    },
    {
      number: '02',
      title: 'Capture or Upload an Image',
      description: 'Take a photo of the affected leaf or crop area, or upload an existing image.',
      icon: Camera,
      iconBg: 'bg-emerald-100 text-emerald-900',
    },
    {
      number: '03',
      title: 'Provide Available Soil Information',
      description: 'Enter soil data if available — pH, nutrients, moisture. This is optional initially.',
      icon: FlaskConical,
      iconBg: 'bg-amber-100 text-amber-800',
    },
    {
      number: '04',
      title: 'Check Weather & Environmental Conditions',
      description: 'Weather data can be automatically obtained based on your location and recent patterns.',
      icon: CloudSun,
      iconBg: 'bg-sky-100 text-sky-800',
    },
    {
      number: '05',
      title: 'Analyze Crop Health',
      description: 'Available inputs are combined to produce a comprehensive crop health assessment.',
      icon: BrainCircuit,
      iconBg: 'bg-cyan-100 text-cyan-800',
      isAi: true,
    },
    {
      number: '06',
      title: 'Receive Risk & Recommendations',
      description: 'Get a clear risk level, contributing factors, and actionable treatment recommendations.',
      icon: FileText,
      iconBg: 'bg-emerald-100 text-emerald-900',
    },
    {
      number: '07',
      title: 'Follow Up and Track Progress',
      description: 'Schedule re-assessments, track how health changes over time, and verify treatment efficacy.',
      icon: RefreshCw,
      iconBg: 'bg-emerald-100 text-emerald-900',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-stone-50 border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full uppercase tracking-wider mb-3">
            Step by Step
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            How It Works
          </h2>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">
            From selecting your crop to tracking improvements — a clear path to understanding crop health.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connecting line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 -translate-x-1/2" />

          <div className="space-y-6 md:space-y-0">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isLeft = idx % 2 === 0;
              return (
                <div key={step.number} className="relative md:flex md:items-center md:min-h-[120px]">

                  {/* Step number circle on the center line */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-emerald-700 items-center justify-center">
                    <span className={`text-xs font-extrabold ${step.isAi ? 'text-cyan-700' : 'text-emerald-800'}`}>{step.number}</span>
                  </div>

                  {/* Left or right card */}
                  <div className={`md:w-1/2 ${isLeft ? 'md:pr-14 md:text-right' : 'md:pl-14 md:ml-auto'}`}>
                    <div className={`bg-white rounded-xl border p-5 transition-all hover:shadow-md ${step.isAi ? 'border-cyan-300' : 'border-stone-200'}`}>
                      <div className={`flex items-center space-x-3 mb-2 ${isLeft ? 'md:flex-row-reverse md:space-x-reverse' : ''}`}>
                        <div className={`p-2 rounded-lg flex-shrink-0 ${step.iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider md:hidden">Step {step.number}</span>
                          <h3 className={`text-sm font-bold ${step.isAi ? 'text-cyan-800' : 'text-emerald-950'}`}>{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="mt-10 flex items-start space-x-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-2xl mx-auto">
          <Info className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-relaxed">
            <strong>Not every assessment requires every input.</strong> An image may be available, weather can be automatically obtained, soil information may be optional initially, and historical data becomes available after repeated observations.
          </p>
        </div>
      </div>
    </section>
  );
}
