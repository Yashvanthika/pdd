/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, BloodRequest, Location, SimulationLog, Donor } from './types';
import { AuthPortal } from './components/AuthPortal';
import { DonorPortal } from './components/DonorPortal';
import { HospitalDashboard } from './components/HospitalDashboard';
import { RegistrySettings } from './components/RegistrySettings';
import { MapSimulation } from './components/MapSimulation';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  clearAuditLogs,
  completeDonation as completeDonationInSupabase,
  createAuditLog,
  createBloodRequest,
  getCurrentSessionUserId,
  loadAppData,
  registerAccount,
  signInWithEmail,
  signOut as signOutFromSupabase,
  subscribeToBloodLinkChanges,
  updateBloodRequestStatus,
  updateDonorResponse,
  updateProfile,
  updateUserStatus,
  type RegistrationInput
} from './services/bloodlinkRepository';
import {
  Droplet, Activity, LogOut, UserCheck, Shield
} from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location>({ lat: 50, lng: 50 });
  const [radiusKm, setRadiusKm] = useState<number>(6.5);
  const [highlightedDonorId, setHighlightedDonorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState('');

  const resetSessionState = useCallback(() => {
    setUsers([]);
    setCurrentUser(null);
    setActiveRequest(null);
    setRequests([]);
    setLogs([]);
    setSelectedLocation({ lat: 50, lng: 50 });
  }, []);

  const refreshAppData = useCallback(async (preferredUserId?: string | null) => {
    if (!isSupabaseConfigured) {
      setAppError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
      setIsLoading(false);
      return;
    }

    const data = await loadAppData();
    setUsers(data.users);
    setRequests(data.requests);
    setActiveRequest(data.activeRequest);
    setLogs(data.logs);

    const sessionUserId = preferredUserId === undefined
      ? await getCurrentSessionUserId()
      : preferredUserId;

    if (!sessionUserId) {
      setCurrentUser(null);
      return;
    }

    const freshUser = data.users.find((user) => user.id === sessionUserId) || null;
    setCurrentUser(freshUser);

    if (freshUser?.location) {
      setSelectedLocation(freshUser.location);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setAppError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
      setIsLoading(false);
      return;
    }

    const boot = async () => {
      try {
        setIsLoading(true);
        const userId = await getCurrentSessionUserId();
        if (!mounted) return;

        if (userId) {
          await refreshAppData(userId);
        } else {
          resetSessionState();
        }
      } catch (error: any) {
        if (mounted) {
          setAppError(error.message || 'Unable to connect to Supabase.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!mounted) return;
        try {
          if (session?.user.id) {
            await refreshAppData(session.user.id);
          } else {
            resetSessionState();
          }
        } catch (error: any) {
          setAppError(error.message || 'Unable to refresh Supabase session.');
        }
      })();
    });

    void boot();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshAppData, resetSessionState]);

  const currentUserId = currentUser?.id || null;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUserId) return;

    const channel = subscribeToBloodLinkChanges(() => {
      void refreshAppData(currentUserId);
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, refreshAppData]);

  const addLog = useCallback(async (type: SimulationLog['type'], message: string) => {
    const optimisticLog: SimulationLog = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      message
    };

    setLogs((prev) => [optimisticLog, ...prev]);

    if (!isSupabaseConfigured) return;

    try {
      const savedLog = await createAuditLog(type, message);
      setLogs((prev) => [savedLog, ...prev.filter((log) => log.id !== optimisticLog.id)]);
    } catch (error) {
      console.error('Unable to persist audit log:', error);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAppError('');
    const user = await signInWithEmail(email, password);
    setCurrentUser(user);
    if (user.location) {
      setSelectedLocation(user.location);
    }
    await refreshAppData(user.id);
    await addLog('INFO', `USER LOGIN: User ${user.name} signed in as ${user.role.toUpperCase()}.`);
  };

  const handleLogout = async () => {
    const signedOutUser = currentUser;
    if (signedOutUser) {
      await addLog('INFO', `USER LOGOUT: User ${signedOutUser.name} signed out.`);
    }
    await signOutFromSupabase();
    resetSessionState();
  };

  const handleRegister = async (newUser: RegistrationInput) => {
    await registerAccount(newUser);
  };

  const handleVerifyUser = async (userId: string, newStatus: 'APPROVED' | 'BANNED') => {
    await updateUserStatus(userId, newStatus);
    const targetUser = users.find((user) => user.id === userId);
    await addLog('INFO', `ADMIN ACTION: Account '${targetUser?.name || 'User'}' status updated to ${newStatus}.`);
    await refreshAppData(currentUser?.id || null);
  };

  const handleBroadcastRequest = async (request: BloodRequest) => {
    if (!currentUser) {
      throw new Error('You must be signed in to create a dispatch.');
    }

    const savedRequest = await createBloodRequest(request, currentUser.id);
    setActiveRequest(savedRequest);
    setRequests((prev) => [savedRequest, ...prev]);
    await refreshAppData(currentUser.id);
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;

    await updateBloodRequestStatus(activeRequest.id, 'CANCELLED');
    await addLog('INFO', 'Dispatch cancelled: hospital cancelled the active request.');
    setActiveRequest(null);
    setRequests((prev) => prev.map((request) => (
      request.id === activeRequest.id ? { ...request, status: 'CANCELLED' } : request
    )));
    await refreshAppData(currentUser?.id || null);
  };

  const handleRespondToRequest = async (donorId: string, response: 'ACCEPTED' | 'REJECTED') => {
    if (!activeRequest) return;

    setActiveRequest((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        donorResponses: {
          ...prev.donorResponses,
          [donorId]: response
        }
      };
    });

    await updateDonorResponse(activeRequest.id, donorId, response);
    await refreshAppData(currentUser?.id || null);
  };

  const handleUpdateDonorProfile = async (updatedDonor: User) => {
    const savedProfile = await updateProfile(updatedDonor);
    setUsers((prev) => prev.map((user) => (user.id === savedProfile.id ? savedProfile : user)));
    setCurrentUser((prev) => (prev?.id === savedProfile.id ? savedProfile : prev));
    if (savedProfile.location) {
      setSelectedLocation(savedProfile.location);
    }
    await refreshAppData(savedProfile.id);
  };

  const handleCompleteDonation = async (requestId: string, donorId: string) => {
    const targetRequest = requests.find((request) => request.id === requestId);
    const targetDonor = users.find((user) => user.id === donorId);

    if (!targetDonor || !targetRequest) return;

    const donationDate = new Date().toISOString().slice(0, 10);
    await completeDonationInSupabase(targetRequest, targetDonor, donationDate);
    await addLog('FULFILL', `FULFILLMENT COMPLETE: Patient ${targetRequest.patientName}'s blood coordination completed. Donor ${targetDonor.name} completed the whole blood draw and donation spacing is active.`);
    await refreshAppData(currentUser?.id || null);
  };

  const handleClearLogs = async () => {
    await clearAuditLogs();
    setLogs([]);
    await addLog('INFO', 'Log stream cleared.');
    await refreshAppData(currentUser?.id || null);
  };

  const donorList: Donor[] = useMemo(() => users
    .filter((user) => user.role === 'donor')
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bloodGroup: user.bloodGroup || 'O-',
      location: user.location || { lat: 50, lng: 50 },
      isAvailable: user.isAvailable || false,
      lastDonationDate: user.lastDonationDate || '2026-01-10',
      gender: user.gender || 'Male',
      age: user.age || 25,
      donationHistory: user.donationHistory || []
    })), [users]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="bg-rose-600 p-3 rounded-2xl inline-flex">
            <Droplet className="w-7 h-7 fill-current animate-pulse" />
          </div>
          <p className="text-sm font-bold">Connecting to BloodLink</p>
          <p className="text-xs text-slate-400">Loading Supabase session and records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      <header className="ios-safe-top bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 select-none shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-rose-600 p-2 rounded-xl text-white shadow-md shadow-rose-900/10">
              <Droplet className="w-5.5 h-5.5 fill-current animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white font-display">BloodLink</span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-500" /> Emergency coordination
              </p>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-4.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  {currentUser.role === 'admin' ? <Shield className="w-3 h-3 text-rose-500" /> : <UserCheck className="w-3 h-3 text-emerald-500" />}
                  {currentUser.role} Account
                </span>
              </div>
              <button
                onClick={() => void handleLogout()}
                className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 hover:text-rose-400 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer transition-all shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <span>Secure Sign In</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {appError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-xs font-semibold">
            {appError}
          </div>
        )}

        {currentUser && currentUser.role !== 'donor' && activeRequest && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-650 bg-red-650 bg-red-650 bg-red-600"></span>
              </span>
              <div>
                <span className="text-[10px] font-black text-rose-800 block uppercase tracking-wide">
                  CRITICAL DISPATCH ACTIVE
                </span>
                <p className="text-[11px] text-slate-655 font-medium text-slate-600">
                  Target patient {activeRequest.patientName} ({activeRequest.bloodGroup}) at {activeRequest.hospitalName}. Coverage range: {radiusKm}km.
                </p>
              </div>
            </div>
            <button
              onClick={() => void handleCancelRequest()}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              Cancel dispatch
            </button>
          </div>
        )}

        {!currentUser ? (
          <AuthPortal
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        ) : (
          <>
            {currentUser.role === 'donor' && (
              <DonorPortal
                currentUser={currentUser}
                activeRequest={activeRequest}
                onRespondToRequest={handleRespondToRequest}
                onUpdateDonorProfile={handleUpdateDonorProfile}
                onAddLog={addLog}
              />
            )}

            {currentUser.role === 'hospital' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="col-span-12 lg:col-span-7 flex flex-col justify-between">
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                        Hospital Dispatch
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Coordinate approved donor outreach and select the request location on the coverage map.
                      </p>
                    </div>
                    <div className="flex-1 mt-4">
                      <MapSimulation
                        donors={donorList}
                        activeRequest={activeRequest}
                        selectedLocation={selectedLocation}
                        onSelectLocation={setSelectedLocation}
                        radiusKm={radiusKm}
                        highlightedDonorId={highlightedDonorId}
                        onHoverDonor={setHighlightedDonorId}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-5">
                  <HospitalDashboard
                    currentUser={currentUser}
                    donors={users}
                    activeRequest={activeRequest}
                    requests={requests}
                    onBroadcastRequest={handleBroadcastRequest}
                    onCancelRequest={handleCancelRequest}
                    selectedLocation={selectedLocation}
                    onSelectLocation={setSelectedLocation}
                    radiusKm={radiusKm}
                    onSetRadiusKm={setRadiusKm}
                    logs={logs}
                    onAddLog={addLog}
                    onCompleteDonation={handleCompleteDonation}
                  />
                </div>
              </div>
            )}

            {currentUser.role === 'admin' && (
              <div className="space-y-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                    Administrator Console
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Review pending donor verifications, inspect registered accounts, monitor active dispatches, and review audit logs.
                  </p>
                </div>
                <div className="pt-3">
                  <RegistrySettings
                    currentUser={currentUser}
                    users={users}
                    requests={requests}
                    onVerifyUser={handleVerifyUser}
                    logs={logs}
                    onClearLogs={handleClearLogs}
                    currentDateStr={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-center text-xs text-slate-400 font-medium select-none">
        <p>© 2026 BloodLink. Dedicated to faster emergency blood coordination.</p>
      </footer>
    </div>
  );
}
