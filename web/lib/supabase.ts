import { createClient } from '@supabase/supabase-js';

const supabaseUrl = cleanConfigValue(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
const supabaseKey = cleanConfigValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '');

function cleanConfigValue(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-supabase-url.supabase.co',
  supabaseKey || 'missing-supabase-publishable-key',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  },
);
