export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'A1+',
  'A1-',
  'A1B+',
  'A1B-',
  'A2+',
  'A2-',
  'A2B+',
  'A2B-',
  'AB+',
  'AB-',
  'B+',
  'B-',
  'O+',
  'O-',
  'Bombay Blood Group',
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
