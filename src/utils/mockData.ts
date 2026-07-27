/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Donor, BloodGroup } from '../types';

export interface SimulatedHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export const SIMULATED_HOSPITALS: SimulatedHospital[] = [
  {
    id: 'hosp-1',
    name: 'AIIMS (All India Institute of Medical Sciences), New Delhi',
    lat: 50,
    lng: 50,
    address: 'Ansari Nagar, New Delhi, Delhi 110029'
  },
  {
    id: 'hosp-2',
    name: 'Apollo Hospitals, Jubilee Hills, Hyderabad',
    lat: 25,
    lng: 70,
    address: 'Road No 72, Opposite Bharatiya Vidya Bhavan School, Hyderabad, Telangana 500033'
  },
  {
    id: 'hosp-3',
    name: 'Fortis Hospital, Mulund, Mumbai',
    lat: 75,
    lng: 30,
    address: 'Mulund Goregaon Link Rd, Industrial Area, Mulund West, Mumbai, Maharashtra 400078'
  },
  {
    id: 'hosp-4',
    name: 'Manipal Hospital, HAL Airport Road, Bengaluru',
    lat: 35,
    lng: 35,
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017'
  }
];

export const INITIAL_DONORS: Donor[] = [
  {
    id: 'donor-1',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@gmail.com',
    phone: '+91 98765 43210',
    bloodGroup: 'O-',
    location: { lat: 48, lng: 52 }, // Very close to AIIMS
    isAvailable: true,
    lastDonationDate: '2026-02-15', // Available & Eligible (>56 days)
    gender: 'Male',
    age: 29
  },
  {
    id: 'donor-2',
    name: 'Priya Nair',
    email: 'priya.nair@outlook.com',
    phone: '+91 91234 56789',
    bloodGroup: 'O+',
    location: { lat: 53, lng: 46 }, // Close to AIIMS
    isAvailable: true,
    lastDonationDate: '2026-05-10', // Too recent (Ineligible!)
    gender: 'Female',
    age: 26
  },
  {
    id: 'donor-3',
    name: 'Amit Sharma',
    email: 'amit.sharma99@gmail.com',
    phone: '+91 98712 34567',
    bloodGroup: 'A+',
    location: { lat: 52, lng: 55 }, // Near AIIMS
    isAvailable: true,
    lastDonationDate: '2025-11-20', // Available & Eligible
    gender: 'Male',
    age: 34
  },
  {
    id: 'donor-4',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@yahoo.com',
    phone: '+91 81234 56789',
    bloodGroup: 'A-',
    location: { lat: 27, lng: 68 }, // Close to Apollo Jubilee Hills
    isAvailable: true,
    lastDonationDate: '2026-01-05', // Available & Eligible
    gender: 'Female',
    age: 28
  },
  {
    id: 'donor-5',
    name: 'Vikram Singh',
    email: 'vikram.singh@gmail.com',
    phone: '+91 94444 55555',
    bloodGroup: 'B+',
    location: { lat: 78, lng: 33 }, // Close to Fortis Mulund
    isAvailable: true,
    lastDonationDate: '2026-02-18', // Available & Eligible
    gender: 'Male',
    age: 38
  },
  {
    id: 'donor-6',
    name: 'Ananya Patel',
    email: 'ananya.p@gmail.com',
    phone: '+91 96666 77777',
    bloodGroup: 'B-',
    location: { lat: 73, lng: 28 }, // Close to Fortis Mulund
    isAvailable: false, // Inactive / Unavailable
    lastDonationDate: '2025-10-15',
    gender: 'Female',
    age: 24
  },
  {
    id: 'donor-7',
    name: 'Rahul Verma',
    email: 'rahul.verma@hotmail.com',
    phone: '+91 98300 12345',
    bloodGroup: 'AB+',
    location: { lat: 29, lng: 72 }, // Close to Apollo Jubilee Hills
    isAvailable: true,
    lastDonationDate: '2026-01-20', // Available & Eligible
    gender: 'Male',
    age: 32
  },
  {
    id: 'donor-8',
    name: 'Fatima Begum',
    email: 'fatima.b@gamil.com',
    phone: '+91 90000 11111',
    bloodGroup: 'AB-',
    location: { lat: 33, lng: 33 }, // Close to Manipal Bengaluru
    isAvailable: true,
    lastDonationDate: '2026-05-18', // Too recent (Ineligible!)
    gender: 'Female',
    age: 30
  },
  {
    id: 'donor-9',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@gmail.com',
    phone: '+91 98222 33333',
    bloodGroup: 'O-',
    location: { lat: 36, lng: 37 }, // Close to Manipal Bengaluru
    isAvailable: true,
    lastDonationDate: '2026-03-01', // Available & Eligible
    gender: 'Male',
    age: 41
  },
  {
    id: 'donor-10',
    name: 'Dr. Meera Iyer',
    email: 'meera.iyer@hospital.in',
    phone: '+91 94455 66777',
    bloodGroup: 'O+',
    location: { lat: 85, lng: 15 }, // Remote edge
    isAvailable: true,
    lastDonationDate: '2025-08-12', // Available & Eligible
    gender: 'Female',
    age: 45
  },
  {
    id: 'donor-11',
    name: 'Gurpreet Singh',
    email: 'gurpreet.s@yahoo.co.in',
    phone: '+91 98111 22222',
    bloodGroup: 'A+',
    location: { lat: 46, lng: 49 }, // Very close to AIIMS
    isAvailable: true,
    lastDonationDate: '2026-02-10', // Available & Eligible
    gender: 'Male',
    age: 48
  },
  {
    id: 'donor-12',
    name: 'Divya Teja',
    email: 'divya.teja@gmail.com',
    phone: '+91 80088 99999',
    bloodGroup: 'B+',
    location: { lat: 34, lng: 36 }, // Very close to Manipal Bengaluru
    isAvailable: true,
    lastDonationDate: '2026-05-25', // Too recent!
    gender: 'Female',
    age: 23
  }
];

export const COMMON_CONDITIONS = [
  'Dengue Shock Syndrome (Severe platelet & red cell depletion)',
  'Postpartum Hemorrhage Emergency (Obstetric complications)',
  'Open Heart Bypass Surgery (AIIMS Cardiothoracic ward)',
  'Severe Road Accident Trauma (Emergency Wing)',
  'Thalassemia Major Periodic Blood Transfusion',
  'Acute Leukemia Chemotherapy support'
];
