import React from 'react';
import { Languages, Mic, Volume2, Globe } from 'lucide-react';

export default function LanguageSection() {
  const languages = [
    { name: 'मराठी', english: 'Marathi', featured: true },
    { name: 'हिन्दी', english: 'Hindi', featured: false },
    { name: 'తెలుగు', english: 'Telugu', featured: false },
    { name: 'ಕನ್ನಡ', english: 'Kannada', featured: false },
    { name: 'தமிழ்', english: 'Tamil', featured: false },
    { name: 'English', english: 'English', featured: false },
  ];

  return (
    <section id="language" className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left — Content */}
          <div>
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider mb-4">
              Accessible to All
            </div>
            <h2 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
              Agricultural Intelligence in Your Language
            </h2>
            <p className="mt-4 text-stone-600 text-sm leading-relaxed">
              Farmers don't need advanced technical knowledge to use Krishi Drishti. The platform is designed for accessibility — from local language support to voice-based interaction.
            </p>

            {/* Voice Features */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">Voice Input</p>
                  <p className="text-xs text-stone-500">Speak your observations and questions naturally</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">Voice Output</p>
                  <p className="text-xs text-stone-500">Listen to assessments and recommendations aloud</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Language Grid */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <div
                  key={lang.english}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    lang.featured
                      ? 'bg-emerald-950 text-white border-emerald-800 col-span-2'
                      : 'bg-stone-50 border-stone-200 hover:border-emerald-600/40'
                  }`}
                >
                  <p className={`text-lg font-bold ${lang.featured ? 'text-white' : 'text-emerald-950'}`}>
                    {lang.name}
                  </p>
                  <p className={`text-xs mt-0.5 ${lang.featured ? 'text-emerald-300' : 'text-stone-500'}`}>
                    {lang.english}
                    {lang.featured && ' — Primary regional language support'}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-stone-500 text-center flex items-center justify-center space-x-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span>More languages being added based on regional demand</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
