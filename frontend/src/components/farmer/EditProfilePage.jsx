import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Lock, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, MapPin, Globe, Shield, Briefcase, Building
} from 'lucide-react';
import { getCurrentUser } from '../../api/auth';
import { getFieldOptions } from '../../api/options';
import {
  updateFarmerProfile,
  updateExpertProfile,
  updateOfficialProfile,
  updateUserBasicInfo,
} from '../../api/profile';
import apiClient from '../../api/client';

export default function EditProfilePage({ onBack }) {
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [options, setOptions] = useState(null);

  // General profile state
  const [name, setName] = useState('');

  // Farmer profile fields (auth/profile/farmer)
  const [phone, setPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [village, setVillage] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');

  // Expert profile fields (auth/profile/expert)
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [organization, setOrganization] = useState('');

  // Official profile fields (auth/profile/official)
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Status & loading indicators
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const populateFromUser = (user, opts = options) => {
    if (!user) return;
    setName(user.name || '');

    // 1. Farmer profile
    const fp = user.farmer_profile;
    if (fp) {
      if (fp.phone) setPhone(fp.phone);
      if (fp.preferred_language) setPreferredLanguage(fp.preferred_language);
      if (fp.village) setVillage(fp.village);
      if (fp.state) setStateName(fp.state);
      if (fp.district) setDistrict(fp.district);
    }

    // 2. Expert profile
    const ep = user.expert_profile;
    if (ep) {
      if (ep.specialization) setSpecialization(ep.specialization);
      if (ep.qualification) setQualification(ep.qualification);
      if (ep.organization) setOrganization(ep.organization);
    }

    // 3. Official profile
    const op = user.official_profile;
    if (op) {
      if (op.department) setDepartment(op.department);
      if (op.designation) setDesignation(op.designation);
      if (op.state && !fp?.state) setStateName(op.state);
      if (op.district && !fp?.district) setDistrict(op.district);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoadingProfile(true);
      try {
        const [user, fieldOpts] = await Promise.all([
          getCurrentUser(),
          getFieldOptions(),
        ]);

        setUserData(user);
        if (fieldOpts) {
          setOptions(fieldOpts);
        }

        populateFromUser(user, fieldOpts);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    initData();
  }, []);

  // Filter districts dynamically based on selected state
  const availableDistricts = stateName && options?.districts?.[stateName]
    ? options.districts[stateName]
    : [];

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setStateName(newState);
    setDistrict(''); // Reset district when state changes
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      // 1. Update basic user info (name) if changed
      if (name !== userData?.name) {
        await updateUserBasicInfo({ name });
      }

      const role = userData?.role || 'farmer';

      // 2. Update role specific profile via auth/profile/(userrole)
      if (role === 'farmer') {
        const farmerPayload = {
          phone: phone.trim() || null,
          preferred_language: preferredLanguage || null,
          village: village.trim() || null,
          state: stateName || null,
          district: district || null,
        };
        await updateFarmerProfile(farmerPayload);
      } else if (role === 'expert') {
        const expertPayload = {
          specialization: specialization || null,
          qualification: qualification.trim() || null,
          organization: organization.trim() || null,
        };
        await updateExpertProfile(expertPayload);
      } else if (role === 'official') {
        const officialPayload = {
          department: department || null,
          designation: designation || null,
          state: stateName || null,
          district: district || null,
        };
        await updateOfficialProfile(officialPayload);
      }

      setProfileSuccess('Profile updated successfully!');
      
      // Refresh local user state and prefill updated fields
      const updatedUser = await getCurrentUser();
      setUserData(updatedUser);
      populateFromUser(updatedUser);

    } catch (err) {
      console.error('Profile update error:', err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setProfileError(detail.map((d) => d.msg || d.message).join(', '));
      } else if (typeof detail === 'string') {
        setProfileError(detail);
      } else {
        setProfileError('Failed to update profile. Please verify all fields.');
      }
    } finally {
      setProfileLoading(false);
    }
  };


  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await apiClient.patch('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPwError(typeof detail === 'string' ? detail : 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const roleLabel = userData?.role === 'expert' ? 'Agricultural Expert' : userData?.role === 'official' ? 'Government Official' : 'Farmer';

  return (
    <div className="min-h-screen bg-stone-50 pt-14 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm font-bold text-emerald-800 hover:text-emerald-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            {userData?.role === 'expert'
              ? 'Back to Expert Portal'
              : userData?.role === 'official'
              ? 'Back to Dashboard'
              : 'Back to Workspace'}
          </span>
        </button>

        {/* Page Header */}
        <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <User className="h-7 w-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {loadingProfile ? 'Loading profile...' : (userData?.name || userData?.username || 'My Profile')}
              </h1>
              <p className="text-sm text-stone-300 mt-0.5">
                {userData?.email || ''} • <span className="font-mono text-xs text-emerald-400">@{userData?.username}</span>
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-800 text-emerald-200 rounded-md uppercase tracking-wider border border-emerald-700">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Profile Details Form ─── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-stone-900">
                {roleLabel} Profile Details
              </h2>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">Endpoint: /auth/profile/{userData?.role || 'farmer'}</span>
          </div>

          <form onSubmit={handleProfileSave} className="p-6 space-y-5">
            {profileError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* FARMER ROLE SPECIFIC FIELDS */}
            {(!userData || userData.role === 'farmer') && (
              <>
                <div className="pt-2 border-t border-stone-100">
                  <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-3">
                    Farmer Contact & Location Info
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center space-x-1">
                        <Globe className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Preferred Language</span>
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="mr">Marathi (मराठी)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                        <span>State</span>
                      </label>
                      <select
                        value={stateName}
                        onChange={handleStateChange}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                      >
                        <option value="">Select State</option>
                        {stateName && !options?.states?.some((s) => s.value === stateName) && (
                          <option value={stateName}>{stateName}</option>
                        )}
                        {options?.states?.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                        <span>District</span>
                      </label>
                      <select
                        value={district}
                        disabled={!stateName}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium disabled:bg-stone-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {stateName ? 'Select District' : 'First select a state'}
                        </option>
                        {district && !availableDistricts.includes(district) && (
                          <option value={district}>{district}</option>
                        )}
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>


                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Village / Tehsil
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. Ralegan Siddhi"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* EXPERT ROLE SPECIFIC FIELDS */}
            {userData?.role === 'expert' && (
              <div className="pt-2 border-t border-stone-100">
                <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-3">
                  Agronomist / Expert Info
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Specialization
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                    >
                      <option value="">Select Specialization</option>
                      {options?.specializations?.map((sp) => (
                        <option key={sp.value} value={sp.value}>
                          {sp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. M.Sc Agriculture (Plant Pathology)"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Organization / University
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. ICAR - Indian Agricultural Research Institute"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OFFICIAL ROLE SPECIFIC FIELDS */}
            {userData?.role === 'official' && (
              <div className="pt-2 border-t border-stone-100">
                <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-3">
                  Government Official Info
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                    >
                      <option value="">Select Department</option>
                      {options?.departments?.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Designation
                    </label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                    >
                      <option value="">Select Designation</option>
                      {options?.designations?.map((des) => (
                        <option key={des.value} value={des.value}>
                          {des.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      State Jurisdiction
                    </label>
                    <select
                      value={stateName}
                      onChange={handleStateChange}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                    >
                      <option value="">Select State</option>
                      {options?.states?.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      District Jurisdiction
                    </label>
                    <select
                      value={district}
                      disabled={!stateName}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium disabled:bg-stone-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {stateName ? 'Select District' : 'First select a state'}
                      </option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Action Save Button */}
            <div className="flex justify-end pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer disabled:bg-stone-400"
              >
                {profileLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{profileLoading ? 'Updating Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ─── Change Password Form ─── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center space-x-2">
            <Lock className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-stone-900">Change Account Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            {pwError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 pr-10 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwLoading || !currentPassword || !newPassword}
                className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-400 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {pwLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{pwLoading ? 'Updating Password...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
