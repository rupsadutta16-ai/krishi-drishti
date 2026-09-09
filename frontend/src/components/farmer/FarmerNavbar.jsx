import React, { useState } from 'react';
import { Sprout, LayoutDashboard, Wheat, Stethoscope, FileBarChart, History, BookOpen, MessageCircle, Bell, User, LogOut, Menu, X, Camera } from 'lucide-react';

export default function FarmerNavbar({ currentUser, onLogout, onOpenCropModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'My Crops', icon: Wheat, id: 'crops' },
    { name: 'Diagnose', icon: Stethoscope, id: 'diagnose' },
    { name: 'Reports', icon: FileBarChart, id: 'reports' },
    { name: 'History', icon: History, id: 'history' },
    { name: 'Advice', icon: BookOpen, id: 'advice' },
    { name: 'Chat', icon: MessageCircle, id: 'chat' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-emerald-950 border-b border-emerald-800/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-800 rounded-lg text-white">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-white hidden sm:inline">
            KRISHI DRISHTI
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.id === 'diagnose' ? onOpenCropModal : undefined}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Primary CTA */}
          <button 
            onClick={onOpenCropModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors border border-emerald-500/40 cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Check Crop Health</span>
          </button>

          <button className="p-1.5 text-stone-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors relative cursor-pointer">
            <Bell className="h-4 w-4" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          <button className="p-1.5 text-stone-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer">
            <User className="h-4 w-4" />
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-stone-200 hover:text-white hover:bg-emerald-900 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950/95 backdrop-blur-lg border-b border-emerald-800/60 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-stone-200 hover:bg-emerald-900 rounded-lg"
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
