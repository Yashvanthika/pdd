'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Button, Notice, PageHeader } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';

export default function SettingsPage() {
  const { deleteProfile } = useAuth();
  const router = useRouter();

  async function confirmDelete() {
    const confirmed = window.confirm('This permanently removes your donor profile and account.');
    if (!confirmed) return;

    await deleteProfile();
    router.replace('/login');
  }

  return (
    <AppShell>
      <PageHeader backHref="/profile" title="Settings" />
      <section className="settings-panel">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Delete Profile</h2>
          <p>This permanently removes your donor profile and account.</p>
        </div>
        <Notice tone="error">This action cannot be undone once the backend confirms deletion.</Notice>
        <Button icon={<Trash2 size={18} />} onClick={confirmDelete} tone="danger">
          Delete Profile
        </Button>
      </section>
    </AppShell>
  );
}
