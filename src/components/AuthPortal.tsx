/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BloodGroup, Location } from '../types';
import type { RegistrationInput } from '../services/bloodlinkRepository';
import { Droplet, Mail, Lock, Building, Navigation } from 'lucide-react';

type RegistrationRole = Exclude<RegistrationInput['role'], 'admin'>;

interface AuthPortalProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (newUser: RegistrationInput) => Promise<void>;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<RegistrationRole>('donor');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  
  // Donor-specific
  const [donorBloodGroup, setDonorBloodGroup] = useState<BloodGroup>('O-');
  const [donorAge, setDonorAge] = useState(25);
  const [donorGender, setDonorGender] = useState('Male');
  const [donorLastDonation, setDonorLastDonation] = useState('2026-01-10');
  
  // Location selection (lat, lng) - default center
  const [selectedLoc, setSelectedLoc] = useState<Location>({ lat: 50, lng: 50 });
  const [address, setAddress] = useState('');

  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginSubmitting(true);

    try {
      await onLogin(loginEmail.trim().toLowerCase(), loginPassword);
    } catch (error: any) {
      setLoginError(error.message || 'Invalid email or password.');
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsRegisterSubmitting(true);

    const newUser: RegistrationInput = {
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role,
      name: regName.trim(),
      phone: regPhone.trim(),
      location: selectedLoc,
      address: role === 'hospital' ? address : undefined,
      bloodGroup: role === 'donor' ? donorBloodGroup : undefined,
      age: role === 'donor' ? donorAge : undefined,
      gender: role === 'donor' ? donorGender : undefined,
      lastDonationDate: role === 'donor' ? donorLastDonation : undefined
    };

    try {
      await onRegister(newUser);
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        setIsRegister(false);
        setLoginEmail(newUser.email);
        setLoginPassword('');
      }, 2000);
    } catch (error: any) {
      setRegError(error.message || 'Registration could not be completed.');
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const lng = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const lat = Math.round((1 - (e.clientY - rect.top) / rect.height) * 100);
    setSelectedLoc({ lat, lng });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex bg-rose-500/10 p-3 rounded-2xl text-rose-500 mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-pulse">
          <Droplet className="w-8 h-8 fill-rose-500" />
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight font-display">
          Blood<span className="text-rose-500">Link</span>
        </h2>
        <p className="mt-2 text-xs text-slate-400 font-medium max-w-sm mx-auto uppercase tracking-wider">
          Emergency Blood Coordination Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
          
          {/* Success Register Alert */}
          {registerSuccess && (
            <div className="mb-6 bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-center text-xs font-semibold animate-fadeIn">
              Account registration submitted.
              {role === 'donor' && <p className="text-[10px] text-slate-400 font-normal mt-1">Status set to pending administrator approval.</p>}
              <p className="text-[10px] mt-1 text-emerald-300">Redirecting to sign in...</p>
            </div>
          )}

          {/* Form Tabs */}
          {!registerSuccess && (
            <div className="flex border-b border-slate-800 mb-6 pb-0.5 select-none">
              <button
                onClick={() => { setIsRegister(false); setLoginError(''); setRegError(''); }}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                  !isRegister
                    ? 'border-rose-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsRegister(true); setLoginError(''); setRegError(''); }}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                  isRegister
                    ? 'border-rose-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* LOGIN VIEW */}
          {!isRegister && !registerSuccess && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="bg-rose-950/50 border border-rose-500/50 text-rose-400 p-3 rounded-lg text-xs font-semibold">
                  {loginError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-rose-950/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isLoginSubmitting ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}

          {/* REGISTER VIEW */}
          {isRegister && !registerSuccess && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="bg-rose-950/50 border border-rose-500/50 text-rose-400 p-3 rounded-lg text-xs font-semibold">
                  {regError}
                </div>
              )}
              
              {/* Role Switcher */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2 text-center">Select Account Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('donor')}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      role === 'donor'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Droplet className="w-4 h-4 mb-0.5" />
                    <span>Donor / Volunteer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('hospital')}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      role === 'hospital'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building className="w-4 h-4 mb-0.5" />
                    <span>Hospital / Center</span>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {role === 'hospital' ? 'Hospital / Center Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={role === 'hospital' ? 'Registered hospital name' : 'Legal full name'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 99999 88888"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Donor-Specific Fields */}
              {role === 'donor' && (
                <div className="border-t border-slate-900 pt-3 mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Blood Group</label>
                      <select
                        value={donorBloodGroup}
                        onChange={(e) => setDonorBloodGroup(e.target.value as BloodGroup)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
                      >
                        {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                          <option key={bg} value={bg}>🩸 {bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Age</label>
                      <input
                        type="number"
                        min="18"
                        max="65"
                        required
                        value={donorAge}
                        onChange={(e) => setDonorAge(parseInt(e.target.value) || 18)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                      <select
                        value={donorGender}
                        onChange={(e) => setDonorGender(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Last Whole Blood Donation Date</label>
                    <input
                      type="date"
                      required
                      value={donorLastDonation}
                      onChange={(e) => setDonorLastDonation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* Hospital-Specific Fields */}
              {role === 'hospital' && (
                <div className="border-t border-slate-900 pt-3 mt-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1 font-mono">Hospital Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Road No 12, Banjara Hills, Hyderabad"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none"
                  />
                </div>
              )}

              {/* Map Coordinator Pinning for Donors and Hospitals */}
              {(role === 'donor' || role === 'hospital') && (
                <div className="border-t border-slate-900 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-rose-500" /> Set Service Location
                    </span>
                    <span className="text-rose-500 font-mono">
                      Lat: {selectedLoc.lat}, Lng: {selectedLoc.lng}
                    </span>
                  </div>

                  {/* SVG Coordinates picker */}
                  <div className="relative h-[160px] w-full rounded-xl overflow-hidden border border-slate-800">
                    <svg
                      className="w-full h-full bg-slate-950 cursor-pointer"
                      onClick={handleMapClick}
                    >
                      {/* Grid lines */}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <React.Fragment key={i}>
                          <line x1="0" y1={`${(i + 1) * 20}%`} x2="100%" y2={`${(i + 1) * 20}%`} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" />
                          <line x1={`${(i + 1) * 20}%`} y1="0" x2={`${(i + 1) * 20}%`} y2="100%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" />
                        </React.Fragment>
                      ))}
                      
                      {/* Selected Location Circle */}
                      <circle
                        cx={`${selectedLoc.lng}%`}
                        cy={`${100 - selectedLoc.lat}%`}
                        r="10"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                      <circle
                        cx={`${selectedLoc.lng}%`}
                        cy={`${100 - selectedLoc.lat}%`}
                        r="4"
                        fill="#ff0000"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      
                      <text x="50%" y="90%" fill="#475569" fontSize="8" textAnchor="middle" className="select-none pointer-events-none">
                        Select a service location on the map
                      </text>
                    </svg>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isRegisterSubmitting ? 'Submitting registration...' : 'Submit Registration'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
