'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Heart, PlusCircle, LogIn, Users, Sparkles, Shield, Trophy, ArrowRight } from 'lucide-react';
import { generateRoomCode } from '@/lib/utils';
import { getGuestSession } from '@/lib/session';
import { supabase } from '@/lib/supabase/client';
import { sound } from '@/lib/sound';

function CouplesHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isCreating, setIsCreating] = useState(initialAction === 'create');
  const [selectedMode, setSelectedMode] = useState<'couples_vs_couples' | 'couples_vs_singles' | 'partner_challenge'>('couples_vs_couples');
  const [roomTitle, setRoomTitle] = useState('Duo Showdown Arena');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase();
    if (clean.length < 4) {
      setErrorMsg('Please enter a 4-digit room code');
      sound.playBuzz();
      return;
    }
    sound.playSuccess();
    router.push(`/couples/room/${clean}`);
  };

  const handleCreateRoom = async () => {
    const session = getGuestSession();
    if (!session) {
      setErrorMsg('Please complete guest profile first');
      return;
    }

    try {
      setLoading(true);
      sound.playPop();
      const code = generateRoomCode();

      const { data, error } = await supabase
        .from('private_rooms')
        .insert({
          room_code: code,
          title: roomTitle.trim() || 'Couples Battle Room',
          mode: selectedMode,
          status: 'waiting',
          host_player_id: session.id,
          game_id: 'partner_telepathy',
        })
        .select()
        .single();

      sound.playMatch();
      router.push(`/couples/room/${code}`);
    } catch (err: any) {
      console.error(err);
      // Fallback redirect with generated code
      const fallbackCode = generateRoomCode();
      router.push(`/couples/room/${fallbackCode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/20 border border-brand-violet/40 text-brand-violet text-xs font-bold shadow-[0_0_12px_rgba(124,58,237,0.3)]">
          <Heart className="w-3.5 h-3.5 fill-brand-violet" />
          <span>Private Multiplayer Rooms • 4-Digit Invites</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Couples Team Arena
        </h1>
        <p className="text-sm text-white/70">
          Partner telepathy tests, simultaneous answer reveals, and couples vs singles grudge battles.
        </p>
      </div>

      {/* Main Choice Cards: Join or Create */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Join by Code */}
        <GlassCard variant="purple" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center gap-1.5">
                <LogIn className="w-4 h-4" /> Have a Partner Code?
              </span>
              <span className="text-xs text-white/40">4 Letters / Digits</span>
            </div>

            <h2 className="text-xl font-black text-white">Join Existing Room</h2>
            <p className="text-xs text-white/60 mt-1 mb-4">
              Enter the 4-digit code provided by your partner or party host.
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => {
                  setRoomCodeInput(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                placeholder="e.g. 7K9P"
                className="w-full text-center text-3xl tracking-[0.3em] font-black uppercase py-3 rounded-xl bg-midnight-950 border border-brand-violet/50 text-white placeholder-white/20 focus:outline-none focus:border-brand-cyan"
              />

              {errorMsg && <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>}

              <NeonButton type="submit" variant="purple" fullWidth size="lg">
                Enter Room Now →
              </NeonButton>
            </form>
          </div>
        </GlassCard>

        {/* Create Room */}
        <GlassCard variant="pink" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-brand-pink uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" /> Host a Showdown
              </span>
              <span className="text-xs text-emerald-400 font-bold">Instant Share Link</span>
            </div>

            <h2 className="text-xl font-black text-white">Create Private Arena</h2>
            <p className="text-xs text-white/60 mt-1 mb-3">
              Pick your game mode and invite your partner & friends with a 4-digit code.
            </p>

            {/* Mode Selector */}
            <div className="space-y-2 mb-4">
              {[
                {
                  id: 'couples_vs_couples',
                  title: '💑 Couples vs Couples',
                  desc: 'Multiple duos battle for highest telepathy & synch scores',
                },
                {
                  id: 'couples_vs_singles',
                  title: '⚔️ Couples vs Singles Squad',
                  desc: 'Couples face off against a squad of single contenders',
                },
                {
                  id: 'partner_challenge',
                  title: '🔮 1-on-1 Partner Telepathy',
                  desc: 'Private intimate session between you and your partner',
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    sound.playPop();
                    setSelectedMode(m.id as any);
                  }}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedMode === m.id
                      ? 'bg-brand-pink/25 border-brand-pink text-white shadow-[0_0_12px_rgba(255,46,147,0.3)]'
                      : 'bg-midnight-950/60 border-white/10 text-white/70 hover:bg-midnight-900'
                  }`}
                >
                  <div className="font-extrabold text-white text-xs">{m.title}</div>
                  <div className="text-[11px] text-white/50">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <NeonButton
            variant="pink"
            fullWidth
            size="lg"
            isLoading={loading}
            onClick={handleCreateRoom}
          >
            Create Room & Get Code 🚀
          </NeonButton>
        </GlassCard>
      </div>

      {/* Couples Game Rules & Showcase */}
      <GlassCard variant="default" className="p-6">
        <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> 3 Core Couples Game Modes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-midnight-950/60 border border-white/10 space-y-1">
            <span className="text-2xl">💍</span>
            <h4 className="font-extrabold text-sm text-white">How Well Do You Know Me?</h4>
            <p className="text-xs text-white/60">
              Partners independently answer questions about each other. Simultaneous flip & match score!
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-950/60 border border-white/10 space-y-1">
            <span className="text-2xl">⚔️</span>
            <h4 className="font-extrabold text-sm text-white">Couple Chaos</h4>
            <p className="text-xs text-white/60">
              Rapid-fire prediction rounds, voting battles, and hilarious challenges vs single contenders.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-midnight-950/60 border border-white/10 space-y-1">
            <span className="text-2xl">🔮</span>
            <h4 className="font-extrabold text-sm text-white">Partner Telepathy</h4>
            <p className="text-xs text-white/60">
              Guess what your partner will write without talking. Identical locked answers earn mind-meld points!
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default function CouplesHubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-white/50 text-sm">
          Loading Couples Arena...
        </div>
      }
    >
      <CouplesHubContent />
    </Suspense>
  );
}
