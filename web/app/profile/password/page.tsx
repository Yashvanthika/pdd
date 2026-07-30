'use client';

import { FormEvent, useState } from 'react';
import { Lock } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Button, Input, Notice, PageHeader } from '../../../components/ui';
import { API_ENDPOINTS, apiFetch } from '../../../lib/api';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<{ ok: true }>(API_ENDPOINTS.changePassword, {
        body: JSON.stringify({ password }),
        method: 'POST',
      });
      setMessage('Password changed.');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Unable to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader backHref="/profile" title="Change Password" />
      <form className="form-panel compact-panel" onSubmit={save}>
        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Input autoComplete="new-password" label="New Password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
        <Input autoComplete="new-password" label="Retype Password" onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
        <Button disabled={submitting || password.length < 8 || confirmPassword.length < 8} icon={<Lock size={18} />} type="submit">
          {submitting ? 'Saving' : 'Change Password'}
        </Button>
      </form>
    </AppShell>
  );
}
