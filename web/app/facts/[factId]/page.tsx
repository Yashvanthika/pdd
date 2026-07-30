import { notFound } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { Notice, PageHeader } from '../../../components/ui';
import { getBloodFact, type BloodFactItem } from '../../../lib/shared';

type FactDetailPageProps = {
  params: Promise<{ factId: string }>;
};

export default async function FactDetailPage({ params }: FactDetailPageProps) {
  const { factId } = await params;
  const fact = getBloodFact(factId);

  if (!fact) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader backHref="/facts" subtitle={fact.title} title="Blood Donation Facts" />
      <section className="fact-detail">
        <h2>{fact.sectionTitle}</h2>
        {fact.items.map((item, index) => (
          <FactContent item={item} key={`${fact.id}-${index}`} />
        ))}
      </section>
      <Notice>
        Eligibility and deferral rules can vary by blood bank. Follow the screening decision of a qualified medical professional.
      </Notice>
    </AppShell>
  );
}

function FactContent({ item }: { item: BloodFactItem }) {
  if (item.kind === 'paragraph') {
    return <p className={item.strong ? 'fact-strong' : ''}>{item.text}</p>;
  }

  if (item.kind === 'table') {
    return (
      <div className="fact-table" role="table">
        {item.rows.map(([left, right]) => (
          <div className="fact-table-row" key={`${left}-${right}`} role="row">
            <span role="cell">{left}</span>
            <span role="cell">{right}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="fact-bullets">
      {item.items.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  );
}
