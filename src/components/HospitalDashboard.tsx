/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BloodGroup, UrgencyLevel, BloodRequest, User, Location, SimulationLog } from '../types';
import { isBloodCompatible, calculateDistance, evaluateEligibility } from '../utils/compatibility';
import { SIMULATED_HOSPITALS, COMMON_CONDITIONS } from '../utils/mockData';
import { 
  ShieldAlert, Radio, Flame, Sparkles, Send, Users, 
  Check, Clock, RotateCcw, Droplet, MapPin, Phone, 
  CheckCircle, History, Landmark, ClipboardList
} from 'lucide-react';

interface HospitalDashboardProps {
  currentUser: User;
  donors: User[]; // All donors
  activeRequest: BloodRequest | null;
  requests: BloodRequest[]; // Active and past requests
  onBroadcastRequest: (request: BloodRequest) => void;
  onCancelRequest: () => void;
  selectedLocation: Location;
  onSelectLocation: (loc: Location) => void;
  radiusKm: number;
  onSetRadiusKm: (radius: number) => void;
  logs: SimulationLog[];
  onAddLog: (type: SimulationLog['type'], message: string) => void;
  onSimulateResponse: (donorId: string, response: 'ACCEPTED' | 'REJECTED') => void;
  onCompleteDonation: (requestId: string, donorId: string) => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  currentUser,
  donors,
  activeRequest,
  requests,
  onBroadcastRequest,
  onCancelRequest,
  selectedLocation,
  onSelectLocation,
  radiusKm,
  onSetRadiusKm,
  logs,
  onAddLog,
  onSimulateResponse,
  onCompleteDonation
}) => {
  // Request builder states
  const [patientName, setPatientName] = useState('Rohan Joshi');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [urgency, setUrgency] = useState<UrgencyLevel>('HIGH');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [condition, setCondition] = useState(COMMON_CONDITIONS[0]);

  // Gemini & System state loaders
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [draftedSms, setDraftedSms] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const hospitalName = currentUser.name;

  // Filter approved and eligible donors in radius
  const eligibleDonors = donors.filter(donor => {
    if (donor.role !== 'donor' || donor.status !== 'APPROVED') return false;
    const dist = calculateDistance(selectedLocation.lat, selectedLocation.lng, donor.location?.lat || 0, donor.location?.lng || 0);
    const eligibility = evaluateEligibility(
      donor.bloodGroup || 'O-',
      bloodGroup,
      donor.lastDonationDate || '2026-01-10',
      donor.isAvailable || false,
      '2026-06-01'
    );
    return eligibility.eligible && dist <= radiusKm;
  });

  // Draft dispatch alert using Gemini API
  const draftSmsWithGemini = async () => {
    setIsDraftingAI(true);
    setDraftedSms('');
    
    try {
      const response = await fetch('/api/gemini/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalName,
          patientName,
          bloodGroup,
          urgency,
          unitsRequired,
          condition
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDraftedSms(data.alertMessage);
        onAddLog('INFO', `Gemini AI drafted emergency alert SMS: "${data.alertMessage.substring(0, 45)}..."`);
      } else {
        throw new Error(data.error || 'Server error.');
      }
    } catch (err: any) {
      console.error('Gemini call failed, template fallback', err);
      const fallback = `🚨 EMERGENCY ALERT 🚨\n${hospitalName} needs Type ${bloodGroup} blood for patient ${patientName}. Units required: ${unitsRequired}. Tap to accept route coordinating.`;
      setDraftedSms(fallback);
      onAddLog('INFO', 'Formulated local medical outreach template (Gemini API offline).');
    } finally {
      setIsDraftingAI(false);
    }
  };

  const executeBroadcast = () => {
    if (broadcasting) return;
    setBroadcasting(true);

    const baseSms = draftedSms || `🚨 CRITICAL 🚨\n${hospitalName} requires ${unitsRequired} units of type ${bloodGroup} blood for patient ${patientName}. Match radius is ${radiusKm}km.`;

    const donorResponses: Record<string, 'PENDING' | 'ACCEPTED' | 'REJECTED'> = {};
    eligibleDonors.forEach((d) => {
      donorResponses[d.id] = 'PENDING';
    });

    const newRequest: BloodRequest = {
      id: `req-${Date.now()}`,
      hospitalName,
      patientName,
      bloodGroup,
      urgency,
      unitsRequired,
      location: selectedLocation,
      createdAt: new Date().toISOString(),
      condition,
      status: 'ACTIVE',
      aiDraftedAlert: baseSms,
      donorResponses
    };

    onBroadcastRequest(newRequest);
    onAddLog('ALERT', `🚨 DISPATCH LAUNCHED: Transmitting coordinates search alert to ${eligibleDonors.length} compatible volunteers within ${radiusKm}km.`);

    // Simulate standard response delay timers for mock donors
    eligibleDonors.forEach((donor, i) => {
      // Simulate accept / reject based on a reasonable probability (e.g. 75% accept for O-)
      const isAccept = Math.random() < 0.75;
      const delay = 2000 + (i * 2500) + (Math.random() * 1000);

      setTimeout(() => {
        onSimulateResponse(donor.id, isAccept ? 'ACCEPTED' : 'REJECTED');
      }, delay);
    });

    setBroadcasting(false);
  };

  // Historic requests list
  const historicRequests = requests.filter(r => r.status !== 'ACTIVE' && r.hospitalName === hospitalName);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 h-full flex flex-col justify-between font-sans">
      
      {/* Toggle Layout (Request builder vs History) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 select-none">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">{hospitalName}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hospital Coordinator Dashboard</p>
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-150 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 cursor-pointer transition-colors"
        >
          {showHistory ? <ClipboardList className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
          <span>{showHistory ? 'Request Builder' : 'History Log'}</span>
        </button>
      </div>

      {showHistory ? (
        /* HISTORY VIEW */
        <div className="flex-1 flex flex-col justify-between h-[450px]">
          <div className="space-y-4 overflow-y-auto max-h-[380px] my-2 pr-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" /> Past Fulfillments & Dispatches
            </h4>

            {historicRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-slate-150">
                <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold">No historic logs registered</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Completed dispatch cycles will list details here.</p>
              </div>
            ) : (
              historicRequests.map((req) => (
                <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{req.patientName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] ${
                      req.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-655 text-slate-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 border-t border-slate-200/50 pt-2 font-medium">
                    <div>Type: <strong className="text-red-650 bg-rose-50 px-1 rounded">{req.bloodGroup}</strong></div>
                    <div>Units: <strong className="text-slate-755 text-slate-700">{req.unitsRequired} bags</strong></div>
                    <div className="text-right">{req.createdAt.split('T')[0]}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setShowHistory(false)}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
          >
            Return to Dispatch Center
          </button>
        </div>
      ) : activeRequest ? (
        /* MONITOR ACTIVE REQUEST VIEW */
        <div id="active-request-monitor" className="flex flex-col h-full justify-between gap-4">
          <div className="flex-1 space-y-4">
            
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75 bg-rose-400"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
                <span className="text-xs font-black text-slate-855 uppercase tracking-wider text-slate-800">EMERGENCY BROADCAST ACTIVE</span>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                activeRequest.urgency === 'CRITICAL' ? 'bg-red-105 bg-red-100 text-red-700 animate-pulse' :
                activeRequest.urgency === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {activeRequest.urgency}
              </span>
            </div>

            <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Emergency Patient:</span>
                <span className="font-semibold text-slate-800">{activeRequest.patientName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-555 text-slate-500 font-medium">Required Group:</span>
                <span className="font-extrabold text-red-600 bg-red-50 px-1.5 rounded">{activeRequest.bloodGroup}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-555 text-slate-500 font-medium">Volume Required:</span>
                <span className="font-semibold text-slate-800">{activeRequest.unitsRequired} Bag(s)</span>
              </div>
              <p className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
                📋 Diagnose Condition: <span className="text-slate-700">{activeRequest.condition}</span>
              </p>
            </div>

            {/* AI message transmitter */}
            {activeRequest.aiDraftedAlert && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1 text-[9px] font-bold text-rose-600 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  SMS COORD OUTREACH TEXT
                </div>
                <p className="text-[11px] text-slate-655 leading-relaxed font-serif italic text-slate-600">
                  "{activeRequest.aiDraftedAlert}"
                </p>
              </div>
            )}

            {/* Live Responses Tracker metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" /> Matching Candidates Response HUD
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center">
                  <div className="text-base font-black text-emerald-600">
                    {Object.values(activeRequest.donorResponses).filter(v => v === 'ACCEPTED').length}
                  </div>
                  <div className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider">Pledged</div>
                </div>
                <div className="bg-slate-50 border border-slate-205 border-slate-200 p-2 rounded-lg text-center">
                  <div className="text-base font-black text-slate-600">
                    {Object.values(activeRequest.donorResponses).filter(v => v === 'REJECTED').length}
                  </div>
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Declined</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-center">
                  <div className="text-base font-black text-amber-600">
                    {Object.values(activeRequest.donorResponses).filter(v => v === 'PENDING').length}
                  </div>
                  <div className="text-[8px] text-amber-700 font-bold uppercase tracking-wider">Awaiting</div>
                </div>
              </div>

              {/* Matched Details Scroll pane */}
              <div className="max-h-[130px] overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50 select-none">
                {Object.keys(activeRequest.donorResponses).length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No active eligible donors found in coordinates radius.
                  </div>
                ) : (
                  Object.entries(activeRequest.donorResponses).map(([donorId, response]) => {
                    const donorObj = donors.find(d => d.id === donorId);
                    const isAccepted = response === 'ACCEPTED';
                    const isRejected = response === 'REJECTED';
                    const dist = donorObj && donorObj.location
                      ? calculateDistance(activeRequest.location.lat, activeRequest.location.lng, donorObj.location.lat, donorObj.location.lng)
                      : 0;

                    return (
                      <div key={donorId} className="bg-white border border-slate-100 rounded-xl p-2.5 flex flex-col gap-2 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-800">
                              {donorObj?.name || 'Standby Volunteer'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Type {donorObj?.bloodGroup} • {dist}km away
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            {isAccepted ? (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                <Check className="w-3 h-3" /> Pledged
                              </span>
                            ) : isRejected ? (
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Declined
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-600 font-medium animate-pulse flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" /> Alerted...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* REVEAL CONTACT DETAILS UPON DONOR ACCEPTING */}
                        {isAccepted && donorObj && (
                          <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-lg p-2 flex flex-col gap-1 text-[10px] text-slate-600 animate-slideDown">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Phone: <strong className="text-slate-800 font-mono">{donorObj.phone}</strong></span>
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-emerald-100/60">
                              <span className="text-[9px] text-slate-400">Pledge secured. Ready to draw?</span>
                              <button
                                onClick={() => onCompleteDonation(activeRequest.id, donorObj.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer transition-colors shadow-sm"
                              >
                                Mark Donated Completed
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          <button
            onClick={onCancelRequest}
            className="w-full bg-slate-850 hover:bg-slate-900 bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Abort Dispatch Broadcast
          </button>
        </div>
      ) : (
        /* CREATE REQUEST VIEW */
        <div id="new-request-builder" className="flex flex-col h-full justify-between gap-4">
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Broadcast Emergency Scanner</h3>
                <p className="text-[10px] text-slate-400">Search compatible donor coordinates in neighborhood</p>
              </div>
            </div>

            {/* Patient Name and Blood Group Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-855 text-slate-800 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Blood Group Needed</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full bg-slate-50 border border-slate-205 border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-855 focus:outline-none font-bold text-red-655"
                >
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bg) => (
                    <option key={bg} value={bg}>
                      🩸 {bg} type
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgency and Quantity Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Urgency Priority</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full bg-slate-50 border border-slate-205 border-slate-200 text-xs px-3 py-1.5 rounded-lg font-bold focus:outline-none"
                  style={{
                    color: urgency === 'CRITICAL' ? '#dc2626' : urgency === 'HIGH' ? '#ea580c' : '#2563eb'
                  }}
                >
                  <option value="CRITICAL">🔴 CRITICAL</option>
                  <option value="HIGH">🟠 HIGH</option>
                  <option value="MEDIUM">🟡 MEDIUM</option>
                  <option value="LOW">🔵 LOW</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bags Units Needed</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={unitsRequired}
                  onChange={(e) => setUnitsRequired(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-205 border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none text-center font-bold"
                />
              </div>
            </div>

            {/* Diagnostics trauma profile */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Diagnosis Condition / Profile</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-800 focus:outline-none"
              >
                {COMMON_CONDITIONS.map((cond, index) => (
                  <option key={index} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            {/* Proximity Match Radius slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>📍 SCANNER BROADCAST RADII</span>
                <span className="text-rose-600 font-mono text-xs">{radiusKm} km Circle Range</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="0.5"
                value={radiusKm}
                onChange={(e) => onSetRadiusKm(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
            </div>

            {/* Matching Donor Count Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-semibold select-none">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-500 font-medium">Eligible & Approved standby pool:</span>
              </div>
              <span className="font-extrabold text-xs text-slate-800 bg-white border border-slate-200 px-3 py-0.5 rounded-md min-w-[35px] text-center">
                {eligibleDonors.length} Donors
              </span>
            </div>

            {/* AI SMS alert generation call */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <button
                onClick={draftSmsWithGemini}
                disabled={isDraftingAI}
                className="w-full bg-rose-50 border border-rose-100 hover:bg-rose-100/50 text-rose-700 font-bold text-[10px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                {isDraftingAI ? 'Generating with Gemini...' : 'Draft SMS Alert message with Gemini'}
              </button>

              {draftedSms && (
                <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3 relative">
                  <span className="absolute top-2 right-2 text-[8px] bg-rose-100 border border-rose-200 text-rose-700 px-1.5 py-0.25 rounded font-bold uppercase tracking-wider font-mono">SMS Preview</span>
                  <p className="text-[11px] text-slate-655 leading-relaxed font-serif italic text-slate-600 pr-12">
                    "{draftedSms}"
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Trigger Dispatch */}
          <button
            onClick={executeBroadcast}
            disabled={eligibleDonors.length === 0}
            className={`w-full text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all ${
              eligibleDonors.length === 0 
                ? 'bg-slate-200 text-slate-400 pointer-events-none' 
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Radio className="w-4.5 h-4.5 animate-pulse" />
            Deploy Emergency Search
          </button>
        </div>
      )}
    </div>
  );
};
