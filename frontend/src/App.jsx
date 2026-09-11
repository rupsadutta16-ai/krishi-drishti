import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import IntelligenceSection from './components/IntelligenceSection';
import WorkflowSection from './components/WorkflowSection';
import ExplainableResults from './components/ExplainableResults';
import TrustSection from './components/TrustSection';
import LanguageSection from './components/LanguageSection';
import FinalCTA from './components/FinalCTA';
import FarmerNavbar from './components/farmer/FarmerNavbar';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import CropsAndFarmsPage from './components/farmer/CropsAndFarmsPage';
import EditProfilePage from './components/farmer/EditProfilePage';
import AddObservationPage from './components/farmer/AddObservationPage';
import HistoryPage from './components/farmer/HistoryPage';
import ReportsPage from './components/farmer/ReportsPage';
import CasesPage from './components/farmer/CasesPage';
import ExpertDashboard from './components/expert/ExpertDashboard';
import OfficialDashboard from './components/official/OfficialDashboard';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { getCurrentUser } from './api/auth';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('register');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then((userData) => {
          setCurrentUser({ authenticated: true, role: userData.role, data: userData });
        })
        .catch(() => {
          setCurrentUser({ authenticated: true });
        })
        .finally(() => setAuthLoading(false));
      setCurrentView('dashboard');
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleOpenAuth = (tab = 'register') => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = (data) => {
    setAuthLoading(true);
    setCurrentView('dashboard');
    if (data?.role) {
      setCurrentUser({ authenticated: true, role: data.role, data });
    }
    getCurrentUser()
      .then((userData) => {
        setCurrentUser({ authenticated: true, role: userData.role, data: userData });
      })
      .catch(() => {
        setCurrentUser({ authenticated: true, role: data?.role, data });
      })
      .finally(() => setAuthLoading(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleEditProfile = () => {
    setCurrentView('editProfile');
  };

  const handleOpenAddObservation = () => {
    setCurrentView('addObservation');
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleExploreWorkflow = () => {
    setCurrentView('landing');
    setTimeout(() => {
      const el = document.getElementById('how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const farmerViews = ['dashboard', 'cropsAndFarms', 'editProfile', 'addObservation', 'history', 'reports', 'cases'];
  const isLoggedIn = !!currentUser || !!localStorage.getItem('token');
  const roleStr = (currentUser?.role || currentUser?.data?.role || '').toLowerCase();
  const isOfficial = isLoggedIn && roleStr === 'official';
  const isExpert = isLoggedIn && !isOfficial && (roleStr === 'expert' || Boolean(currentUser?.data?.expert_profile));
  const isFarmerLoggedIn = isLoggedIn && !isExpert && !isOfficial && (farmerViews.includes(currentView) || currentView === 'dashboard');


  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased">
      {/* Show nothing until auth is resolved */}
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-800 border-r-transparent" />
            <p className="text-sm font-medium text-stone-600">Loading...</p>
          </div>
        </div>
      ) : isExpert ? null : isOfficial ? null : isFarmerLoggedIn ? (
        <FarmerNavbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenCropModal={handleOpenAddObservation}
          onEditProfile={handleEditProfile}
          onNavigate={handleNavigate}
        />
      ) : (
        <Navbar 
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Dynamic View Content */}
      {authLoading ? null : isOfficial ? (
        currentView === 'editProfile' ? (
          <EditProfilePage onBack={() => setCurrentView('dashboard')} />
        ) : (
          <OfficialDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onEditProfile={handleEditProfile}
          />
        )
      ) : isExpert ? (
        currentView === 'editProfile' ? (
          <EditProfilePage onBack={() => setCurrentView('dashboard')} />
        ) : (
          <ExpertDashboard
            onLogout={handleLogout}
            onEditProfile={handleEditProfile}
          />
        )
      ) : !isFarmerLoggedIn ? (
        <>
          {/* Public Hero Section */}
          <Hero 
            onOpenAuth={handleOpenAuth}
            onExploreWorkflow={handleExploreWorkflow}
          />

          {/* 4 Cards: Complete Crop Health Intelligence */}
          <IntelligenceSection />

          {/* 7-Step Visual Workflow */}
          <WorkflowSection />

          {/* Explainable Diagnostic Results */}
          <ExplainableResults />

          {/* Trust & System Behavior */}
          <TrustSection />

          {/* Local Language & Voice Interface */}
          <LanguageSection />

          {/* Final Call to Action */}
          <FinalCTA 
            onOpenAuth={handleOpenAuth}
            onExploreWorkflow={handleExploreWorkflow}
          />

          {/* Platform Footer */}
          <Footer 
            setCurrentView={setCurrentView} 
            onOpenAuth={handleOpenAuth}
          />
        </>
      ) : (
        <div className="pt-14">
          {currentView === 'editProfile' ? (
            <EditProfilePage onBack={() => setCurrentView('dashboard')} />
          ) : currentView === 'cropsAndFarms' ? (
            <CropsAndFarmsPage
              onBack={() => setCurrentView('dashboard')}
              onOpenCropModal={handleOpenAddObservation}
            />
          ) : currentView === 'addObservation' ? (
            <AddObservationPage onBack={() => setCurrentView('dashboard')} />
          ) : currentView === 'history' ? (
            <HistoryPage onBack={() => setCurrentView('dashboard')} />
          ) : currentView === 'reports' ? (
            <ReportsPage onBack={() => setCurrentView('dashboard')} />
          ) : currentView === 'cases' ? (
            <CasesPage onBack={() => setCurrentView('dashboard')} />
          ) : (
            <FarmerDashboard
              currentUser={currentUser}
              onOpenCropModal={handleOpenAddObservation}
              onEditProfile={handleEditProfile}
            />
          )}
        </div>
      )}

      {/* Auth Modal (Login & Sign Up) */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={handleCloseAuth} 
        initialTab={authTab}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
