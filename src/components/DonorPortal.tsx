/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, BloodRequest, BloodGroup } from '../types';
import { calculateDistance, evaluateEligibility, isDonationDateEligible } from '../utils/compatibility';
import { 
  Droplet, MapPin, CheckCircle, Smartphone, Calendar, Info, 
  UserRound, Phone, Mail, Award, Clock, Compass, AlertCircle
} from 'lucide-react';

interface DonorPortalProps {
  currentUser: User;
  activeRequest: BloodRequest | null;
  onSimulateResponse: (donorId: string, response: 'ACCEPTED' | 'REJECTED') => void;
  onUpdateDonorProfile: (updatedDonor: User) => void;
  onAddLog: (type: 'ACCEPT' | 'REJECT' | 'INFO', message: string) => void;
}

export const DonorPortal: React.FC<DonorPortalProps> = ({
  currentUser,
  activeRequest,
  onSimulateResponse,
  onUpdateDonorProfile,
  onAddLog
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(currentUser.bloodGroup || 'O-');
  const [age, setAge] = useState(currentUser.age || 25);
  const [gender, setGender] = useState(currentUser.gender || 'Male');
  const [lastDonation, setLastDonation] = useState(currentUser.lastDonationDate || '2026-01-10');
  const [isEditProfile, setIsEditProfile] = useState(false);

  // Evaluate compatibility and distance for the active request
  const distance = activeRequest && currentUser.location
    ? calculateDistance(activeRequest.location.lat, activeRequest.location.lng, currentUser.location.lat, currentUser.location.lng)
    : 0;

  const currentDateStr = '2026-06-01'; // Simulated current platform date
  
  const eligibility = evaluateEligibility(
    bloodGroup,
    activeRequest?.bloodGroup || 'O-',
    lastDonation,
    currentUser.isAvailable || false,
    currentDateStr
  );

  // Calculate days since last donation for the progress bar
  const daysSinceLast = (() => {
    if (!lastDonation) return 100;
    const diff = new Date(currentDateStr).getTime() - new Date(lastDonation).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const cooldownProgress = Math.min(100, (daysSinceLast / 56) * 100);
  const daysRemaining = Math.max(0, 56 - daysSinceLast);
  const isApproved = currentUser.status === 'APPROVED';

  // Donor can only see alert if compatible, approved, within range, available, and eligible
  const isMatchedInRadius = activeRequest && 
    isApproved && 
    eligibility.eligible && 
    activeRequest.donorResponses[currentUser.id] === 'PENDING';

  const myResponse = activeRequest ? activeRequest.donorResponses[currentUser.id] : undefined;

  const triggerAvailableToggle = () => {
    const updated = { ...currentUser, isAvailable: !currentUser.isAvailable };
    onUpdateDonorProfile(updated);
    onAddLog('INFO', `Donor ${currentUser.name} toggled standby availability: ${updated.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      name,
      email,
      phone,
      bloodGroup,
      age,
      gender,
      lastDonationDate: lastDonation
    };
    onUpdateDonorProfile(updated);
    setIsEditProfile(false);
    onAddLog('INFO', `Volunteer ${currentUser.name} updated profile details.`);
  };

  const handleLocationChange = (lat: number, lng: number) => {
    const updated = {
      ...currentUser,
      location: { lat, lng }
    };
    onUpdateDonorProfile(updated);
    onAddLog('INFO', `Volunteer ${currentUser.name} relocated standings on grid map to: Lat ${lat}, Lng ${lng}`);
  };

  const handleAccept = () => {
    if (!activeRequest) return;
    onSimulateResponse(currentUser.id, 'ACCEPTED');
    onAddLog('ACCEPT', `🤝 DONOR PLEDGE: Volunteer ${currentUser.name} accepted request for patient ${activeRequest.patientName}.`);
  };

  const handleDecline = () => {
    if (!activeRequest) return;
    onSimulateResponse(currentUser.id, 'REJECTED');
    onAddLog('REJECT', `❌ DISPATCH DECLINED: Volunteer ${currentUser.name} declined request from ${activeRequest.hospitalName}.`);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      
      {/* LEFT COLUMN: Profile & Spacing Indicator */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-rose-500 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            {bloodGroup} Group
          </div>
          
          <div className="flex items-center gap-4.5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
              <UserRound className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">{currentUser.name}</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Award className="w-3.5 h-3.5 text-rose-500" /> Standby Donor Node
              </p>
            </div>
          </div>

          {/* Account Status Flag */}
          <div className="mb-6 select-none">
            {isApproved ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified standby donor profile active.</span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-semibold animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span>Pending verification approval.</span>
                  <p className="text-[9px] font-normal text-slate-500 mt-0.5">Administrator review required to enter matching grids.</p>
                </div>
              </div>
            )}
          </div>

          {!isEditProfile ? (
            <div className="space-y-4">
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{currentUser.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Grid Map Pin: <strong className="font-mono text-slate-800">Lat {currentUser.location?.lat}, Lng {currentUser.location?.lng}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Compass className="w-4 h-4 text-slate-400" />
                  <span>Age: {age} • Gender: {gender}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="text-slate-800 block">Dispatch Availability</span>
                  <span className="text-[10px] text-slate-400 font-normal">Toggle radar standby alerts</span>
                </div>
                <button
                  onClick={triggerAvailableToggle}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    currentUser.isAvailable ? 'bg-rose-600' : 'bg-slate-350 bg-slate-300'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    currentUser.isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <button
                onClick={() => setIsEditProfile(true)}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-205 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Modify Donor Profile Info
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-3.5 border-t border-slate-100 pt-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  >
                    {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Last Whole Blood Donation Date</label>
                <input
                  type="date"
                  required
                  value={lastDonation}
                  onChange={(e) => setLastDonation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfile(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Donation Cooldown progress */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase font-mono mb-4">
            <Clock className="w-4 h-4 text-rose-500" /> Donation Frequency Cooldown
          </h4>

          <div className="space-y-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Days since donation:</span>
              <span className="text-slate-800">{daysSinceLast} days</span>
            </div>

            {/* Visual indicator bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className={`h-full transition-all duration-500 ${
                  eligibility.dateEligible ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${cooldownProgress}%` }}
              ></div>
            </div>

            {eligibility.dateEligible ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] p-3 rounded-xl leading-relaxed">
                ✅ <strong>56-day gap complete.</strong> You are physically eligible to donate whole blood.
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 text-amber-700 text-[11px] p-3 rounded-xl leading-relaxed">
                ❄ <strong>Donation spacing interval incomplete.</strong> You have <strong>{daysRemaining} days</strong> remaining in the safety cooldown period.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Active Emergency alerts & Donation History */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Active Emergency alerts notification */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Live Dispatch Alerts</h3>
              <p className="text-[10px] text-slate-500 font-medium">Notifications of critical matching alerts in your area</p>
            </div>
            {isMatchedInRadius && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </div>

          {/* ringing notification layout */}
          {isMatchedInRadius ? (
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest font-mono">🚨 URGENT MATCH ALERT</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  activeRequest.urgency === 'CRITICAL' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-150 bg-amber-100 text-amber-700'
                }`}>
                  {activeRequest.urgency} PRIORITY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Emergency Facility</span>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">{activeRequest.hospitalName}</h4>
                  <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Coordinate distance: {distance} km away
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-1.5 mb-1.5 font-medium">
                    <span className="text-slate-400">Required Type:</span>
                    <span className="text-red-600 font-bold bg-rose-50 px-1.5 rounded">{activeRequest.bloodGroup}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-450 text-slate-400">Required Units:</span>
                    <span className="text-slate-855 text-slate-800">{activeRequest.unitsRequired} Bag(s)</span>
                  </div>
                </div>
              </div>

              {activeRequest.aiDraftedAlert && (
                <div className="bg-slate-900 border border-slate-800 text-slate-350 p-4 rounded-xl relative">
                  <span className="absolute top-2.5 right-2.5 text-[8px] bg-slate-800 text-slate-450 px-1.5 py-0.25 rounded font-bold uppercase tracking-wider font-mono">SMS Payload</span>
                  <p className="text-xs italic leading-relaxed text-slate-100 font-serif pr-10">
                    "{activeRequest.aiDraftedAlert}"
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-150">
                <button
                  onClick={handleDecline}
                  className="bg-white hover:bg-slate-50 text-slate-655 text-slate-600 font-bold text-xs py-2 px-5 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                >
                  Decline Alert
                </button>
                <button
                  onClick={handleAccept}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md shadow-rose-900/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Droplet className="w-4 h-4 fill-current" /> Accept Pledge Route
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              {/* Display response status if already answered */}
              {activeRequest && myResponse ? (
                <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                  myResponse === 'ACCEPTED' 
                    ? 'bg-emerald-50 border-emerald-250 border-emerald-200 text-emerald-800 font-semibold' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${myResponse === 'ACCEPTED' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <div>
                      <h5 className="font-bold text-slate-800">Your Response: {myResponse}</h5>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {myResponse === 'ACCEPTED' 
                          ? 'Thank you! The hospital coordinator has been notified of your transit status.' 
                          : 'You declined this search alert.'}
                      </p>
                    </div>
                  </div>
                  {myResponse === 'ACCEPTED' && (
                    <span className="text-[9px] bg-emerald-100 border border-emerald-200 font-mono text-emerald-700 px-2 py-0.5 rounded-md font-bold animate-pulse">
                      ROUTE ACTIVE
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Smartphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Awaiting Signal Alerts</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto">
                    {currentUser.isAvailable 
                      ? 'Standby grid coordinates active. Matches within range will push here in real-time.' 
                      : 'Radar deactivated. Toggle your availability status to receive emergency requests.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Donation history lists */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Whole Blood Donation History</h3>
          
          <div className="overflow-x-auto">
            {!currentUser.donationHistory || currentUser.donationHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50/40 rounded-2xl border border-slate-100 select-none">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400">No donations registered yet</p>
                <p className="text-[9px] text-slate-450 text-slate-400 mt-1">Once completed donations are validated by hospitals, they will display here.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-500 border-collapse select-none">
                <thead className="bg-slate-55 bg-slate-50 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Donation Date</th>
                    <th className="px-4 py-2">Facility / Hospital</th>
                    <th className="px-4 py-2">Patient Referral</th>
                    <th className="px-4 py-2 text-center">Bags Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentUser.donationHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800 font-mono text-[10px]">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        🏥 {record.hospitalName}
                      </td>
                      <td className="px-4 py-3 text-slate-655 text-slate-600">
                        {record.patientName}
                      </td>
                      <td className="px-4 py-3 text-center text-rose-600 font-bold bg-rose-50/40 font-mono">
                        {record.units} Unit
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
