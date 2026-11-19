import { supabase } from './supabase/client';

export function getReferralLink(playerId: string, roomCode?: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const params = new URLSearchParams();
  params.set('ref', playerId);
  if (roomCode) params.set('room', roomCode);
  return `${origin}/?${params.toString()}`;
}

export async function trackReferral(referredPlayerId: string, referralCode: string) {
  try {
    await supabase.from('referrals').insert({
      referrer_id: referralCode,
      referred_player_id: referredPlayerId,
      referral_code: referralCode,
      status: 'completed',
      reward_unlocked: 'vip_avatar_unlocked',
    });
  } catch {}
}
