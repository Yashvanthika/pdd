'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { LocationFields } from '../../../components/location-fields';
import { Button, Input, Notice, PageHeader, Select, Textarea } from '../../../components/ui';
import { API_ENDPOINTS, apiFetch, type DonorProfile } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { BLOOD_GROUPS, type BloodGroup } from '../../../lib/shared';

export default function LastDonationPage() {
  const { profile, refreshProfile } = useAuth();
  const [date, setDate] = useState(profile?.lastDonationDate || '');
  const [facility, setFacility] = useState(profile?.lastDonationFacility || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(profile?.lastDonationBloodGroup || profile?.bloodGroup || 'A+');
  const [units, setUnits] = useState(profile?.lastDonationUnits ? String(profile.lastDonationUnits) : '1');
  const [state, setState] = useState(profile?.lastDonationState || profile?.state || '');
  const [district, setDistrict] = useState(profile?.lastDonationDistrict || profile?.district || '');
  const [city, setCity] = useState(profile?.lastDonationCity || profile?.city || '');
  const [notes, setNotes] = useState(profile?.lastDonationNotes || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSave = Boolean(date && facility && state && district && city);

  useEffect(() => {
    if (!profile) return;
    setDate(profile.lastDonationDate || '');
    setFacility(profile.lastDonationFacility || '');
    setBloodGroup(profile.lastDonationBloodGroup || profile.bloodGroup || 'A+');
    setUnits(profile.lastDonationUnits ? String(profile.lastDonationUnits) : '1');
    setState(profile.lastDonationState || profile.state || '');
    setDistrict(profile.lastDonationDistrict || profile.district || '');
    setCity(profile.lastDonationCity || profile.city || '');
    setNotes(profile.lastDonationNotes || '');
  }, [profile]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await apiFetch<{ profile: DonorProfile }>(API_ENDPOINTS.lastDonation, {
        body: JSON.stringify({
          bloodGroup,
          city,
          date,
          district,
          facility,
          notes,
          state,
          units: Number(units),
        }),
        method: 'PUT',
      });
      await refreshProfile();
      setMessage('Last donation details saved.');
    } catch (err: any) {
      setError(err.message || 'Unable to save last donation details.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader backHref="/profile" title="Last Donation Details" />
      <form className="form-panel" onSubmit={save}>
        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="form-grid">
          <Input label="Donation Date" onChange={(event) => setDate(event.target.value)} placeholder="YYYY-MM-DD" type="date" value={date} />
          <Input label="Facility / Organization" onChange={(event) => setFacility(event.target.value)} placeholder="Facility name" value={facility} />
          <Select
            label="Blood Group"
            onChange={(event) => setBloodGroup(event.target.value as BloodGroup)}
            options={BLOOD_GROUPS}
            value={bloodGroup}
          />
          <Input label="Units" min="1" onChange={(event) => setUnits(event.target.value)} type="number" value={units} />
          <LocationFields
            city={city}
            district={district}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
            onStateChange={setState}
            state={state}
          />
        </div>
        <Textarea label="Notes" onChange={(event) => setNotes(event.target.value)} rows={5} value={notes} />
        <Button disabled={submitting || !canSave} icon={<Save size={18} />} type="submit">
          {submitting ? 'Saving' : 'Save Details'}
        </Button>
      </form>
    </AppShell>
  );
}
