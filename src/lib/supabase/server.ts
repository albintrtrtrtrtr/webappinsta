import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DEFAULT_URL = 'https://vgcmqzcsmndjkclbkjok.supabase.co';
const DEFAULT_KEY = 'sb_publishable_c--JEbEp6wJWBnrpIVU9IA_imKIA43B';

function getSanitizedUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (raw && (raw.startsWith('https://') || raw.startsWith('http://'))) {
    return raw;
  }
  return DEFAULT_URL;
}

function getSanitizedKey(): string {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (raw && raw.length > 10) {
    return raw;
  }
  return DEFAULT_KEY;
}

export function createClient() {
  const url = getSanitizedUrl();
  const key = getSanitizedKey();

  try {
    const cookieStore = cookies();

    return createServerClient(url, key, {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can occur in Server Components where cookies are read-only
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Can occur in Server Components
          }
        },
      },
    });
  } catch (err) {
    console.warn('Server Supabase client fallback applied:', err);
    return createServerClient(DEFAULT_URL, DEFAULT_KEY, {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });
  }
}
