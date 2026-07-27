/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, BloodGroup, SimulationLog, Location, BloodRequest } from '../types';
import { isBloodCompatible, evaluateEligibility } from '../utils/compatibility';
import { 
  Users, Calendar, HelpCircle, Terminal, ClipboardCheck, 
  ShieldAlert, Activity, Droplet, Eye, Trash2, Check, X,
  FileCheck, Shield, BarChart3, Database
} from 'lucide-react';

interface RegistrySettingsProps {
  currentUser: User;
  users: User[];
  requests: BloodRequest[];
  onVerifyUser: (userId: string, newStatus: 'APPROVED' | 'BANNED') => void;
  logs: SimulationLog[];
  onClearLogs: () => void;
  currentDateStr?: string;
}

export const RegistrySettings: React.FC<RegistrySettingsProps> = ({
  currentUser,
  users,
  requests,
  onVerifyUser,
  logs,
  onClearLogs,
  currentDateStr = '2026-06-01'
}) => {
  const [viewTab, setViewTab] = useState<'verification' | 'database' | 'requests'>('verification');

  // Compute analytics metrics
  const totalUsers = users.length;
  const totalDonors = users.filter(u => u.role === 'donor').length;
  const totalHospitals = users.filter(u => u.role === 'hospital').length;
  const pendingDonors = users.filter(u => u.role === 'donor' && u.status === 'PENDING').length;
  const activeAlerts = requests.filter(r => r.status === 'ACTIVE').length;
  const fulfilledAlerts = requests.filter(r => r.status === 'FULFILLED').length;
  const totalAlerts = requests.length;

  const fulfillmentRate = totalAlerts > 0 
    ? Math.round((fulfilledAlerts / totalAlerts) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 font-sans">
      
      {/* 1. Core Analytics Metrics Widget row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Metric 1 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Donors</span>
            <span className="text-2xl font-black text-slate-900 font-display mt-1 block">
              {totalDonors}
            </span>
            {pendingDonors > 0 && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.25 rounded-md mt-1.5 inline-block animate-pulse">
                {pendingDonors} Pending verification
              </span>
            )}
          </div>
          <div className="bg-rose-50 p-3 rounded-xl text-rose-500 border border-rose-100">
            <Droplet className="w-5 h-5 fill-rose-500/10" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Medical Centers</span>
            <span className="text-2xl font-black text-slate-900 font-display mt-1 block">
              {totalHospitals}
            </span>
            <span className="text-[9px] font-medium text-slate-400 mt-1.5 inline-block">Active Hospital Hubs</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-500 border border-blue-100">
            <LandmarkIcon />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Dispatches</span>
            <span className="text-2xl font-black text-slate-900 font-display mt-1 block">
              {activeAlerts}
            </span>
            <span className="text-[9px] font-medium text-slate-400 mt-1.5 inline-block">Real-time matching active</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600 border border-rose-100 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fulfillment Rate</span>
            <span className="text-2xl font-black text-slate-900 font-display mt-1 block">
              {fulfillmentRate}%
            </span>
            <span className="text-[9px] font-medium text-slate-400 mt-1.5 inline-block">
              {fulfilledAlerts} of {totalAlerts} completed
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 border border-emerald-100">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. Main Admin Workspace splitting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left & Middle columns: Data lists panel */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Section Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 border border-slate-200/60 select-none">
            <button
              onClick={() => setViewTab('verification')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewTab === 'verification'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Pending Verifications ({pendingDonors})</span>
            </button>
            <button
              onClick={() => setViewTab('database')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewTab === 'database'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Registered Accounts</span>
            </button>
            <button
              onClick={() => setViewTab('requests')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewTab === 'requests'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Audit Requests ({totalAlerts})</span>
            </button>
          </div>

          {/* VIEW: PENDING REGISTRATIONS */}
          {viewTab === 'verification' && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pending Donor Verifications</span>
                <span className="text-[10px] text-slate-500">Requires review to enter emergency radar match pool</span>
              </div>

              {users.filter(u => u.role === 'donor' && u.status === 'PENDING').length === 0 ? (
                <div className="text-center py-16 text-slate-450 text-slate-400 select-none bg-white">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-450 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-655 text-slate-600">Verification Queue Empty</p>
                  <p className="text-[10px] mt-1 text-slate-400">All registered volunteers are fully active in standbys.</p>
                </div>
              ) : (
                <div className="overflow-x-auto select-none bg-white">
                  <table className="w-full text-left text-xs text-slate-500 border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-4 py-2">Donor Name</th>
                        <th className="px-4 py-2 text-center">Group</th>
                        <th className="px-4 py-2">Contact Details</th>
                        <th className="px-4 py-2 text-center">Action Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {users
                        .filter(u => u.role === 'donor' && u.status === 'PENDING')
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              <div>{u.name}</div>
                              <div className="text-[9px] text-slate-400 font-normal">Age {u.age} • {u.gender} • Coord ({u.location?.lat}, {u.location?.lng})</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-extrabold text-red-650 bg-rose-50 text-red-650 px-2 py-0.5 rounded border border-rose-100">
                                {u.bloodGroup}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px]">
                              <div>{u.email}</div>
                              <div className="text-slate-400">{u.phone}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => onVerifyUser(u.id, 'BANNED')}
                                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 cursor-pointer transition-colors"
                                  title="Reject & Suspend Account"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onVerifyUser(u.id, 'APPROVED')}
                                  className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 cursor-pointer transition-colors"
                                  title="Approve standby volunteer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: REGISTERED ACCOUNTS */}
          {viewTab === 'database' && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">BloodLink Registered Accounts Database</span>
              </div>
              <div className="overflow-x-auto select-none bg-white">
                <table className="w-full text-left text-xs text-slate-500 border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-4 py-2">User details</th>
                      <th className="px-4 py-2 text-center">System Role</th>
                      <th className="px-4 py-2 text-center">Standby Status</th>
                      <th className="px-4 py-2">Phone & Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          <div>{u.name}</div>
                          {u.role === 'donor' && (
                            <div className="text-[9px] text-rose-600">Type {u.bloodGroup} • Age {u.age}</div>
                          )}
                          {u.role === 'hospital' && (
                            <div className="text-[9px] text-blue-600 font-medium">{u.address || 'Medical Facility'}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded ${
                            u.role === 'admin' ? 'bg-slate-900 text-white' :
                            u.role === 'hospital' ? 'bg-blue-105 bg-blue-100 text-blue-800' : 'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                            u.status === 'BANNED' ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[9px]">
                          <div>{u.email}</div>
                          <div className="text-slate-400">{u.phone}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: AUDIT DISPATCH REQUESTS */}
          {viewTab === 'requests' && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Auditing Emergency Requests Trail</span>
              </div>
              
              {requests.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white">
                  <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">No requests generated yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto select-none bg-white">
                  <table className="w-full text-left text-xs text-slate-500 border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-4 py-2">Patient details</th>
                        <th className="px-4 py-2">Hospital facility</th>
                        <th className="px-4 py-2 text-center font-mono">Bags</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {requests.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <div>{r.patientName}</div>
                            <div className="text-[9px] text-slate-400 font-normal">Need Type <strong className="text-red-650 bg-rose-50 px-1 rounded">{r.bloodGroup}</strong> • {r.urgency} Urgency</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 text-xs">
                            🏥 {r.hospitalName}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800 font-mono">
                            {r.unitsRequired}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'ACTIVE' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                              r.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-150 text-slate-500'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right column: Compatibility matrix & Console logs */}
        <div className="space-y-6">
          
          {/* Scientific Matching Grid */}
          <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 select-none">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Science RBC Match Grid</h4>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-medium mb-3">
              Medical Red Blood Cell compatibility chart validation matrix.
            </p>

            <div className="grid grid-cols-9 gap-1 text-[8px] text-center font-mono">
              <div className="font-bold text-slate-400">Recip \ Donor</div>
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bg) => (
                <div key={bg} className="font-bold bg-slate-200 text-slate-800 rounded py-0.5">{bg}</div>
              ))}

              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((recipient) => (
                <React.Fragment key={`row-${recipient}`}>
                  <div className="font-bold bg-slate-100 text-slate-800 flex items-center justify-center rounded">{recipient}</div>
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((donor) => {
                    const compatible = isBloodCompatible(donor as BloodGroup, recipient as BloodGroup);
                    return (
                      <div
                        key={`cell-${recipient}-${donor}`}
                        className={`rounded py-1 font-bold ${compatible ? 'bg-emerald-100 text-emerald-855 text-emerald-700' : 'bg-slate-100 text-slate-300'}`}
                      >
                        {compatible ? '✔' : ''}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Console logger */}
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900 text-slate-200 font-mono text-[10px] flex flex-col justify-between h-[255px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 select-none">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live signal auditing trace</span>
              </div>
              <button
                onClick={onClearLogs}
                className="text-[9px] text-slate-400 hover:text-slate-100 bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 my-1.5 max-h-[175px] scrollbar-thin select-none">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-10">
                  [Awaiting signal logs...]
                </div>
              ) : (
                logs.map((log) => {
                  let colorClass = 'text-slate-350';
                  if (log.type === 'ALERT') colorClass = 'text-rose-400 font-semibold';
                  if (log.type === 'ACCEPT') colorClass = 'text-emerald-400 font-bold';
                  if (log.type === 'REJECT') colorClass = 'text-orange-300';
                  if (log.type === 'FULFILL') colorClass = 'text-blue-400 font-semibold';
                  if (log.type === 'MATCH') colorClass = 'text-indigo-400';

                  return (
                    <div key={log.id} className="leading-normal flex gap-1 items-start text-[9px]">
                      <span className="text-slate-500 shrink-0">[{log.timestamp.split('T')[1].substring(0, 8)}]</span>
                      <span className={`${colorClass}`}>
                        <span dangerouslySetInnerHTML={{ __html: log.message }} />
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-right text-[8px] text-slate-500 select-none">
              System Audit Mode • {currentDateStr}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

// Internal mini SVG icons helper
const LandmarkIcon = () => (
  <svg className="w-5 h-5 text-blue-500 fill-blue-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10h18M5 10v11M19 10v11M12 10v11M4 6l8-4 8 4M10 10l2 11M14 10l-2 11" />
  </svg>
);
