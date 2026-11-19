import { GuestSession } from './supabase/types';
import { supabase } from './supabase/client';

const SESSION_KEY = 'insta_game_guest_session';

export const INTEREST_TAGS = [
  'Funny',
  'Romantic',
  'Adventurous',
  'Introvert',
  'Extrovert',
  'Gamer',
  'Music lover',
  'Foodie',
  'Competitive',
  'Flirty',
] as const;

export const AVATAR_OPTIONS = [
  '⚡', '🔥', '👑', '💖', '🦄', '🎭', '🦊', '🚀', '🍸', '💎', '🍒', '🎯'
];

export function getGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestSession;
  } catch (err) {
    console.error('Failed to read guest session:', err);
    return null;
  }
}

export function saveGuestSession(session: GuestSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Asynchronously sync to Supabase guest_sessions and profiles in background
    syncSessionToSupabase(session).catch(console.error);
  } catch (err) {
    console.error('Failed to save guest session:', err);
  }
}

export async function syncSessionToSupabase(session: GuestSession) {
  try {
    // 1. Upsert into guest_sessions
    await supabase.from('guest_sessions').upsert({
      id: session.id,
      nickname: session.nickname,
      gender: session.gender || null,
      avatar: session.avatar || '⚡',
      interests: session.interests || [],
      match_preference: session.match_preference || 'everyone',
      last_active_at: new Date().toISOString(),
    });

    // 2. Upsert into profiles
    await supabase.from('profiles').upsert({
      id: session.id,
      username: session.nickname,
      gender: session.gender || null,
      avatar: session.avatar || '⚡',
      age_verified: true,
      is_guest: true,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // Non-blocking in case of offline or RLS restrictions
    console.warn('Sync session notice:', e);
  }
}

export function generateGuestId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 9; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `guest_${rand}`;
}
