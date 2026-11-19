'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCouplesRoom } from '@/hooks/useCouplesRoom';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ReactionOverlay } from '@/components/ui/ReactionOverlay';
import {
  Heart,
  Share2,
  Copy,
  Check,
  Users,
  Play,
  ArrowLeft,
  Sparkles,
  Shield,
  Crown,
} from 'lucide-react';
import { sound } from '@/lib/sound';

export default function CouplesRoomWaitingPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params?.roomCode as string) || '').toUpperCase();

  const {
    room,
    players,
    currentSession,
    isHost,
    isLoading,
    selectedGameId,
    setSelectedGameId,
    pairWithPlayer,
    updateRoomMode,
    startCouplesGame,
  } = useCouplesRoom(roomCode);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    sound.playPop();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/couples/room/${roomCode}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    // Also trigger mobile Web Share if available
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Join my InstaGame Couples Room!',
        text: `Play with me in room ${roomCode}! Telepathy tests & couples showdown!`,
        url,
      }).catch(() => {});
    }
  };

  const myPlayer = players.find((p) => p.player_id === currentSession?.id);
  const otherPlayers = players.filter((p) => p.player_id !== currentSession?.id);

  const GAMES = [
    {
      id: 'partner_telepathy',
      title: '🔮 Partner Telepathy',
      desc: 'Simultaneous predictions & synchronicity streaks without speaking',
    },
    {
      id: 'how_well_know_me',
      title: '💍 How Well Do You Know Me?',
      desc: 'Deep intimacy trivia, habits, and hilarious memory clashes',
    },
    {
      id: 'couple_chaos',
      title: '⚔️ Couple Chaos',
      desc: 'Couples battle against each other or take on the singles squad',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/couples')}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Couples Hub
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-pink bg-brand-pink/15 border border-brand-pink/30 hover:border-brand-pink px-3 py-2 rounded-xl transition-all shadow-[0_0_12px_rgba(255,46,147,0.3)]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Copied!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" /> Invite Partner / Share Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Room Code Showcase Banner */}
      <GlassCard variant="purple" className="p-6 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-violet/25 border border-brand-violet/40 text-brand-violet text-xs font-extrabold uppercase mb-2">
          <Heart className="w-3.5 h-3.5 fill-brand-violet" />
          <span>Private Couples Room</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white">
          {room?.title || 'Couples Battle Room'}
        </h1>

        <div className="mt-4 flex flex-col items-center justify-center">
          <span className="text-xs text-white/60 mb-1 font-semibold uppercase tracking-wider">
            Share this 4-Digit Room Code:
          </span>
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-midnight-950/80 border-2 border-brand-pink shadow-[0_0_25px_rgba(255,46,147,0.4)]">
            <span className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white">
              {roomCode}
            </span>
            <button
              onClick={handleCopyLink}
              title="Copy code"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Mode & Game Config (Host Controlled) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Game Mode Selection */}
        <GlassCard variant="default" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              1. Arena Battle Mode
            </span>
            {isHost && <span className="text-[10px] text-amber-400 font-bold">Host Can Edit</span>}
          </div>

          <div className="space-y-2">
            {[
              { id: 'couples_vs_couples', title: 'Couples vs Couples', desc: 'Duos face off in telepathy rounds' },
              { id: 'couples_vs_singles', title: 'Couples vs Singles Squad', desc: 'Couples defend against singles team' },
              { id: 'partner_challenge', title: '1-on-1 Partner Telepathy', desc: 'Private intimate session' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!isHost}
                onClick={() => updateRoomMode(m.id as any)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  room?.mode === m.id
                    ? 'bg-brand-violet/30 border-brand-violet text-white font-bold shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                    : 'bg-midnight-950/50 border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                <div className="font-extrabold text-sm text-white">{m.title}</div>
                <div className="text-[11px] text-white/50">{m.desc}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Game Choice Selection */}
        <GlassCard variant="default" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              2. Selected Couples Game
            </span>
            <span className="text-[10px] text-brand-pink font-bold">3 Rounds</span>
          </div>

          <div className="space-y-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={!isHost}
                onClick={() => {
                  sound.playPop();
                  setSelectedGameId(g.id);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedGameId === g.id
                    ? 'bg-brand-pink/25 border-brand-pink text-white font-bold shadow-[0_0_12px_rgba(255,46,147,0.3)]'
                    : 'bg-midnight-950/50 border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                <div className="font-extrabold text-sm text-white">{g.title}</div>
                <div className="text-[11px] text-white/50">{g.desc}</div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Partner Pairing & Connected Roster */}
      <GlassCard variant="glow" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand-cyan" /> Room Players & Partner Pairing
          </span>
          <span className="text-xs text-brand-cyan font-bold">
            {players.length} In Room
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((p) => {
            const isMe = p.player_id === currentSession?.id;
            const hasPartner = !!p.partner_player_id;
            const partnerPlayer = players.find((pl) => pl.player_id === p.partner_player_id);

            return (
              <div
                key={p.player_id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isMe
                    ? 'bg-brand-violet/20 border-brand-violet shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                    : 'bg-midnight-950/60 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-midnight-900 border border-white/15 flex items-center justify-center text-2xl shadow-md">
                    {p.avatar || '⚡'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      {p.nickname} {isMe && '(You)'}
                      {p.is_host && <Crown className="w-3 h-3 text-amber-400" />}
                    </h4>
                    <span className="text-[11px] text-brand-cyan font-semibold block">
                      {hasPartner ? `Paired with ${partnerPlayer?.nickname || 'Partner'}` : 'Unpaired'}
                    </span>
                  </div>
                </div>

                {/* Partner Pairing button */}
                {!isMe && !myPlayer?.partner_player_id && (
                  <NeonButton
                    variant="pink"
                    size="sm"
                    onClick={() => pairWithPlayer(p.player_id)}
                  >
                    <Heart className="w-3.5 h-3.5 mr-1 fill-white" /> Pair as My Partner
                  </NeonButton>
                )}
              </div>
            );
          })}
        </div>

        {/* Start Game Action Bar */}
        <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/60">
            {isHost
              ? 'Ready to play? Launch the battle when both partners are connected!'
              : 'Waiting for host to start the battle...'}
          </div>

          {isHost && (
            <NeonButton
              variant="pink"
              size="lg"
              onClick={startCouplesGame}
              className="font-black text-base shadow-xl w-full sm:w-auto"
            >
              <Play className="w-5 h-5 mr-1.5 fill-white" /> Launch Couples Arena 🚀
            </NeonButton>
          )}
        </div>
      </GlassCard>

      {/* Floating Reaction Bar */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <ReactionOverlay
          sessionId={`couples_room_${roomCode}`}
          currentPlayerId={currentSession?.id}
          currentPlayerName={currentSession?.nickname}
          showBar={true}
        />
      </div>
    </div>
  );
}
