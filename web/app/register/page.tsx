'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { AuthLayout } from '../../components/app-shell';
import { LocationFields } from '../../components/location-fields';
import { Button, Checkbox, Input, Notice, Select } from '../../components/ui';
import { API_ENDPOINTS, apiPublicFetch, type DonorProfile } from '../../lib/api';
import { isValidEmail, isValidIndianPhone, normalizeEmail, normalizePhone, yearOptions } from '../../lib/forms';
import { useAuth } from '../../lib/auth';
import { BLOOD_GROUPS, type BloodGroup } from '../../lib/shared';

export default function RegisterPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('A+');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [available, setAvailable] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const years = useMemo(yearOptions, []);
  const canRegister = Boolean(
    email.trim()
    && password
    && confirmPassword
    && phone.trim()
    && fullName.trim()
    && yearOfBirth
    && state
    && district
    && city
    && available
    && consent,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const normalizedEmail = normalizeEmail(email);
    const normalizedFullName = fullName.trim();
    const normalizedPhone = normalizePhone(phone);

    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10 digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      await apiPublicFetch<{ profile: DonorProfile }>(API_ENDPOINTS.registerDonor, {
        body: JSON.stringify({
          availableInEmergency: available,
          bloodGroup,
          city,
          district,
          displayConsent: consent,
          email: normalizedEmail,
          fullName: normalizedFullName,
          password,
          phone: normalizedPhone,
          state,
          yearOfBirth: Number(yearOfBirth),
        }),
        method: 'POST',
      });

      await signIn(normalizedEmail, password);
      router.replace('/search');
    } catch (err: any) {
      setError(err.message || 'Unable to register donor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout subtitle="Register once, then manage search visibility and donation details from the web or mobile app." title="Create a donor profile">
      <form className="auth-form wide-form" onSubmit={submit}>
        <div className="form-title-row">
          <div>
            <p className="eyebrow">Donor registration</p>
            <h2>Profile details</h2>
          </div>
          <Link href="/login">Sign in</Link>
        </div>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="form-grid">
          <Input label="Full Name" onChange={(event) => setFullName(event.target.value)} placeholder="Donor name" value={fullName} />
          <Select
            label="Blood Group"
            onChange={(event) => setBloodGroup(event.target.value as BloodGroup)}
            options={BLOOD_GROUPS}
            value={bloodGroup}
          />
          <Select label="Year of Birth" onChange={(event) => setYearOfBirth(event.target.value)} options={years} value={yearOfBirth} />
          <Input label="Mobile Number" onChange={(event) => setPhone(event.target.value)} placeholder="10 digit mobile number" type="tel" value={phone} />
          <Input autoComplete="email" label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" value={email} />
          <Input autoComplete="new-password" label="Password" onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" type="password" value={password} />
          <Input autoComplete="new-password" label="Retype Password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Retype password" type="password" value={confirmPassword} />
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
          <Checkbox
            checked={consent}
            label="I authorize BloodLink to display my donor details so nearby registered users can contact me."
            onChange={setConsent}
          />
        </div>
        <Button disabled={submitting || !canRegister} icon={<UserPlus size={18} />} type="submit">
          {submitting ? 'Registering' : 'Register'}
        </Button>
      </form>
    </AuthLayout>
  );
}
