/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, BloodRequest, Location, SimulationLog, Donor, BloodGroup } from './types';
import { AuthPortal } from './components/AuthPortal';
import { DonorPortal } from './components/DonorPortal';
import { HospitalDashboard } from './components/HospitalDashboard';
import { RegistrySettings } from './components/RegistrySettings';
import { MapSimulation } from './components/MapSimulation';
import { 
  Droplet, Activity, LogOut, UserCheck, Shield, 
  MapPin, Settings, HelpCircle, BellRing
} from 'lucide-react';

const DEFAULT_USERS: User[] = [
  {
    id: 'donor-1',
    email: 'donor@bloodlink.org',
    password: 'password123',
    role: 'donor',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    bloodGroup: 'O-',
    location: { lat: 48, lng: 52 },
    isAvailable: true,
    lastDonationDate: '2026-02-15',
    gender: 'Male',
    age: 29,
    donationHistory: []
  },
  {
    id: 'donor-3',
    email: 'amit@bloodlink.org',
    password: 'password123',
    role: 'donor',
    name: 'Amit Sharma',
    phone: '+91 98712 34567',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    bloodGroup: 'A+',
    location: { lat: 52, lng: 55 },
    isAvailable: true,
    lastDonationDate: '2025-11-20',
    gender: 'Male',
    age: 34,
    donationHistory: []
  },
  {
    id: 'donor-4',
    email: 'sneha@bloodlink.org',
    password: 'password123',
    role: 'donor',
    name: 'Sneha Reddy',
    phone: '+91 81234 56789',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    bloodGroup: 'A-',
    location: { lat: 27, lng: 68 },
    isAvailable: true,
    lastDonationDate: '2026-01-05',
    gender: 'Female',
    age: 28,
    donationHistory: []
  },
  {
    id: 'donor-2',
    email: 'priya@bloodlink.org',
    password: 'password123',
    role: 'donor',
    name: 'Priya Nair',
    phone: '+91 91234 56789',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    bloodGroup: 'O+',
    location: { lat: 53, lng: 46 },
    isAvailable: true,
    lastDonationDate: '2026-05-10',
    gender: 'Female',
    age: 26,
    donationHistory: []
  },
  {
    id: 'donor-6',
    email: 'ananya@bloodlink.org',
    password: 'password123',
    role: 'donor',
    name: 'Ananya Patel',
    phone: '+91 96666 77777',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    bloodGroup: 'B-',
    location: { lat: 73, lng: 28 },
    isAvailable: false,
    lastDonationDate: '2025-10-15',
    gender: 'Female',
    age: 24,
    donationHistory: []
  },
  {
    id: 'hosp-1',
    email: 'hospital@bloodlink.org',
    password: 'password123',
    role: 'hospital',
    name: 'Apollo Specialty Hospital',
    phone: '+91 11 2658 8500',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    location: { lat: 25, lng: 70 },
    address: 'Road No 72, Jubilee Hills, Hyderabad, Telangana 500033'
  },
  {
    id: 'admin-1',
    email: 'admin@bloodlink.org',
    password: 'password123',
    role: 'admin',
    name: 'System Admin Coordinator',
    phone: '+91 90000 00001',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // DB & Session States
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('bloodlink_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bloodlink_logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(() => {
    const saved = localStorage.getItem('bloodlink_active_request');
    return saved ? JSON.parse(saved) : null;
  });

  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem('bloodlink_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<SimulationLog[]>(() => {
    const saved = localStorage.getItem('bloodlink_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: '⚡ BloodLink Intelligent Coordinator portal online.'
      }
    ];
  });

  const [selectedLocation, setSelectedLocation] = useState<Location>(() => {
    const savedUser = localStorage.getItem('bloodlink_logged_in_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.location) return parsed.location;
    }
    return { lat: 50, lng: 50 };
  });
  const [radiusKm, setRadiusKm] = useState<number>(6.5);
  const [highlightedDonorId, setHighlightedDonorId] = useState<string | null>(null);

  // Auto-correct local storage for Apollo hospital coordinates if seed was cached with old values
  useEffect(() => {
    let modified = false;
    const freshUsers = users.map(u => {
      if (u.id === 'hosp-1' && u.name === 'Apollo Specialty Hospital' && u.location?.lat === 50) {
        modified = true;
        return {
          ...u,
          location: { lat: 25, lng: 70 },
          address: 'Road No 72, Jubilee Hills, Hyderabad, Telangana 500033'
        };
      }
      return u;
    });

    if (modified) {
      setUsers(freshUsers);
      if (currentUser?.id === 'hosp-1') {
        const freshCurrent = freshUsers.find(u => u.id === 'hosp-1');
        if (freshCurrent) {
          setCurrentUser(freshCurrent);
          setSelectedLocation({ lat: 25, lng: 70 });
        }
      }
    }
  }, []);

  // Synchronizers
  useEffect(() => {
    localStorage.setItem('bloodlink_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bloodlink_logged_in_user', JSON.stringify(currentUser));
      // Keep state user sync updated if details modified
      const currentFresh = users.find(u => u.id === currentUser.id);
      if (currentFresh && JSON.stringify(currentFresh) !== JSON.stringify(currentUser)) {
        setCurrentUser(currentFresh);
      }
    } else {
      localStorage.removeItem('bloodlink_logged_in_user');
    }
  }, [currentUser, users]);

  useEffect(() => {
    localStorage.setItem('bloodlink_active_request', JSON.stringify(activeRequest));
  }, [activeRequest]);

  useEffect(() => {
    localStorage.setItem('bloodlink_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('bloodlink_logs', JSON.stringify(logs));
  }, [logs]);

  // Sync tabs in real-time for dual testing
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bloodlink_active_request') {
        setActiveRequest(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === 'bloodlink_requests') {
        setRequests(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'bloodlink_users') {
        setUsers(e.newValue ? JSON.parse(e.newValue) : DEFAULT_USERS);
      }
      if (e.key === 'bloodlink_logs') {
        setLogs(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addLog = (type: SimulationLog['type'], message: string) => {
    const newLog: SimulationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.location) {
      setSelectedLocation(user.location);
    }
    addLog('INFO', `🔐 USER LOGIN: User ${user.name} logged in successfully as ${user.role.toUpperCase()}.`);
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('INFO', `🔓 USER LOGOUT: User ${currentUser.name} signed out.`);
    }
    setCurrentUser(null);
  };

  const handleRegister = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    addLog('INFO', `👤 ACCOUNT REGISTERED: New account '${newUser.name}' created as role '${newUser.role.toUpperCase()}'.`);
  };

  const handleVerifyUser = (userId: string, newStatus: 'APPROVED' | 'BANNED') => {
    setUsers((prev) => 
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    const targetUser = users.find(u => u.id === userId);
    addLog('INFO', `🛡️ ADMIN ACTION: Verified account for '${targetUser?.name || 'User'}'. Status updated to ${newStatus}.`);
  };

  const handleBroadcastRequest = (request: BloodRequest) => {
    setActiveRequest(request);
    setRequests((prev) => [request, ...prev]);
  };

  const handleCancelRequest = () => {
    if (activeRequest) {
      addLog('INFO', `❄ Dispatch Cancelled: Hospital canceled alert search radar.`);
      setRequests((prev) => 
        prev.map((r) => (r.id === activeRequest.id ? { ...r, status: 'CANCELLED' } : r))
      );
    }
    setActiveRequest(null);
  };

  const handleSimulateResponse = (donorId: string, response: 'ACCEPTED' | 'REJECTED') => {
    setActiveRequest((prev) => {
      if (!prev) return null;
      
      const updatedResponses = { ...prev.donorResponses, [donorId]: response };
      const donorName = users.find(u => u.id === donorId)?.name || 'Matching Donor';

      if (response === 'ACCEPTED') {
        addLog('ACCEPT', `🤝 PLEDGE CONFIRMED: Volunteer ${donorName} matched coordinates and accepted transit to hospital.`);
      } else {
        addLog('REJECT', `❌ ALERT DECLINED: Volunteer ${donorName} declined coordinates due to congestion/congestion.`);
      }

      // Update requests list as well
      setRequests((prevList) => 
        prevList.map((r) => (r.id === prev.id ? { ...r, donorResponses: updatedResponses } : r))
      );

      return {
        ...prev,
        donorResponses: updatedResponses
      };
    });
  };

  const handleUpdateDonorProfile = (updatedDonor: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedDonor.id ? updatedDonor : u)));
  };

  // Automated Post-Donation workflow
  const handleCompleteDonation = (requestId: string, donorId: string) => {
    const today = '2026-06-01'; // Simulated current date
    const targetReq = requests.find(r => r.id === requestId);
    const targetDonor = users.find(u => u.id === donorId);
    
    if (!targetDonor || !targetReq) return;

    // 1. Create Donation Record
    const newRecord = {
      id: `record-${Date.now()}`,
      date: today,
      hospitalName: targetReq.hospitalName,
      patientName: targetReq.patientName,
      units: 1 // default whole blood bag unit size
    };

    // 2. Update Donor Details: donationHistory and lastDonationDate
    const updatedDonorHistory = targetDonor.donationHistory ? [...targetDonor.donationHistory, newRecord] : [newRecord];
    
    setUsers((prevUsers) => 
      prevUsers.map((u) => (u.id === donorId ? {
        ...u,
        lastDonationDate: today,
        donationHistory: updatedDonorHistory,
        // Immediately trigger cooldown update
        isAvailable: false // Turn off available since they just donated
      } : u))
    );

    // 3. Mark Request Fulfillments
    setRequests((prevList) => 
      prevList.map((r) => (r.id === requestId ? { ...r, status: 'FULFILLED' } : r))
    );
    setActiveRequest(null);

    addLog('FULFILL', `🏆 SUCCESSFUL FULFILLMENT: Patient ${targetReq.patientName}'s blood coordination completed! Donor ${targetDonor.name} completed whole blood draw. Spacing cooldown initiated.`);
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: '🧹 Log stream cleared.'
      }
    ]);
  };

  // Cast Users to Donor schemas safely for maps and dashboard renders
  const donorList: Donor[] = users
    .filter((u) => u.role === 'donor')
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      bloodGroup: u.bloodGroup || 'O-',
      location: u.location || { lat: 50, lng: 50 },
      isAvailable: u.isAvailable || false,
      lastDonationDate: u.lastDonationDate || '2026-01-10',
      gender: u.gender || 'Male',
      age: u.age || 25,
      donationHistory: u.donationHistory || []
    }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* 1. Header ribbon navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 select-none shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-rose-600 p-2 rounded-xl text-white shadow-md shadow-rose-900/10">
              <Droplet className="w-5.5 h-5.5 fill-current animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white font-display">BloodLink</span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-500" /> Rescue dispatch center
              </p>
            </div>
          </div>

          {/* User Status Profile Actions */}
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
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 hover:text-rose-400 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer transition-all shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <span>Secure Authentication Portal</span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main workflow area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Dynamic global warning alert banner for hospitals and admins */}
        {currentUser && currentUser.role !== 'donor' && activeRequest && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-650 bg-red-650 bg-red-650 bg-red-600"></span>
              </span>
              <div>
                <span className="text-[10px] font-black text-rose-800 block uppercase tracking-wide">
                  CRITICAL DISPATCH RADAR ACTIVE
                </span>
                <p className="text-[11px] text-slate-655 font-medium text-slate-600">
                  Target patient {activeRequest.patientName} ({activeRequest.bloodGroup}) at {activeRequest.hospitalName}. Broadcast Range: {radiusKm}km circle.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 select-none">
              <button
                onClick={handleCancelRequest}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Abort dispatch radar
              </button>
            </div>
          </div>
        )}

        {/* Dashboard layouts mapping based on Roles */}
        {!currentUser ? (
          <AuthPortal 
            users={users} 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
          />
        ) : (
          <>
            {currentUser.role === 'donor' && (
              <DonorPortal
                currentUser={currentUser}
                activeRequest={activeRequest}
                onSimulateResponse={handleSimulateResponse}
                onUpdateDonorProfile={handleUpdateDonorProfile}
                onAddLog={addLog}
              />
            )}

            {currentUser.role === 'hospital' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Visual coordinate mapper */}
                <div className="col-span-12 lg:col-span-7 flex flex-col justify-between">
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                        🏥 Hospital Dispatch scanner
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Coordinate radar search vectors matching approved volunteer standby coordinates. Click anywhere inside the grid map to select target coordinates.
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

                {/* Dispatch dashboard */}
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
                    onSimulateResponse={handleSimulateResponse}
                    onCompleteDonation={handleCompleteDonation}
                  />
                </div>
              </div>
            )}

            {currentUser.role === 'admin' && (
              <div className="space-y-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                    🛡️ Administrator command center
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Review pending donor verifications, inspect system databases, monitor active dispatches, and check trace logs.
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
                    currentDateStr="2026-06-01"
                  />
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Credit footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-center text-xs text-slate-400 font-medium select-none">
        <p>© 2026 BloodLink intelligent rescue coordinator ecosystem. Dedicated to accelerating volunteer standby response coordinates.</p>
      </footer>

    </div>
  );
}
