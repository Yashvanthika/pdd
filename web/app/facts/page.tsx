import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/ui';
import { BLOOD_FACTS } from '../../lib/shared';

export default function BloodFactsPage() {
  return (
    <AppShell>
      <PageHeader backHref="/profile" title="Blood Donation Facts" />
      <section className="fact-list">
        {BLOOD_FACTS.map((category, index) => (
          <Link className="fact-row" href={`/facts/${category.id}`} key={category.id}>
            <span className="fact-number">{index + 1}</span>
            <span>
              <strong>{category.title}</strong>
              <small>{category.subtitle}</small>
            </span>
            <ChevronRight size={21} />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
