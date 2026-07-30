'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, Edit3, Lock, LogOut, Settings } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Button, DetailRow, Notice, PageHeader } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { displayValue, yesNo } from '../../lib/forms';

const profileLinks = [
  { href: '/facts', title: 'Blood Donation Facts', icon: BookOpen },
  { href: '/profile/donation', title: 'Last Donation Details', icon: CalendarDays },
  { href: '/profile/password', title: 'Change Password', icon: Lock },
  { href: '/profile/settings', title: 'Settings', icon: Settings },
];

export default function ProfilePage() {
  const { profile, signOut } = useAuth();

  return (
    <AppShell>
      <PageHeader
        actions={(
          <Link className="text-link" href="/profile/edit">
            <Edit3 size={18} />
            Edit
          </Link>
        )}
        title="My Profile"
      />
      {!profile ? (
        <Notice tone="error">Profile details are not available right now.</Notice>
      ) : (
        <section className="profile-layout">
          <div className="profile-panel">
            <div className="profile-identity">
              <div className="profile-avatar">{profile.bloodGroup}</div>
              <div>
                <p className="eyebrow">Donor profile</p>
                <h2>{profile.fullName}</h2>
                <p>{profile.email}</p>
              </div>
            </div>
            <div className="details-grid">
              <DetailRow label="Mobile Number" value={displayValue(profile.phone)} />
              <DetailRow label="Blood Group" value={displayValue(profile.bloodGroup)} />
              <DetailRow label="Year of Birth" value={displayValue(profile.yearOfBirth)} />
              <DetailRow label="Country" value={displayValue(profile.country)} />
              <DetailRow label="State" value={displayValue(profile.state)} />
              <DetailRow label="District" value={displayValue(profile.district)} />
              <DetailRow label="City" value={displayValue(profile.city)} />
              <DetailRow label="Available in Emergency" value={yesNo(profile.availableInEmergency)} />
              <DetailRow label="Contact Details Visible" value={yesNo(profile.displayConsent)} />
            </div>
          </div>
          <div className="profile-actions-grid">
            {profileLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="action-card" href={item.href} key={item.href}>
                  <span><Icon size={21} /></span>
                  <strong>{item.title}</strong>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <Button className="logout-wide" icon={<LogOut size={18} />} onClick={() => void signOut()} tone="secondary">
        Log out
      </Button>
    </AppShell>
  );
}
