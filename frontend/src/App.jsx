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
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('register');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // User is authenticated
      setCurrentUser({ authenticated: true });
      setCurrentView('dashboard');
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
    setCurrentUser({ authenticated: true, data });
    setCurrentView('dashboard');
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

  const farmerViews = ['dashboard', 'cropsAndFarms', 'editProfile', 'addObservation', 'history', 'reports'];
  const isFarmerLoggedIn = !!currentUser || farmerViews.includes(currentView);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased">
      {/* Show FarmerNavbar when logged in, otherwise public Navbar */}
      {isFarmerLoggedIn ? (
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
      {!isFarmerLoggedIn ? (
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
