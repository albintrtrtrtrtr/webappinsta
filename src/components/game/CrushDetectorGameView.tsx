'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameQuestion, RoundPhase, LobbyPlayer } from '@/lib/supabase/types';
import { Heart, Sparkles, Flame, Check, Lock, Unlock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/sound';

interface CrushDetectorGameViewProps {
  question: GameQuestion;
  phase: RoundPhase;
  players: LobbyPlayer[];
  currentPlayerId: string;
  selectedPlayerId: string | null;
  onSelectPlayer: (targetPlayerId: string) => void;
  matches?: Array<{ playerAId: string; playerBId: string; playerAName: string; playerBName: string }>;
  popularPlayerId?: string | null;
}

export function CrushDetectorGameView({
  question,
  phase,
  players,
  currentPlayerId,
  selectedPlayerId,
  onSelectPlayer,
  matches = [],
  popularPlayerId,
}: CrushDetectorGameViewProps) {
  const [consentGranted, setConsentGranted] = useState(false);

  // Filter out self so player chooses someone else
  const otherPlayers = players.filter((p) => p.player_id !== currentPlayerId);

  const handlePick = (targetId: string) => {
    if (phase !== 'answering') return;
    sound.playPop();
    onSelectPlayer(targetId);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff2e93', '#7c3aed', '#00f2fe', '#ffd600'],
    });
  };

  // Check if current player is in a mutual match
  const myMatch = matches.find(
    (m) => m.playerAId === currentPlayerId || m.playerBId === currentPlayerId
  );

  return (
    <div className="space-y-6">
      {/* Prompt Card */}
      <GlassCard variant="pink" className="p-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-brand-pink text-xs font-black uppercase mb-3">
          <Heart className="w-3.5 h-3.5 fill-brand-pink" />
          <span>Secret Crush Radar • 100% Confidential</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto">
          &ldquo;{question.prompt}&rdquo;
        </h2>
        <p className="text-xs text-brand-cyan mt-2 font-semibold">
          Your pick remains completely secret unless it is mutual!
        </p>
      </GlassCard>

      {/* Players Selection Cards (Answering Phase) */}
      {phase === 'answering' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
            <span>Tap to secretly select your vibe:</span>
            {selectedPlayerId && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Pick Locked
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherPlayers.map((player) => {
              const isSelected = selectedPlayerId === player.player_id;

              return (
                <motion.div
                  key={player.player_id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePick(player.player_id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 select-none relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-brand-pink/30 to-brand-violet/30 border-brand-pink ring-2 ring-brand-pink/60 shadow-[0_0_20px_rgba(255,46,147,0.5)]'
                      : 'bg-midnight-950/70 border-white/10 hover:border-brand-purple/40 hover:bg-midnight-900'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-midnight-900 border border-white/20 flex items-center justify-center text-3xl shadow-md">
                    {player.avatar || '⚡'}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-white truncate max-w-[110px]">
                      {player.nickname}
                    </h4>
                    {player.interests && player.interests.length > 0 && (
                      <span className="text-[10px] text-white/50 block truncate max-w-[100px]">
                        {player.interests[0]}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-pink flex items-center justify-center text-white shadow-md">
                      <Heart className="w-3 h-3 fill-white" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reveal Phase: Mutual Matches & Popularity Awards */}
      {phase === 'reveal' && (
        <div className="space-y-4">
          {/* Mutual Match Banner */}
          {myMatch ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onAnimationComplete={triggerConfetti}
              className="p-6 rounded-3xl bg-gradient-to-r from-brand-pink via-purple-600 to-brand-violet border-2 border-pink-300 shadow-[0_0_35px_rgba(255,46,147,0.7)] text-center text-white"
            >
              <div className="inline-flex p-3 rounded-full bg-white/20 mb-2">
                <Heart className="w-8 h-8 fill-white animate-bounce" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                IT&apos;S A MUTUAL MATCH! 💘
              </h3>
              <p className="text-sm text-white/90 mt-1 max-w-md mx-auto">
                You and{' '}
                <span className="font-black underline">
                  {myMatch.playerAId === currentPlayerId ? myMatch.playerBName : myMatch.playerAName}
                </span>{' '}
                secretly chose each other!
              </p>

              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-center gap-3">
                <NeonButton
                  variant="cyan"
                  size="md"
                  onClick={() => {
                    sound.playSuccess();
                    setConsentGranted(!consentGranted);
                  }}
                >
                  {consentGranted ? (
                    <>
                      <Unlock className="w-4 h-4 mr-1.5" /> Direct Contact Granted
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-1.5" /> Unlock Private Social Contact
                    </>
                  )}
                </NeonButton>
              </div>
            </motion.div>
          ) : (
            <GlassCard variant="purple" className="p-6 text-center">
              <h3 className="text-lg font-black text-white">Sparks Analyzed ✨</h3>
              <p className="text-xs text-white/60 mt-1">
                Mutual matches are revealed only when both players pick each other!
              </p>
            </GlassCard>
          )}

          {/* Popular Player Award */}
          {popularPlayerId && (
            <GlassCard variant="default" className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-brand-pink flex items-center justify-center text-2xl shadow-lg">
                  🔥
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Room Heartthrob
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    {players.find((p) => p.player_id === popularPlayerId)?.nickname || 'Player'}
                  </h4>
                  <span className="text-xs text-white/50">Most secret picks this round (+150 pts)</span>
                </div>
              </div>

              <span className="text-sm font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
                👑 Top Vibe
              </span>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
