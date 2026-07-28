import express from 'express';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BLOOD_GROUPS, type BloodGroup } from './src/mobile/bloodGroups';
import { getCities, getDistricts, isValidLocation } from './src/data/indiaLocations';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabasePublicKey = (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey && supabaseServiceRoleKey);

function getAllowedCorsOrigin(origin: string | undefined): string | null {
  if (!origin || CORS_ORIGINS.length === 0) return null;
  if (CORS_ORIGINS.includes('*')) return '*';
  return CORS_ORIGINS.includes(origin) ? origin : null;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = getAllowedCorsOrigin(origin);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && !allowedOrigin ? 403 : 204);
    return;
  }

  next();
});

app.use(express.json({ limit: '128kb' }));

function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase backend credentials are not configured.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.trim();
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

function asPositiveInteger(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function isBloodGroup(value: string): value is BloodGroup {
  return BLOOD_GROUPS.includes(value as BloodGroup);
}

interface AuthenticatedRequest extends express.Request {
  donorId?: string;
}

async function requireDonor(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: 'Backend authentication is not configured.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.status(401).json({ error: 'Sign in again to continue.' });
    return;
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token.trim());
    if (error || !data.user) {
      res.status(401).json({ error: 'Your session could not be verified.' });
      return;
    }

    req.donorId = data.user.id;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to verify session.' });
  }
}

function mapProfile(row: any) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    bloodGroup: row.blood_group,
    yearOfBirth: row.year_of_birth,
    country: row.country,
    state: row.state,
    district: row.district,
    city: row.city,
    availableInEmergency: row.available_in_emergency,
    displayConsent: row.display_consent,
    lastDonationDate: row.last_donation_date,
    lastDonationFacility: row.last_donation_facility,
    lastDonationBloodGroup: row.last_donation_blood_group,
    lastDonationUnits: row.last_donation_units,
    lastDonationState: row.last_donation_state,
    lastDonationDistrict: row.last_donation_district,
    lastDonationCity: row.last_donation_city,
    lastDonationNotes: row.last_donation_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bloodlink-donor-directory',
    environment: process.env.NODE_ENV || 'development',
    supabaseConfigured: isSupabaseConfigured,
    time: new Date().toISOString(),
  });
});

app.get('/api/locations', (_req, res) => {
  res.json({ country: 'INDIA', locations: getDistricts() });
});

app.post('/api/auth/register-donor', async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      res.status(503).json({ error: 'Supabase backend credentials are not configured.' });
      return;
    }

    const email = asString(req.body.email).toLowerCase();
    const password = asString(req.body.password);
    const phone = normalizeIndianPhone(asString(req.body.phone));
    const fullName = asString(req.body.fullName);
    const bloodGroup = asString(req.body.bloodGroup);
    const yearOfBirth = Number(req.body.yearOfBirth);
    const country = 'INDIA';
    const state = asString(req.body.state);
    const district = asString(req.body.district);
    const city = asString(req.body.city);
    const availableInEmergency = asBoolean(req.body.availableInEmergency);
    const displayConsent = asBoolean(req.body.displayConsent);

    if (!email || password.length < 8 || !fullName || !phone || !isBloodGroup(bloodGroup) || !yearOfBirth) {
      res.status(400).json({ error: 'Complete all required donor registration fields.' });
      return;
    }

    if (!isValidLocation(state, district, city)) {
      res.status(400).json({ error: 'Select a valid State, District, and City.' });
      return;
    }

    if (!availableInEmergency || !displayConsent) {
      res.status(400).json({ error: 'Emergency availability and contact display consent are required.' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        donor_phone: phone,
      },
    });

    if (createError || !createdUser.user) {
      res.status(400).json({ error: createError?.message || 'Unable to create donor account.' });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('donor_profiles')
      .insert({
        id: createdUser.user.id,
        email,
        phone,
        full_name: fullName,
        blood_group: bloodGroup,
        year_of_birth: yearOfBirth,
        country,
        state,
        district,
        city,
        available_in_emergency: availableInEmergency,
        display_consent: displayConsent,
      })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(createdUser.user.id);
      res.status(400).json({ error: profileError.message });
      return;
    }

    res.status(201).json({ profile: mapProfile(profile) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to register donor.' });
  }
});

app.get('/api/me', requireDonor, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('donor_profiles')
      .select('*')
      .eq('id', req.donorId)
      .single();

    if (error) {
      res.status(404).json({ error: 'Donor profile was not found.' });
      return;
    }

    res.json({ profile: mapProfile(data) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to load donor profile.' });
  }
});

app.put('/api/me', requireDonor, async (req: AuthenticatedRequest, res) => {
  try {
    const bloodGroup = asString(req.body.bloodGroup);
    const state = asString(req.body.state);
    const district = asString(req.body.district);
    const city = asString(req.body.city);
    const email = asString(req.body.email).toLowerCase();
    const phone = normalizeIndianPhone(asString(req.body.phone));
    const fullName = asString(req.body.fullName);
    const yearOfBirth = Number(req.body.yearOfBirth);

    if (!email || !phone || !fullName || !yearOfBirth || !isBloodGroup(bloodGroup) || !isValidLocation(state, district, city)) {
      res.status(400).json({ error: 'Select valid donor and location details.' });
      return;
    }

    const updatePayload = {
      email,
      phone,
      full_name: fullName,
      blood_group: bloodGroup,
      year_of_birth: yearOfBirth,
      country: 'INDIA',
      state,
      district,
      city,
      available_in_emergency: asBoolean(req.body.availableInEmergency),
      display_consent: asBoolean(req.body.displayConsent),
    };

    const supabase = getSupabaseAdmin();
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(req.donorId as string, {
      email: updatePayload.email,
      user_metadata: {
        donor_phone: updatePayload.phone,
        full_name: updatePayload.full_name,
      },
    });

    if (authUpdateError) {
      res.status(400).json({ error: authUpdateError.message });
      return;
    }

    const { data, error } = await supabase
      .from('donor_profiles')
      .update(updatePayload)
      .eq('id', req.donorId)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ profile: mapProfile(data) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to update profile.' });
  }
});

app.post('/api/me/change-password', requireDonor, async (req: AuthenticatedRequest, res) => {
  try {
    const password = asString(req.body.password);
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const { error } = await getSupabaseAdmin().auth.admin.updateUserById(req.donorId as string, { password });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to change password.' });
  }
});

app.put('/api/me/last-donation', requireDonor, async (req: AuthenticatedRequest, res) => {
  try {
    const bloodGroup = asString(req.body.bloodGroup);
    const state = asString(req.body.state);
    const district = asString(req.body.district);
    const city = asString(req.body.city);

    if (!isBloodGroup(bloodGroup) || !isValidLocation(state, district, city)) {
      res.status(400).json({ error: 'Select valid last donation details.' });
      return;
    }

    const { data, error } = await getSupabaseAdmin()
      .from('donor_profiles')
      .update({
        last_donation_date: asString(req.body.date) || null,
        last_donation_facility: asString(req.body.facility) || null,
        last_donation_blood_group: bloodGroup,
        last_donation_units: asPositiveInteger(req.body.units),
        last_donation_state: state,
        last_donation_district: district,
        last_donation_city: city,
        last_donation_notes: asString(req.body.notes) || null,
      })
      .eq('id', req.donorId)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ profile: mapProfile(data) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to update last donation details.' });
  }
});

app.delete('/api/me', requireDonor, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('donor_profiles').delete().eq('id', req.donorId);
    const { error } = await supabase.auth.admin.deleteUser(req.donorId as string);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to delete donor profile.' });
  }
});

app.get('/api/donors/search', requireDonor, async (req: AuthenticatedRequest, res) => {
  try {
    const bloodGroup = asString(req.query.bloodGroup);
    const state = asString(req.query.state);
    const district = asString(req.query.district);
    const city = asString(req.query.city);

    if (!isBloodGroup(bloodGroup) || !isValidLocation(state, district, city)) {
      res.status(400).json({ error: 'Select a valid blood group, State, District, and City.' });
      return;
    }

    const { data, error } = await getSupabaseAdmin()
      .from('donor_profiles')
      .select('id, full_name, phone, blood_group, country, state, district, city, available_in_emergency, last_donation_date')
      .eq('blood_group', bloodGroup)
      .eq('state', state)
      .eq('district', district)
      .eq('city', city)
      .eq('available_in_emergency', true)
      .eq('display_consent', true)
      .neq('id', req.donorId)
      .order('full_name', { ascending: true });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({
      donors: (data || []).map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        bloodGroup: row.blood_group,
        country: row.country,
        state: row.state,
        district: row.district,
        city: row.city,
        availableInEmergency: row.available_in_emergency,
        lastDonationDate: row.last_donation_date,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to search donors.' });
  }
});

app.get('/api/locations/:state/districts', (req, res) => {
  res.json({ districts: getDistricts(req.params.state) });
});

app.get('/api/locations/:state/:district/cities', (req, res) => {
  res.json({ cities: getCities(req.params.state, req.params.district) });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BloodLink Server] Listening on http://0.0.0.0:${PORT}`);
});
