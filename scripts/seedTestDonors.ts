import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { INDIA_LOCATIONS } from '../src/data/indiaLocations';
import { BLOOD_GROUPS, type BloodGroup } from '../src/mobile/bloodGroups';

dotenv.config({ path: ['.env.local', '.env'] });

const TEST_PASSWORD = 'BloodLinkTest#2026';
const TEST_EMAIL_DOMAIN = 'bloodlink.test';
const DONORS_PER_CITY = 5;

const firstNames = [
  'Aarav',
  'Aditi',
  'Akash',
  'Ananya',
  'Arjun',
  'Bhavna',
  'Deepak',
  'Diya',
  'Farhan',
  'Isha',
  'Kabir',
  'Kavya',
  'Kiran',
  'Meera',
  'Neha',
  'Nikhil',
  'Pooja',
  'Pranav',
  'Priya',
  'Rahul',
  'Riya',
  'Rohan',
  'Saanvi',
  'Sahil',
  'Sneha',
  'Tanvi',
  'Varun',
  'Vidya',
  'Vikram',
  'Zoya',
];

const lastNames = [
  'Agarwal',
  'Bansal',
  'Chakraborty',
  'Das',
  'Desai',
  'Gupta',
  'Iyer',
  'Jain',
  'Joshi',
  'Kapoor',
  'Khan',
  'Krishnan',
  'Kumar',
  'Malhotra',
  'Mehta',
  'Menon',
  'Mishra',
  'Nair',
  'Patel',
  'Rao',
  'Reddy',
  'Roy',
  'Saxena',
  'Sen',
  'Shah',
  'Sharma',
  'Singh',
  'Srinivasan',
  'Thomas',
  'Verma',
];

interface SeedDonor {
  email: string;
  phone: string;
  fullName: string;
  bloodGroup: BloodGroup;
  yearOfBirth: number;
  state: string;
  district: string;
  city: string;
  lastDonationDate: string;
  lastDonationFacility: string;
}

interface ExistingUser {
  id: string;
  email?: string;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Add it to .env.local before seeding test donors.`);
  }

  return value;
}

function getDonorName(index: number) {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  return `${firstName} ${lastName}`;
}

function getTestPhone(index: number) {
  return `+910000${String(index + 1).padStart(6, '0')}`;
}

function getCityBloodGroups(cityIndex: number): BloodGroup[] {
  const groups: BloodGroup[] = ['A+', 'A+'];
  let offset = 1;

  while (groups.length < DONORS_PER_CITY) {
    const nextGroup = BLOOD_GROUPS[(cityIndex + offset) % BLOOD_GROUPS.length];
    if (!groups.includes(nextGroup)) {
      groups.push(nextGroup);
    }

    offset += 1;
  }

  return groups;
}

function getLastDonationDate(index: number) {
  const month = (index % 9) + 1;
  const day = (index % 24) + 1;
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildSeedDonors(): SeedDonor[] {
  const donors: SeedDonor[] = [];
  let cityIndex = 0;

  for (const stateEntry of INDIA_LOCATIONS) {
    for (const districtEntry of stateEntry.districts) {
      for (const city of districtEntry.cities) {
        const bloodGroups = getCityBloodGroups(cityIndex);

        for (const bloodGroup of bloodGroups) {
          const donorIndex = donors.length;
          donors.push({
            email: `test.donor.${String(donorIndex + 1).padStart(4, '0')}@${TEST_EMAIL_DOMAIN}`,
            phone: getTestPhone(donorIndex),
            fullName: getDonorName(donorIndex),
            bloodGroup,
            yearOfBirth: 1974 + (donorIndex % 28),
            state: stateEntry.state,
            district: districtEntry.district,
            city,
            lastDonationDate: getLastDonationDate(donorIndex),
            lastDonationFacility: `${city} Blood Centre`,
          });
        }

        cityIndex += 1;
      }
    }
  }

  return donors;
}

async function getExistingSeedUsers(supabase: SupabaseClient, seedEmails: Set<string>) {
  const users = new Map<string, ExistingUser>();
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users) {
      const email = user.email?.toLowerCase();
      if (email && seedEmails.has(email)) {
        users.set(email, { id: user.id, email });
      }
    }

    if (!data.nextPage) break;
    page = data.nextPage;
  }

  return users;
}

async function createOrRefreshUser(supabase: SupabaseClient, donor: SeedDonor, existingUser?: ExistingUser) {
  const userMetadata = {
    full_name: donor.fullName,
    donor_phone: donor.phone,
    seed_data: true,
  };

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: donor.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error || !data.user) {
      throw error || new Error(`Unable to refresh existing seed user ${donor.email}.`);
    }

    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: donor.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error || !data.user) {
    throw error || new Error(`Unable to create seed user ${donor.email}.`);
  }

  return data.user.id;
}

async function upsertProfiles(supabase: SupabaseClient, donors: Array<SeedDonor & { id: string }>) {
  const rows = donors.map((donor) => ({
    id: donor.id,
    email: donor.email,
    phone: donor.phone,
    full_name: donor.fullName,
    blood_group: donor.bloodGroup,
    year_of_birth: donor.yearOfBirth,
    country: 'INDIA',
    state: donor.state,
    district: donor.district,
    city: donor.city,
    available_in_emergency: true,
    display_consent: true,
    last_donation_date: donor.lastDonationDate,
    last_donation_facility: donor.lastDonationFacility,
    last_donation_blood_group: donor.bloodGroup,
    last_donation_units: 1,
    last_donation_state: donor.state,
    last_donation_district: donor.district,
    last_donation_city: donor.city,
    last_donation_notes: 'Seeded test donor profile.',
  }));

  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const { error } = await supabase
      .from('donor_profiles')
      .upsert(chunk, { onConflict: 'id' });

    if (error) throw error;
  }
}

async function main() {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const donors = buildSeedDonors();
  const cityCount = INDIA_LOCATIONS.reduce(
    (total, stateEntry) => total + stateEntry.districts.reduce((districtTotal, districtEntry) => districtTotal + districtEntry.cities.length, 0),
    0,
  );
  const { error: schemaError } = await supabase.from('donor_profiles').select('id').limit(1);

  if (schemaError) {
    throw new Error(`donor_profiles is not ready: ${schemaError.message}`);
  }

  console.log(`Seeding ${donors.length} test donors across ${cityCount} cities.`);

  const existingUsers = await getExistingSeedUsers(
    supabase,
    new Set(donors.map((donor) => donor.email.toLowerCase())),
  );
  const donorsWithIds: Array<SeedDonor & { id: string }> = [];

  for (const donor of donors) {
    const existingUser = existingUsers.get(donor.email.toLowerCase());
    const id = await createOrRefreshUser(supabase, donor, existingUser);
    donorsWithIds.push({ ...donor, id });

    if (donorsWithIds.length % 50 === 0) {
      console.log(`Prepared ${donorsWithIds.length}/${donors.length} auth users.`);
    }
  }

  await upsertProfiles(supabase, donorsWithIds);
  console.log(`Seeded ${donorsWithIds.length} searchable donor profiles.`);
  console.log(`Test donor password: ${TEST_PASSWORD}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
