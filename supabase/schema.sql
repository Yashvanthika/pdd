-- BloodLink donor directory schema.
-- This rebuild stores donor profiles only.

create extension if not exists pgcrypto;

drop table if exists public.audit_logs cascade;
drop table if exists public.donor_responses cascade;
drop table if exists public.blood_requests cascade;
drop table if exists public.donation_records cascade;
drop table if exists public.profiles cascade;

create table if not exists public.donor_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  phone text not null unique,
  full_name text not null,
  blood_group text not null check (
    blood_group in (
      'A+', 'A-', 'A1+', 'A1-', 'A1B+', 'A1B-', 'A2+', 'A2-',
      'A2B+', 'A2B-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-',
      'Bombay Blood Group'
    )
  ),
  year_of_birth integer not null check (
    year_of_birth between extract(year from now())::integer - 100
    and extract(year from now())::integer - 18
  ),
  country text not null default 'INDIA' check (country = 'INDIA'),
  state text not null,
  district text not null,
  city text not null,
  available_in_emergency boolean not null default true,
  display_consent boolean not null default false,
  last_donation_date date,
  last_donation_facility text,
  last_donation_blood_group text check (
    last_donation_blood_group is null
    or last_donation_blood_group in (
      'A+', 'A-', 'A1+', 'A1-', 'A1B+', 'A1B-', 'A2+', 'A2-',
      'A2B+', 'A2B-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-',
      'Bombay Blood Group'
    )
  ),
  last_donation_units integer check (last_donation_units is null or last_donation_units > 0),
  last_donation_state text,
  last_donation_district text,
  last_donation_city text,
  last_donation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists set_donor_profiles_updated_at on public.donor_profiles;
create trigger set_donor_profiles_updated_at
before update on public.donor_profiles
for each row execute function public.set_updated_at();

alter table public.donor_profiles enable row level security;

drop policy if exists "donor_profiles_select_self" on public.donor_profiles;
create policy "donor_profiles_select_self"
on public.donor_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "donor_profiles_update_self" on public.donor_profiles;
create policy "donor_profiles_update_self"
on public.donor_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "donor_profiles_delete_self" on public.donor_profiles;
create policy "donor_profiles_delete_self"
on public.donor_profiles for delete
to authenticated
using (auth.uid() = id);

create index if not exists donor_profiles_search_idx
on public.donor_profiles (blood_group, state, district, city, full_name)
where available_in_emergency = true and display_consent = true;
