import type { BloodGroup } from './bloodGroups';

export interface DonorProfile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  bloodGroup: BloodGroup;
  yearOfBirth: number;
  country: 'INDIA';
  state: string;
  district: string;
  city: string;
  availableInEmergency: boolean;
  displayConsent: boolean;
  lastDonationDate?: string | null;
  lastDonationFacility?: string | null;
  lastDonationBloodGroup?: BloodGroup | null;
  lastDonationUnits?: number | null;
  lastDonationState?: string | null;
  lastDonationDistrict?: string | null;
  lastDonationCity?: string | null;
  lastDonationNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonorSearchResult {
  id: string;
  fullName: string;
  phone: string;
  bloodGroup: BloodGroup;
  country: 'INDIA';
  state: string;
  district: string;
  city: string;
  availableInEmergency: boolean;
  lastDonationDate?: string | null;
}

export interface RegisterDonorInput {
  firebaseIdToken: string;
  email: string;
  password: string;
  phone: string;
  fullName: string;
  bloodGroup: BloodGroup;
  yearOfBirth: number;
  state: string;
  district: string;
  city: string;
  availableInEmergency: boolean;
  displayConsent: boolean;
}
