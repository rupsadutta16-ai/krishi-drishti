import React from 'react';
import { Sprout, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export default function Footer({ onOpenAuth }) {
  return (
    <footer className="bg-emerald-950 text-white border-t border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-800 rounded-lg text-white">
                <Sprout className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">KRISHI DRISHTI</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              AI-powered crop health intelligence — combining images, weather, soil, and historical data for better agricultural decisions.
            </p>
            <div className="flex items-center space-x-2 text-xs text-cyan-300 font-semibold">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Government Agricultural Surveillance Compliant</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Platform</h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#intelligence" className="hover:text-white transition-colors">Crop Intelligence</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#explainable" className="hover:text-white transition-colors">Explainable Results</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">Trust & Safety</a></li>
              <li><a href="#language" className="hover:text-white transition-colors">Language Support</a></li>
            </ul>
          </div>

          {/* Kisan Helpline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Kisan Helpline</h4>
            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>Toll Free: 1800-180-1551</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>support@krishidrishti.gov.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Maharashtra Agri-Tech Centre, India</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-800 space-y-3">
            <h5 className="text-xs font-bold text-white">Ready to get started?</h5>
            <p className="text-[11px] text-stone-300">
              Create a free farmer account and begin monitoring your crop health today.
            </p>
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Get Started
            </button>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <p>&copy; {new Date().getFullYear()} Krishi Drishti Agricultural Intelligence Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Crafted for Sustainable Precision Farming</p>
        </div>
      </div>
    </footer>
  );
}
