-- BloodLink Supabase schema
-- Run this in the Supabase SQL editor before using the app.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('donor', 'hospital', 'admin')),
  name text not null,
  phone text not null default '',
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'BANNED')),
  blood_group text check (blood_group in ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+')),
  location jsonb,
  is_available boolean default false,
  last_donation_date date,
  gender text,
  age integer check (age is null or age between 18 and 100),
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.profiles(id) on delete cascade,
  hospital_name text not null,
  patient_name text not null,
  blood_group text not null check (blood_group in ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+')),
  urgency text not null check (urgency in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  units_required integer not null check (units_required > 0),
  location jsonb not null,
  condition text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'FULFILLED', 'CANCELLED')),
  ai_drafted_alert text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.donor_responses (
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  donor_id uuid not null references public.profiles(id) on delete cascade,
  response text not null default 'PENDING' check (response in ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (request_id, donor_id)
);

create table if not exists public.donation_records (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.blood_requests(id) on delete set null,
  hospital_name text not null,
  patient_name text not null,
  units integer not null default 1 check (units > 0),
  donation_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('INFO', 'MATCH', 'ALERT', 'ACCEPT', 'REJECT', 'FULFILL')),
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and coalesce(public.current_user_role(), '') <> 'admin' then
    new.role := old.role;
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;
create trigger prevent_profile_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_blood_requests_updated_at on public.blood_requests;
create trigger set_blood_requests_updated_at
before update on public.blood_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_donor_responses_updated_at on public.donor_responses;
create trigger set_donor_responses_updated_at
before update on public.donor_responses
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'donor');
  profile_role text := case when requested_role in ('donor', 'hospital') then requested_role else 'donor' end;
  profile_status text := case when profile_role = 'donor' then 'PENDING' else 'APPROVED' end;
begin
  insert into public.profiles (
    id,
    email,
    role,
    name,
    phone,
    status,
    blood_group,
    location,
    is_available,
    last_donation_date,
    gender,
    age,
    address
  )
  values (
    new.id,
    coalesce(new.email, ''),
    profile_role,
    coalesce(new.raw_user_meta_data->>'name', new.email, 'BloodLink User'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    profile_status,
    nullif(new.raw_user_meta_data->>'blood_group', ''),
    new.raw_user_meta_data->'location',
    coalesce((new.raw_user_meta_data->>'is_available')::boolean, false),
    nullif(new.raw_user_meta_data->>'last_donation_date', '')::date,
    nullif(new.raw_user_meta_data->>'gender', ''),
    nullif(new.raw_user_meta_data->>'age', '')::integer,
    nullif(new.raw_user_meta_data->>'address', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    name = excluded.name,
    phone = excluded.phone,
    status = excluded.status,
    blood_group = excluded.blood_group,
    location = excluded.location,
    is_available = excluded.is_available,
    last_donation_date = excluded.last_donation_date,
    gender = excluded.gender,
    age = excluded.age,
    address = excluded.address;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.blood_requests enable row level security;
alter table public.donor_responses enable row level security;
alter table public.donation_records enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using (auth.uid() = id or public.current_user_role() = 'admin')
with check (auth.uid() = id or public.current_user_role() = 'admin');

drop policy if exists "requests_select_authenticated" on public.blood_requests;
create policy "requests_select_authenticated"
on public.blood_requests for select
to authenticated
using (true);

drop policy if exists "requests_insert_hospital_or_admin" on public.blood_requests;
create policy "requests_insert_hospital_or_admin"
on public.blood_requests for insert
to authenticated
with check (
  public.current_user_role() in ('hospital', 'admin')
  and hospital_id = auth.uid()
);

drop policy if exists "requests_update_owner_or_admin" on public.blood_requests;
create policy "requests_update_owner_or_admin"
on public.blood_requests for update
to authenticated
using (hospital_id = auth.uid() or public.current_user_role() = 'admin')
with check (hospital_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "responses_select_authenticated" on public.donor_responses;
create policy "responses_select_authenticated"
on public.donor_responses for select
to authenticated
using (true);

drop policy if exists "responses_insert_hospital_admin_or_self" on public.donor_responses;
create policy "responses_insert_hospital_admin_or_self"
on public.donor_responses for insert
to authenticated
with check (
  donor_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1 from public.blood_requests br
    where br.id = request_id
      and br.hospital_id = auth.uid()
  )
);

drop policy if exists "responses_update_hospital_admin_or_self" on public.donor_responses;
create policy "responses_update_hospital_admin_or_self"
on public.donor_responses for update
to authenticated
using (
  donor_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1 from public.blood_requests br
    where br.id = request_id
      and br.hospital_id = auth.uid()
  )
)
with check (
  donor_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1 from public.blood_requests br
    where br.id = request_id
      and br.hospital_id = auth.uid()
  )
);

drop policy if exists "donations_select_authenticated" on public.donation_records;
create policy "donations_select_authenticated"
on public.donation_records for select
to authenticated
using (true);

drop policy if exists "donations_insert_hospital_or_admin" on public.donation_records;
create policy "donations_insert_hospital_or_admin"
on public.donation_records for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.blood_requests br
    where br.id = request_id
      and br.hospital_id = auth.uid()
  )
);

drop policy if exists "logs_select_authenticated" on public.audit_logs;
create policy "logs_select_authenticated"
on public.audit_logs for select
to authenticated
using (true);

drop policy if exists "logs_insert_authenticated" on public.audit_logs;
create policy "logs_insert_authenticated"
on public.audit_logs for insert
to authenticated
with check (true);

drop policy if exists "logs_delete_admin" on public.audit_logs;
create policy "logs_delete_admin"
on public.audit_logs for delete
to authenticated
using (public.current_user_role() = 'admin');

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.blood_requests;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.donor_responses;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.donation_records;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.audit_logs;
exception when duplicate_object then null;
end $$;
