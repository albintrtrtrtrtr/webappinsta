import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Default project fallback credentials to ensure deployment and prerendering work reliably out-of-the-box
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

let clientInstance: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  const url = getSanitizedUrl();
  const key = getSanitizedKey();

  try {
    clientInstance = createSupabaseClient(url, key, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: typeof window !== 'undefined',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('Supabase client initialization warning, applying safe fallback:', err);
    try {
      clientInstance = createSupabaseClient(DEFAULT_URL, DEFAULT_KEY, {
        auth: { persistSession: false },
      });
    } catch {
      // Create fail-safe dummy client if standard client throws
      clientInstance = createSupabaseClient('https://vgcmqzcsmndjkclbkjok.supabase.co', DEFAULT_KEY, {
        auth: { persistSession: false },
      });
    }
  }

  return clientInstance;
}

export const supabase = getSupabaseBrowserClient();
