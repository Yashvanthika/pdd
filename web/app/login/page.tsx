'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { LogIn } from 'lucide-react';
import { AuthLayout } from '../../components/app-shell';
import { Button, Input, Notice } from '../../components/ui';
import { normalizeEmail } from '../../lib/forms';
import { useAuth } from '../../lib/auth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(normalizedEmail, password);
      router.replace('/search');
    } catch (err: any) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout subtitle="Search registered blood donors and maintain your donor profile from any device." title="Sign in to BloodLink">
      <form className="auth-form" onSubmit={handleLogin}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
        </div>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Input
          autoComplete="email"
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />
        <Input
          autoComplete="current-password"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />
        <Button disabled={submitting || !canSubmit} icon={<LogIn size={18} />} type="submit">
          {submitting ? 'Signing in' : 'Sign in'}
        </Button>
        <div className="auth-links">
          <Link href="/register">Create donor account</Link>
          <Link href="/forgot-password">Forgot password</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
