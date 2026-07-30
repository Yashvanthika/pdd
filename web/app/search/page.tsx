'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { LocationFields } from '../../components/location-fields';
import { Button, Notice, PageHeader, Select } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { BLOOD_GROUPS, type BloodGroup } from '../../lib/shared';

export default function SearchPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(profile?.bloodGroup || 'A+');
  const [state, setState] = useState(profile?.state || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [city, setCity] = useState(profile?.city || '');
  const canSearch = Boolean(bloodGroup && state && district && city);

  function searchDonors(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSearch) return;

    const query = new URLSearchParams({ bloodGroup, city, district, state });
    router.push(`/results?${query.toString()}`);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Donor search"
        subtitle="Find available donors by blood group and exact location."
        title="Search Donors"
      />
      <section className="search-layout">
        <form className="search-panel" onSubmit={searchDonors}>
          <div className="form-grid">
            <Select
              label="Blood Group"
              onChange={(event) => setBloodGroup(event.target.value as BloodGroup)}
              options={BLOOD_GROUPS}
              value={bloodGroup}
            />
            <LocationFields
              city={city}
              district={district}
              onCityChange={setCity}
              onDistrictChange={setDistrict}
              onStateChange={setState}
              state={state}
            />
          </div>
          <Button disabled={!canSearch} icon={<Search size={18} />} type="submit">
            Search
          </Button>
        </form>
        <aside className="guidance-panel">
          <h2>Search visibility</h2>
          <p>Only available donors who have consented to show contact details are listed.</p>
          <Notice>Use city-level search for faster matching and cleaner contact lists.</Notice>
        </aside>
      </section>
    </AppShell>
  );
}
