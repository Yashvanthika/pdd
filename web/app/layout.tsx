import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth';
import './globals.css';

export const metadata: Metadata = {
  description: 'BloodLink donor registration, search, profile, and donation facts for the web.',
  title: 'BloodLink',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
