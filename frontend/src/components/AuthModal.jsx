import React, { useState } from 'react';
import { X, Sprout, Lock, Mail, User, Shield, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../api/auth';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'register'
  
  // Login form state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'farmer',
    preferred_language: 'en',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await loginUser({
        username: loginData.username,
        password: loginData.password,
      });
      setSuccessMsg('Login successful! Redirecting to field workspace...');
      setLoading(false);
      setTimeout(() => {
        onAuthSuccess && onAuthSuccess(data);
        onClose();
      }, 600);
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMsg(typeof detail === 'string' ? detail : 'Invalid username or password.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await registerUser({
        name: regData.name,
        username: regData.username || regData.email.split('@')[0],
        email: regData.email,
        password: regData.password,
        role: regData.role,
        preferred_language: regData.preferred_language,
      });
      
      setSuccessMsg('Account registered successfully! Logging you in...');
      
      // Auto-login after registration
      try {
        const loginRes = await loginUser({
          username: regData.username || regData.email,
          password: regData.password,
        });
        setLoading(false);
        setTimeout(() => {
          onAuthSuccess && onAuthSuccess(loginRes);
          onClose();
        }, 800);
      } catch (loginErr) {
        setLoading(false);
        setSuccessMsg('Registration successful! Please log in with your credentials.');
        setActiveTab('login');
      }
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Registration failed.';
      if (Array.isArray(detail)) {
        setErrorMsg(detail.map(d => d.msg || d.message).join(', '));
      } else {
        setErrorMsg(typeof detail === 'string' ? detail : 'Registration failed. Please check input parameters.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white p-6 relative border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-900 rounded-lg border border-emerald-700 text-white">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">KRISHI DRISHTI</h3>
              <p className="text-xs text-stone-300">Agricultural Intelligence Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'login'
                ? 'border-emerald-800 text-emerald-950 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'border-emerald-800 text-emerald-950 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Get Started (Register)
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded-r-lg text-xs text-red-900 font-medium flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-700 rounded-r-lg text-xs text-emerald-900 font-medium flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Username or Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="Enter your username or email"
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    placeholder="ramesh_k"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Role Category
                  </label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white font-medium text-stone-800"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="expert">Agronomist / Expert</option>
                    <option value="official">Govt Official</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={regData.preferred_language}
                  onChange={(e) => setRegData({ ...regData, preferred_language: e.target.value })}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white font-medium text-stone-800"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="farmer@domain.com"
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 border border-amber-700"
              >
                <span>{loading ? 'Registering Account...' : 'Complete Registration'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
