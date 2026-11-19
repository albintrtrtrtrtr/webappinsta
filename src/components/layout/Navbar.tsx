'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Users, Volume2, VolumeX, Shield, Trophy } from 'lucide-react';
import { getGuestSession } from '@/lib/session';
import { GuestSession } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { sound } from '@/lib/sound';

interface NavbarProps {
  onOpenProfile?: () => void;
}

export function Navbar({ onOpenProfile }: NavbarProps) {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSession(getGuestSession());

    // Fetch genuine active players count from Supabase
    const fetchActiveCount = async () => {
      try {
        const [{ count: lobbyCount, error: err1 }, { count: roomCount, error: err2 }] =
          await Promise.all([
            supabase
              .from('lobby_players')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active'),
            supabase
              .from('room_players')
              .select('*', { count: 'exact', head: true }),
          ]);

        if (!err1 || !err2) {
          const total = (lobbyCount || 0) + (roomCount || 0);
          setOnlineCount(total);
        }
      } catch {
        // Fallback if disconnected
        setOnlineCount(0);
      }
    };

    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 15000);

    // Subscribe to live lobby player presence changes
    const channel = supabase
      .channel('public_presence')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_players' },
        () => {
          fetchActiveCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleSound = () => {
    sound.playPop();
    setSoundEnabled(!soundEnabled);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-midnight-950/80 border-b border-white/10 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 select-none group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-pink via-purple-600 to-brand-cyan flex items-center justify-center shadow-[0_0_15px_rgba(255,46,147,0.5)] group-hover:scale-105 transition-transform">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-pink-200 to-brand-cyan bg-clip-text text-transparent">
                InstaGame
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-brand-pink/20 text-brand-pink border border-brand-pink/30">
                Live
              </span>
            </div>
            <p className="text-[10px] text-white/50 tracking-wider">Party & Dating Arena</p>
          </div>
        </Link>

        {/* Real Online Counter & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-midnight-900 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3.5 h-3.5 ml-0.5" />
            <span>
              {onlineCount !== null ? `${onlineCount} in Party` : 'Live Online'}
            </span>
          </div>

          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          {/* Profile Trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-gradient-to-r from-brand-violet/30 to-brand-pink/20 border border-brand-pink/40 hover:border-brand-pink transition-all group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">
              {session?.avatar || '⚡'}
            </span>
            <div className="text-left hidden xs:block">
              <span className="text-xs font-bold text-white block leading-tight max-w-[80px] truncate">
                {session?.nickname || 'Guest'}
              </span>
              <span className="text-[9px] text-brand-cyan block leading-tight">Edit Vibe</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
