/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HospitalReference {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export const REFERENCE_HOSPITALS: HospitalReference[] = [
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

export const COMMON_CONDITIONS = [
  'Dengue Shock Syndrome (Severe platelet & red cell depletion)',
  'Postpartum Hemorrhage Emergency (Obstetric complications)',
  'Open Heart Bypass Surgery (AIIMS Cardiothoracic ward)',
  'Severe Road Accident Trauma (Emergency Wing)',
  'Thalassemia Major Periodic Blood Transfusion',
  'Acute Leukemia Chemotherapy support'
];
