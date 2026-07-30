'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BookOpen, Droplet, LogOut, Search, Settings, User } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from './ui';

const navItems = [
  { href: '/search', label: 'Search', icon: Search },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/facts', label: 'Facts', icon: BookOpen },
  { href: '/profile/settings', label: 'Settings', icon: Settings },
];

export function AuthLayout({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  const { loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/search');
    }
  }, [loading, router, session]);

  if (loading || session) {
    return <LoadingView />;
  }

  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="BloodLink">
        <div className="brand-mark">
          <span><Droplet size={24} /></span>
          <strong>BloodLink</strong>
        </div>
        <div className="auth-hero-copy">
          <p className="eyebrow">Registered donor network</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="auth-stats">
          <div>
            <strong>All India</strong>
            <span>State, district, and city coverage</span>
          </div>
          <div>
            <strong>Consent first</strong>
            <span>Only visible donors appear in search</span>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        {children}
      </section>
    </main>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { loading, profile, session, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, router, session]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  if (loading || !session) {
    return <LoadingView />;
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/search">
          <span><Droplet size={22} /></span>
          <strong>BloodLink</strong>
        </Link>
        <nav aria-label="Primary navigation" className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/search' && pathname.startsWith(item.href));

            return (
              <Link className={active ? 'active' : ''} href={item.href} key={item.href}>
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-profile">
          <div className="mini-avatar">{profile?.bloodGroup || 'B+'}</div>
          <div>
            <strong>{profile?.fullName || 'Donor'}</strong>
            <span>{profile?.city || 'India'}</span>
          </div>
        </div>
        <Button className="sidebar-logout" icon={<LogOut size={18} />} onClick={handleSignOut} tone="secondary">
          Log out
        </Button>
      </aside>
      <div className="content-shell">
        <header className="mobile-topbar">
          <Link className="sidebar-brand" href="/search">
            <span><Droplet size={20} /></span>
            <strong>BloodLink</strong>
          </Link>
          <Button aria-label="Log out" className="icon-button" icon={<LogOut size={18} />} onClick={handleSignOut} tone="secondary">
            <span className="sr-only">Log out</span>
          </Button>
        </header>
        <main className="page-content">
          {children}
        </main>
        <nav aria-label="Primary navigation" className="mobile-nav">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/search' && pathname.startsWith(item.href));

            return (
              <Link className={active ? 'active' : ''} href={item.href} key={item.href}>
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <main className="loading-view">
      <div className="loading-brand">
        <span><Droplet size={26} /></span>
        <strong>BloodLink</strong>
      </div>
      <div className="loading-bar" />
    </main>
  );
}
