export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const indianLocations = [
  { country: 'India', state: 'Kerala', district: 'Ernakulam', city: 'Kochi' },
  { country: 'India', state: 'Kerala', district: 'Thiruvananthapuram', city: 'Thiruvananthapuram' },
  { country: 'India', state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai' },
  { country: 'India', state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore' },
  { country: 'India', state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru' },
  { country: 'India', state: 'Karnataka', district: 'Mysuru', city: 'Mysuru' },
  { country: 'India', state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai' },
  { country: 'India', state: 'Maharashtra', district: 'Pune', city: 'Pune' },
  { country: 'India', state: 'Delhi', district: 'New Delhi', city: 'New Delhi' },
  { country: 'India', state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad' },
  { country: 'India', state: 'West Bengal', district: 'Kolkata', city: 'Kolkata' },
  { country: 'India', state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad' },
];

export const invalidEmails = [
  '',
  'plainaddress',
  'donor@',
  '@bloodlink.test',
  'donor bloodlink@test.com',
  'donor..qa@bloodlink.test',
  'donor@bloodlink',
  'donor@.com',
  'donor@test.',
  'donor#bloodlink.test',
  'donor@bloodlink..test',
  ' donor@bloodlink.test ',
];

export const invalidPhones = [
  '',
  '12345',
  '123456789',
  '12345678901',
  'abcdefghij',
  '99999abc99',
  '0000000000',
  '+919999999999',
  '99999 99999',
  '99999-99999',
  '12.34.567890',
  '          ',
];

export const weakPasswords = [
  '',
  'short',
  '1234567',
  'password',
  'blood',
  'Blood1',
  'Link#1',
  'aaaaaaa',
  'Donor7',
  'qwerty',
  'abc123',
  'Test#1',
];

export const mismatchPasswords = [
  ['BloodLink#2026', 'BloodLink#2027'],
  ['DonorPass#123', 'DonorPass#124'],
  ['Emergency#99', 'Emergency#98'],
  ['ValidPass#1', 'validPass#1'],
  ['MobilePass#45', 'MobilePass45'],
  ['ShareBlood#7', 'ShareBlood#8'],
  ['BloodBank#10', 'BloodBank#11'],
  ['KeralaDonor#1', 'KeralaDonor#2'],
  ['AppiumUser#1', 'AppiumUser#2'],
  ['QAProfile#2026', 'QAProfile#2025'],
];

export const registrationRequiredFields = [
  'Full Name',
  'Blood Group',
  'Year of Birth',
  'Mobile Number',
  'Email',
  'Password',
  'Retype Password',
  'Country',
  'State',
  'District',
  'City',
  'Available in case of emergency',
  'Consent declaration',
];

export const mobileScreens = [
  {
    name: 'Login',
    requiresAuth: false,
    selectors: ['BloodLink', 'Email', 'Password', 'Sign In', 'Create donor account', 'Forgot password'],
  },
  {
    name: 'Register',
    requiresAuth: false,
    selectors: [
      'Donor Registration',
      'Full Name',
      'Blood Group',
      'Year of Birth',
      'Mobile Number',
      'Email',
      'Password',
      'Retype Password',
      'Country',
      'State',
      'District',
      'City',
      'Register',
    ],
  },
  {
    name: 'ForgotPassword',
    requiresAuth: false,
    selectors: ['Reset Password', 'Registered email ID', 'Submit', 'Sign in'],
  },
  {
    name: 'Search',
    requiresAuth: true,
    selectors: ['Search Donors', 'Blood Group', 'Country', 'State', 'District', 'City', 'Search'],
  },
  {
    name: 'Results',
    requiresAuth: true,
    selectors: ['Donors List', 'No donors found', 'Try a nearby city'],
  },
  {
    name: 'Profile',
    requiresAuth: true,
    selectors: ['My Profile', 'Blood Donation Facts', 'Last Donation Details', 'Change Password', 'Settings', 'Log out'],
  },
  {
    name: 'EditProfile',
    requiresAuth: true,
    selectors: ['Edit Profile', 'Full Name', 'Mobile Number', 'Email', 'Save Profile'],
  },
  {
    name: 'ChangePassword',
    requiresAuth: true,
    selectors: ['Change Password', 'New Password', 'Retype Password', 'Change Password'],
  },
  {
    name: 'LastDonation',
    requiresAuth: true,
    selectors: ['Last Donation Details', 'Donation Date', 'Facility / Organization', 'Units', 'Save Details'],
  },
  {
    name: 'Settings',
    requiresAuth: true,
    selectors: ['Settings', 'Delete Profile'],
  },
  {
    name: 'BloodFacts',
    requiresAuth: true,
    selectors: ['Blood Donation Facts', 'Eligibility', 'Preparation', 'After Donation', 'Facts'],
  },
];

export const navigationPaths = [
  { from: 'Login', to: 'Register', label: 'Create donor account' },
  { from: 'Login', to: 'ForgotPassword', label: 'Forgot password' },
  { from: 'Register', to: 'Login', label: 'Back' },
  { from: 'ForgotPassword', to: 'Login', label: 'Back' },
  { from: 'Search', to: 'Profile', label: 'Open my page', requiresAuth: true },
  { from: 'Profile', to: 'BloodFacts', label: 'Blood Donation Facts', requiresAuth: true },
  { from: 'Profile', to: 'LastDonation', label: 'Last Donation Details', requiresAuth: true },
  { from: 'Profile', to: 'ChangePassword', label: 'Change Password', requiresAuth: true },
  { from: 'Profile', to: 'Settings', label: 'Settings', requiresAuth: true },
  { from: 'Profile', to: 'Login', label: 'Log out', requiresAuth: true },
];
