'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Search } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Button, EmptyState, Notice, PageHeader } from '../../components/ui';
import { API_ENDPOINTS, apiFetch, type DonorSearchResult } from '../../lib/api';

export default function ResultsPage() {
  return (
    <AppShell>
      <Suspense fallback={<Notice>Loading search...</Notice>}>
        <ResultsContent />
      </Suspense>
    </AppShell>
  );
}

function ResultsContent() {
  const params = useSearchParams();
  const [donors, setDonors] = useState<DonorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const criteria = useMemo(() => ({
    bloodGroup: params.get('bloodGroup') || '',
    city: params.get('city') || '',
    district: params.get('district') || '',
    state: params.get('state') || '',
  }), [params]);

  const hasCriteria = Boolean(criteria.bloodGroup && criteria.state && criteria.district && criteria.city);

  useEffect(() => {
    if (!hasCriteria) {
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadDonors() {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams(criteria).toString();
        const data = await apiFetch<{ donors: DonorSearchResult[] }>(`${API_ENDPOINTS.donorSearch}?${query}`);
        if (mounted) setDonors(data.donors);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Unable to load donors.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDonors();
    return () => {
      mounted = false;
    };
  }, [criteria, hasCriteria]);

  return (
    <>
      <PageHeader
        actions={(
          <Link className="text-link" href="/search">
            <ArrowLeft size={18} />
            New search
          </Link>
        )}
        eyebrow="Donors list"
        subtitle={hasCriteria ? `${criteria.bloodGroup} in ${criteria.city}` : 'Choose search criteria to view available donors.'}
        title="Donors List"
      />
      {!hasCriteria ? (
        <EmptyState title="Search details missing">
          Start from donor search and select blood group, state, district, and city.
        </EmptyState>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {loading ? <div className="skeleton-grid"><div /><div /><div /></div> : null}
      {!loading && hasCriteria && donors.length === 0 ? (
        <EmptyState title="No donors found">
          Try a nearby city or another blood group.
        </EmptyState>
      ) : null}
      {!loading && donors.length > 0 ? (
        <section className="donor-grid" aria-label="Donor results">
          {donors.map((donor) => (
            <article className="donor-card" key={donor.id}>
              <div className="blood-badge">{donor.bloodGroup}</div>
              <div className="donor-details">
                <h2>{donor.fullName}</h2>
                <a href={`tel:${donor.phone}`}><Phone size={17} /> {donor.phone}</a>
                <p><MapPin size={17} /> {donor.city}, {donor.district}, {donor.state}</p>
                {donor.lastDonationDate ? <p>Last donation: {donor.lastDonationDate}</p> : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}
      {hasCriteria ? (
        <div className="floating-action-row">
          <Button icon={<Search size={18} />} onClick={() => window.history.back()} tone="secondary">
            Refine search
          </Button>
        </div>
      ) : null}
    </>
  );
}
