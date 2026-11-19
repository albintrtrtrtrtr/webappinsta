'use client';

import React, { useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Trophy, Flame, Sparkles, ArrowRight, Share2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/sound';

interface ScoreEntry {
  playerId: string;
  nickname: string;
  avatar: string;
  score: number;
  pointsAdded: number;
  badge?: string;
}

interface RoundResultsModalProps {
  isOpen: boolean;
  roundNumber: number;
  totalRounds: number;
  scores: ScoreEntry[];
  onNextRound: () => void;
  onViewStoryCard: () => void;
  isHost: boolean;
  surpriseEvent?: string | null;
}

export function RoundResultsModal({
  isOpen,
  roundNumber,
  totalRounds,
  scores,
  onNextRound,
  onViewStoryCard,
  isHost,
  surpriseEvent,
}: RoundResultsModalProps) {
  const isFinalRound = roundNumber >= totalRounds;

  useEffect(() => {
    if (isOpen) {
      sound.playMatch();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <GlassCard variant="glow" className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-400 to-brand-pink shadow-lg mb-2">
              <Trophy className="w-8 h-8 text-black fill-black" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isFinalRound ? '🏆 FINAL GAME STANDINGS' : `ROUND ${roundNumber} RECAP`}
            </h2>
            <p className="text-xs text-brand-cyan font-bold mt-1">
              {isFinalRound ? 'Game Complete! Create your Instagram Story Card below.' : 'Points tallied across all answers & debates'}
            </p>

            {surpriseEvent && (
              <div className="mt-3 px-3 py-1 rounded-full bg-brand-pink/20 border border-brand-pink text-brand-pink text-xs font-black uppercase inline-flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Surprise Triggered: {surpriseEvent}</span>
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
            {sortedScores.map((entry, idx) => {
              const isWinner = idx === 0;

              return (
                <div
                  key={entry.playerId}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isWinner
                      ? 'bg-amber-400/15 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                      : 'bg-midnight-950/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-sm text-white/70">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className="text-2xl">{entry.avatar}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{entry.nickname}</h4>
                      {entry.badge && (
                        <span className="text-[10px] text-brand-pink font-semibold">
                          {entry.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-brand-cyan block">
                      {entry.score} pts
                    </span>
                    {entry.pointsAdded > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        +{entry.pointsAdded}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isFinalRound ? (
              <NeonButton
                variant="pink"
                fullWidth
                size="lg"
                onClick={onViewStoryCard}
                className="font-black"
              >
                <Share2 className="w-5 h-5 mr-2" /> Generate Instagram Story Card 📸
              </NeonButton>
            ) : (
              <NeonButton
                variant="purple"
                fullWidth
                size="lg"
                onClick={onNextRound}
                className="font-black"
              >
                Next Round {roundNumber + 1} <ArrowRight className="w-5 h-5 ml-2" />
              </NeonButton>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
