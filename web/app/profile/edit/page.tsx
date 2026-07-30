'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { LocationFields } from '../../../components/location-fields';
import { Button, Checkbox, Input, Notice, PageHeader, Select } from '../../../components/ui';
import { API_ENDPOINTS, apiFetch, type DonorProfile } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { isValidEmail, isValidIndianPhone, normalizeEmail, normalizePhone, yearOptions } from '../../../lib/forms';
import { BLOOD_GROUPS, type BloodGroup } from '../../../lib/shared';

export default function EditProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(profile?.bloodGroup || 'A+');
  const [yearOfBirth, setYearOfBirth] = useState(profile?.yearOfBirth ? String(profile.yearOfBirth) : '');
  const [state, setState] = useState(profile?.state || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [city, setCity] = useState(profile?.city || '');
  const [available, setAvailable] = useState(Boolean(profile?.availableInEmergency));
  const [consent, setConsent] = useState(Boolean(profile?.displayConsent));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const years = useMemo(yearOptions, []);
  const canSave = Boolean(email && phone && fullName && yearOfBirth && state && district && city);

  useEffect(() => {
    if (!profile) return;
    setEmail(profile.email);
    setPhone(profile.phone);
    setFullName(profile.fullName);
    setBloodGroup(profile.bloodGroup);
    setYearOfBirth(String(profile.yearOfBirth));
    setState(profile.state);
    setDistrict(profile.district);
    setCity(profile.city);
    setAvailable(Boolean(profile.availableInEmergency));
    setConsent(Boolean(profile.displayConsent));
  }, [profile]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10 digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<{ profile: DonorProfile }>(API_ENDPOINTS.me, {
        body: JSON.stringify({
          availableInEmergency: available,
          bloodGroup,
          city,
          district,
          displayConsent: consent,
          email: normalizedEmail,
          fullName: fullName.trim(),
          phone: normalizePhone(phone),
          state,
          yearOfBirth: Number(yearOfBirth),
        }),
        method: 'PUT',
      });
      await refreshProfile();
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader backHref="/profile" title="Edit Profile" />
      <form className="form-panel" onSubmit={save}>
        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="form-grid">
          <Input label="Full Name" onChange={(event) => setFullName(event.target.value)} value={fullName} />
          <Select
            label="Blood Group"
            onChange={(event) => setBloodGroup(event.target.value as BloodGroup)}
            options={BLOOD_GROUPS}
            value={bloodGroup}
          />
          <Select label="Year of Birth" onChange={(event) => setYearOfBirth(event.target.value)} options={years} value={yearOfBirth} />
          <Input label="Mobile Number" onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
          <Input label="Email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          <LocationFields
            city={city}
            district={district}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
            onStateChange={setState}
            state={state}
          />
        </div>
        <div className="checkbox-stack">
          <Checkbox checked={available} label="Available in case of emergency" onChange={setAvailable} />
          <Checkbox checked={consent} label="Allow registered users to view my contact details in donor search" onChange={setConsent} />
        </div>
        <Button disabled={submitting || !canSave} icon={<Save size={18} />} type="submit">
          {submitting ? 'Saving' : 'Save Profile'}
        </Button>
      </form>
    </AppShell>
  );
}
