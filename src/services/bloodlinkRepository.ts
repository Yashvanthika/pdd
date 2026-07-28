import type { RealtimeChannel } from '@supabase/supabase-js';
import { requireSupabase } from '../lib/supabase';
import type { BloodGroup, BloodRequest, DonationRecord, Location, SimulationLog, User } from '../types';

type UserRole = User['role'];
type AccountStatus = User['status'];
type RequestStatus = BloodRequest['status'];
type ResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface ProfileRow {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  status: AccountStatus;
  blood_group: BloodGroup | null;
  location: Location | null;
  is_available: boolean | null;
  last_donation_date: string | null;
  gender: string | null;
  age: number | null;
  address: string | null;
  created_at: string;
}

interface BloodRequestRow {
  id: string;
  hospital_id: string;
  hospital_name: string;
  patient_name: string;
  blood_group: BloodGroup;
  urgency: BloodRequest['urgency'];
  units_required: number;
  location: Location;
  condition: string;
  status: RequestStatus;
  ai_drafted_alert: string | null;
  created_at: string;
}

interface DonorResponseRow {
  request_id: string;
  donor_id: string;
  response: ResponseStatus;
}

interface DonationRecordRow {
  id: string;
  donor_id: string;
  request_id: string | null;
  hospital_name: string;
  patient_name: string;
  units: number;
  donation_date: string;
}

interface AuditLogRow {
  id: string;
  type: SimulationLog['type'];
  message: string;
  created_at: string;
}

export interface RegistrationInput {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  location?: Location;
  address?: string;
  bloodGroup?: BloodGroup;
  age?: number;
  gender?: string;
  lastDonationDate?: string;
}

export interface AppData {
  users: User[];
  requests: BloodRequest[];
  activeRequest: BloodRequest | null;
  logs: SimulationLog[];
}

function mapDonation(row: DonationRecordRow): DonationRecord {
  return {
    id: row.id,
    date: row.donation_date,
    hospitalName: row.hospital_name,
    patientName: row.patient_name,
    units: row.units
  };
}

function mapProfile(row: ProfileRow, donationHistory: DonationRecord[] = []): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    bloodGroup: row.blood_group || undefined,
    location: row.location || undefined,
    isAvailable: row.is_available ?? undefined,
    lastDonationDate: row.last_donation_date || undefined,
    gender: row.gender || undefined,
    age: row.age || undefined,
    address: row.address || undefined,
    donationHistory: row.role === 'donor' ? donationHistory : undefined
  };
}

function mapRequest(row: BloodRequestRow, responses: DonorResponseRow[]): BloodRequest {
  const donorResponses = responses
    .filter((response) => response.request_id === row.id)
    .reduce<Record<string, ResponseStatus>>((acc, response) => {
      acc[response.donor_id] = response.response;
      return acc;
    }, {});

  return {
    id: row.id,
    hospitalName: row.hospital_name,
    patientName: row.patient_name,
    bloodGroup: row.blood_group,
    urgency: row.urgency,
    unitsRequired: row.units_required,
    location: row.location,
    createdAt: row.created_at,
    condition: row.condition,
    status: row.status,
    aiDraftedAlert: row.ai_drafted_alert || undefined,
    donorResponses
  };
}

function mapLog(row: AuditLogRow): SimulationLog {
  return {
    id: row.id,
    timestamp: row.created_at,
    type: row.type,
    message: row.message
  };
}

export async function getCurrentSessionUserId(): Promise<string | null> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session?.user.id || null;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a signed-in user.');

  const user = await fetchProfileById(data.user.id);
  if (user.status === 'BANNED') {
    await client.auth.signOut();
    throw new Error('This account has been suspended by the administrator.');
  }

  return user;
}

export async function signOut(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function registerAccount(input: RegistrationInput): Promise<User | null> {
  const client = requireSupabase();
  if (input.role === 'admin') {
    throw new Error('Administrator accounts must be promoted from Supabase by an existing project owner.');
  }

  const profileStatus: AccountStatus = input.role === 'donor' ? 'PENDING' : 'APPROVED';

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        name: input.name,
        phone: input.phone,
        blood_group: input.bloodGroup || null,
        location: input.location || null,
        is_available: input.role === 'donor',
        last_donation_date: input.lastDonationDate || null,
        gender: input.gender || null,
        age: input.age || null,
        address: input.address || null
      }
    }
  });

  if (error) throw error;
  if (!data.user) return null;

  if (data.session) {
    await client.auth.signOut();
  }

  return null;
}

export async function fetchProfileById(id: string): Promise<User> {
  const client = requireSupabase();

  const { data: profile, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single<ProfileRow>();

  if (error) throw error;

  const { data: donationRows, error: donationError } = await client
    .from('donation_records')
    .select('*')
    .eq('donor_id', id)
    .order('donation_date', { ascending: false })
    .returns<DonationRecordRow[]>();

  if (donationError) throw donationError;

  return mapProfile(profile, (donationRows || []).map(mapDonation));
}

export async function loadAppData(): Promise<AppData> {
  const client = requireSupabase();

  const [profilesResult, requestsResult, responsesResult, donationsResult, logsResult] = await Promise.all([
    client.from('profiles').select('*').order('created_at', { ascending: true }).returns<ProfileRow[]>(),
    client.from('blood_requests').select('*').order('created_at', { ascending: false }).returns<BloodRequestRow[]>(),
    client.from('donor_responses').select('*').returns<DonorResponseRow[]>(),
    client.from('donation_records').select('*').order('donation_date', { ascending: false }).returns<DonationRecordRow[]>(),
    client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(120).returns<AuditLogRow[]>()
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (requestsResult.error) throw requestsResult.error;
  if (responsesResult.error) throw responsesResult.error;
  if (donationsResult.error) throw donationsResult.error;
  if (logsResult.error) throw logsResult.error;

  const donationHistoryByDonor = (donationsResult.data || []).reduce<Record<string, DonationRecord[]>>((acc, row) => {
    acc[row.donor_id] = acc[row.donor_id] || [];
    acc[row.donor_id].push(mapDonation(row));
    return acc;
  }, {});

  const users = (profilesResult.data || []).map((profile) => mapProfile(profile, donationHistoryByDonor[profile.id] || []));
  const requests = (requestsResult.data || []).map((request) => mapRequest(request, responsesResult.data || []));

  return {
    users,
    requests,
    activeRequest: requests.find((request) => request.status === 'ACTIVE') || null,
    logs: (logsResult.data || []).map(mapLog)
  };
}

export async function createBloodRequest(input: BloodRequest, hospitalId: string): Promise<BloodRequest> {
  const client = requireSupabase();

  const { data: request, error } = await client
    .from('blood_requests')
    .insert({
      hospital_id: hospitalId,
      hospital_name: input.hospitalName,
      patient_name: input.patientName,
      blood_group: input.bloodGroup,
      urgency: input.urgency,
      units_required: input.unitsRequired,
      location: input.location,
      condition: input.condition,
      status: input.status,
      ai_drafted_alert: input.aiDraftedAlert || null
    })
    .select()
    .single<BloodRequestRow>();

  if (error) throw error;

  const responseRows = Object.keys(input.donorResponses).map((donorId) => ({
    request_id: request.id,
    donor_id: donorId,
    response: 'PENDING' as ResponseStatus
  }));

  if (responseRows.length > 0) {
    const { error: responseError } = await client
      .from('donor_responses')
      .insert(responseRows);

    if (responseError) throw responseError;
  }

  return mapRequest(request, responseRows);
}

export async function updateBloodRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('blood_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;
}

export async function updateDonorResponse(requestId: string, donorId: string, response: Exclude<ResponseStatus, 'PENDING'>): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('donor_responses')
    .upsert({
      request_id: requestId,
      donor_id: donorId,
      response
    }, {
      onConflict: 'request_id,donor_id'
    });

  if (error) throw error;
}

export async function updateProfile(user: User): Promise<User> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .update({
      name: user.name,
      phone: user.phone,
      blood_group: user.bloodGroup || null,
      location: user.location || null,
      is_available: user.isAvailable ?? null,
      last_donation_date: user.lastDonationDate || null,
      gender: user.gender || null,
      age: user.age || null,
      address: user.address || null,
      status: user.status
    })
    .eq('id', user.id)
    .select()
    .single<ProfileRow>();

  if (error) throw error;

  const donationHistory = user.donationHistory || [];
  return mapProfile(data, donationHistory);
}

export async function updateUserStatus(userId: string, status: AccountStatus): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('profiles')
    .update({ status })
    .eq('id', userId);

  if (error) throw error;
}

export async function completeDonation(request: BloodRequest, donor: User, donationDate: string): Promise<void> {
  const client = requireSupabase();

  const { error: recordError } = await client
    .from('donation_records')
    .insert({
      donor_id: donor.id,
      request_id: request.id,
      hospital_name: request.hospitalName,
      patient_name: request.patientName,
      units: 1,
      donation_date: donationDate
    });

  if (recordError) throw recordError;

  const { error: donorError } = await client
    .from('profiles')
    .update({
      last_donation_date: donationDate,
      is_available: false
    })
    .eq('id', donor.id);

  if (donorError) throw donorError;

  await updateBloodRequestStatus(request.id, 'FULFILLED');
}

export async function createAuditLog(type: SimulationLog['type'], message: string): Promise<SimulationLog> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('audit_logs')
    .insert({ type, message })
    .select()
    .single<AuditLogRow>();

  if (error) throw error;
  return mapLog(data);
}

export async function clearAuditLogs(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('audit_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
}

export function subscribeToBloodLinkChanges(onChange: () => void): RealtimeChannel {
  const client = requireSupabase();

  return client
    .channel('bloodlink-data')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'donor_responses' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_records' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, onChange)
    .subscribe();
}
