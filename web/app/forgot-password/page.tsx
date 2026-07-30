'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Mail } from 'lucide-react';
import { AuthLayout } from '../../components/app-shell';
import { Button, Input, Notice } from '../../components/ui';
import { useAuth } from '../../lib/auth';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage('A secure password reset link has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Unable to send reset link.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout subtitle="Use your registered email address to receive a secure password reset link." title="Reset your password">
      <form className="auth-form" onSubmit={handleReset}>
        <div className="form-title-row">
          <div>
            <p className="eyebrow">Account recovery</p>
            <h2>Reset password</h2>
          </div>
          <Link href="/login">Sign in</Link>
        </div>
        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Input
          autoComplete="email"
          label="Registered email ID"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />
        <Button disabled={submitting || !email} icon={<Mail size={18} />} type="submit">
          {submitting ? 'Sending link' : 'Submit'}
        </Button>
      </form>
    </AuthLayout>
  );
}
