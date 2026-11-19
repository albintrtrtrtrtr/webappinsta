'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Heart, PlusCircle, LogIn, Sparkles, Users, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

export function CouplesArenaSection() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCode.trim().toUpperCase();
    if (clean.length < 4) {
      setErrorMsg('Enter valid 4-character room code');
      sound.playBuzz();
      return;
    }
    setErrorMsg('');
    sound.playSuccess();
    router.push(`/couples/room/${clean}`);
  };

  const handleCreateRoom = () => {
    sound.playPop();
    router.push('/couples?action=create');
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-violet/20 border border-brand-violet/40 flex items-center justify-center text-brand-violet shadow-[0_0_10px_rgba(124,58,237,0.3)]">
            <Heart className="w-4 h-4 fill-brand-violet" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Couples Team Arena
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-violet/25 text-brand-violet border border-brand-violet/40">
                Private Rooms
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Battle other couples or team up against singles • 4-digit invitation codes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Join Card with 4-Digit Code */}
        <GlassCard variant="purple" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Have an Invite Code?
              </span>
              <span className="text-xs text-white/40">4 Digits</span>
            </div>
            <h3 className="text-lg font-black text-white">Join Partner Room</h3>
            <p className="text-xs text-white/60 mt-1 mb-4">
              Enter your partner&apos;s or friends&apos; 4-digit room code to join instantly.
            </p>

            <form onSubmit={handleJoinWithCode} className="space-y-2">
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                placeholder="e.g. 7K9P"
                className="w-full text-center text-2xl tracking-[0.3em] font-black uppercase py-2.5 rounded-xl bg-midnight-950/80 border border-brand-violet/40 text-white placeholder-white/20 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
              />
              {errorMsg && <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>}

              <NeonButton
                type="submit"
                variant="purple"
                fullWidth
                size="md"
                className="mt-2"
              >
                <LogIn className="w-4 h-4 mr-1.5" /> Enter Room
              </NeonButton>
            </form>
          </div>
        </GlassCard>

        {/* Create Room Card */}
        <GlassCard variant="purple" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-pink uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Host a Party
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Instant Link</span>
            </div>
            <h3 className="text-lg font-black text-white">Create Private Arena</h3>
            <p className="text-xs text-white/60 mt-1 mb-4">
              Get a unique code & shareable link. Choose Couples vs Couples, Couples vs Singles, or Duo Telepathy.
            </p>

            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                <span>Partner Telepathy & Sync tests</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-violet" />
                <span>Couples vs Singles grudge matches</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <NeonButton
              variant="pink"
              fullWidth
              size="md"
              onClick={handleCreateRoom}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> Create New Room
            </NeonButton>
          </div>
        </GlassCard>

        {/* Couples Games Showcase */}
        <GlassCard variant="glow" className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              🏆 Arena Highlights
            </span>
            <div className="space-y-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">💍</span>
                <div>
                  <h4 className="text-xs font-bold text-white">How Well Do You Know Me?</h4>
                  <p className="text-[11px] text-white/50">Simultaneous answer reveals & truth checks</p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">⚔️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Couple Chaos</h4>
                  <p className="text-[11px] text-white/50">Couples battle against a fearless singles squad</p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Partner Telepathy</h4>
                  <p className="text-[11px] text-white/50">Guess what your partner writes without talking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <NeonButton
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => router.push('/couples')}
            >
              Explore Couples Modes →
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
