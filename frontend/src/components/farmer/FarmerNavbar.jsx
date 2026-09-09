import React, { useState, useRef, useEffect } from 'react';
import {
  Sprout, LayoutDashboard, Wheat, Stethoscope, FileBarChart, History,
  Bell, User, LogOut, Menu, X, Camera,
  ChevronDown, Settings
} from 'lucide-react';

export default function FarmerNavbar({ currentUser, onLogout, onOpenCropModal, onEditProfile, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Crops & Farms', icon: Wheat, id: 'cropsAndFarms' },
    { name: 'Diagnose', icon: Stethoscope, id: 'addObservation' },
    { name: 'Reports', icon: FileBarChart, id: 'reports' },
    { name: 'History', icon: History, id: 'history' },
  ];

  const handleNavClick = (item) => {
    if (item.id === 'addObservation') {
      onOpenCropModal && onOpenCropModal();
    } else {
      onNavigate && onNavigate(item.id);
    }
    setMobileMenuOpen(false);
  };

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
                key={item.name}
                onClick={() => handleNavClick(item)}
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

          {/* Bell */}
          <button className="p-1.5 text-stone-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors relative cursor-pointer">
            <Bell className="h-4 w-4" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center space-x-1 px-2 py-1.5 text-stone-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <ChevronDown className={`h-3 w-3 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-100 z-50 overflow-hidden animate-fadeIn">
                {/* User info header */}
                <div className="px-4 py-3 bg-emerald-50 border-b border-stone-100">
                  <p className="text-xs font-bold text-emerald-900">
                    {currentUser?.data?.name || currentUser?.data?.username || 'Farmer'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {currentUser?.data?.email || 'Logged in'}
                  </p>
                </div>

                <button
                  onClick={() => { setProfileMenuOpen(false); onEditProfile && onEditProfile(); }}
                  className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-emerald-700" />
                  <span>Edit Profile</span>
                </button>

                <div className="border-t border-stone-100" />

                <button
                  onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                  className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

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
                key={item.name}
                onClick={() => handleNavClick(item)}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-stone-200 hover:bg-emerald-900 rounded-lg"
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
          <div className="border-t border-emerald-800 pt-2 mt-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onEditProfile && onEditProfile(); }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-stone-200 hover:bg-emerald-900 rounded-lg"
            >
              <Settings className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onLogout(); }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-emerald-900 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
