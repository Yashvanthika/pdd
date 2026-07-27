/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BloodGroup } from '../types';

/**
 * Checks if a donor's blood group is compatible with a recipient's blood group (Red Blood Cells).
 * 
 * Compatibility Matrix:
 * O- can give to ALL (Universal Donor)
 * O+ can give to O+, A+, B+, AB+
 * A- can give to A-, A+, AB-, AB+
 * A+ can give to A+, AB+
 * B- can give to B-, B+, AB-, AB+
 * B+ can give to B+, AB+
 * AB- can give to AB-, AB+
 * AB+ can give to AB+ only (Universal Recipient can receive from ALL)
 */
export function isBloodCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  const compatibilityMap: Record<BloodGroup, BloodGroup[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };

  return compatibilityMap[donorGroup]?.includes(recipientGroup) || false;
}

/**
 * Calculates if a donor is physically eligible based on their last donation date.
 * Standard interval is 3 months (90 days) or 56 days (8 weeks) for whole blood.
 * We'll check if the difference is at least 56 days.
 */
export function isDonationDateEligible(lastDonationDate: string, currentDateStr: string = '2026-05-31'): boolean {
  if (!lastDonationDate) return true;
  
  const lastDate = new Date(lastDonationDate);
  const current = new Date(currentDateStr);
  
  // Calculate difference in days
  const diffTime = current.getTime() - lastDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 56;
}

/**
 * Calculates Euclidean style distance in Kilometers for our grid coordinates.
 * Let's assume 1 grid unit corresponds to roughly 0.15 km to make a tight neighborhood simulation of 0 to 15km range.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dx = lng1 - lng2;
  const dy = lat1 - lat2;
  const distanceUnits = Math.sqrt(dx * dx + dy * dy);
  
  // Convert units to kilometers (~0.12 km per unit)
  return parseFloat((distanceUnits * 0.12).toFixed(1));
}

/**
 * Checks overall eligibility
 */
export interface EligibilityDetail {
  eligible: boolean;
  bloodCompatible: boolean;
  dateEligible: boolean;
  available: boolean;
  reason: string[];
}

export function evaluateEligibility(
  donorGroup: BloodGroup, 
  recipientGroup: BloodGroup, 
  lastDonationDate: string, 
  isAvailable: boolean,
  currentDateStr: string = '2026-05-31'
): EligibilityDetail {
  const bloodCompatible = isBloodCompatible(donorGroup, recipientGroup);
  const dateEligible = isDonationDateEligible(lastDonationDate, currentDateStr);
  
  const reason: string[] = [];
  if (!bloodCompatible) reason.push(`Incompatible blood group (${donorGroup} with patient's ${recipientGroup})`);
  if (!dateEligible) reason.push('Donation interval < 56 days from last donation');
  if (!isAvailable) reason.push('Donor status set to Unavailable');

  const eligible = bloodCompatible && dateEligible && isAvailable;

  return {
    eligible,
    bloodCompatible,
    dateEligible,
    available: isAvailable,
    reason: eligible ? ['Meets all eligibility criteria'] : reason
  };
}
