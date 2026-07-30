'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function HomePage() {
  const { loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(session ? '/search' : '/login');
    }
  }, [loading, router, session]);

  return (
    <main className="loading-view">
      <div className="loading-brand">
        <strong>BloodLink</strong>
      </div>
      <div className="loading-bar" />
    </main>
  );
}
