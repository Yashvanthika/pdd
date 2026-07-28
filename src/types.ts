/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Location {
  lat: number;   // Grid coordinate Y (scale 0 - 100)
  lng: number;   // Grid coordinate X (scale 0 - 100)
  name?: string;
}

export interface DonationRecord {
  id: string;
  date: string;
  hospitalName: string;
  patientName: string;
  units: number;
}

export interface User {
  id: string;
  email: string;
  role: 'donor' | 'hospital' | 'admin';
  name: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'BANNED';
  createdAt: string;
  
  // Donor specific fields
  bloodGroup?: BloodGroup;
  location?: Location;
  isAvailable?: boolean;
  lastDonationDate?: string;
  gender?: string;
  age?: number;
  donationHistory?: DonationRecord[];

  // Hospital specific fields
  address?: string;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: Location;
  isAvailable: boolean;
  lastDonationDate: string; // YYYY-MM-DD
  gender: string;
  age: number;
  donationHistory?: DonationRecord[];
}

export interface BloodRequest {
  id: string;
  hospitalName: string;
  patientName: string;
  bloodGroup: BloodGroup;
  urgency: UrgencyLevel;
  unitsRequired: number;
  location: Location;
  createdAt: string;
  condition: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
  aiDraftedAlert?: string;
  donorResponses: Record<string, 'PENDING' | 'ACCEPTED' | 'REJECTED'>;
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'MATCH' | 'ALERT' | 'ACCEPT' | 'REJECT' | 'FULFILL';
  message: string;
}
