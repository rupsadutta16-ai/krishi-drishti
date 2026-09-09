import React, { useState, useEffect } from 'react';
import { Sprout, Menu, X, ChevronRight } from 'lucide-react';

export default function Navbar({ onOpenAuth }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Resources', href: '#resources' },
    { name: 'About', href: '#about' },
  ];

  const handleNavClick = (href) => {
    setMobileMenuOpen(false);
    if (href && href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/40 shadow-lg py-3' 
          : 'bg-gradient-to-b from-emerald-950/80 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('#home')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="p-2 bg-emerald-800 group-hover:bg-emerald-700 rounded-lg text-white transition-colors border border-emerald-600/50 shadow-sm">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
              KRISHI DRISHTI
              <span className="ml-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
              AI Agricultural Intelligence
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-stone-200 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-cyan-400 after:absolute after:bottom-0 after:left-0 after:transition-all cursor-pointer"
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* Action Buttons: Login & Get Started */}
        <div className="hidden md:flex items-center space-x-4">
          <button 
            onClick={() => onOpenAuth('login')}
            className="text-xs font-bold text-stone-200 hover:text-white px-3 py-2 cursor-pointer transition-colors"
          >
            Login
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-lg transition-colors shadow-md border border-amber-700 cursor-pointer"
          >
            <span>Get Started</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-200 hover:text-white bg-emerald-900/80 rounded-lg border border-emerald-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950/95 backdrop-blur-lg border-b border-emerald-800/60 px-4 pt-3 pb-6 space-y-3 mt-3">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="block w-full text-left px-3 py-2 text-sm font-semibold text-stone-200 hover:bg-emerald-900 rounded-lg"
            >
              {link.name}
            </button>
          ))}
          <div className="pt-3 border-t border-emerald-900 flex flex-col space-y-2">
            <button
              onClick={() => {
                onOpenAuth('login');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-emerald-900 text-white font-bold text-xs rounded-lg text-center"
            >
              Login
            </button>
            <button
              onClick={() => {
                onOpenAuth('register');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-amber-800 text-white font-bold text-xs rounded-lg text-center"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
