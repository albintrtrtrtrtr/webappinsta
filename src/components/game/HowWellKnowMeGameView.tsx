'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameQuestion, RoundPhase } from '@/lib/supabase/types';
import { Heart, Check, Sparkles, Send, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/sound';

interface HowWellKnowMeGameViewProps {
  question: GameQuestion;
  phase: RoundPhase;
  partnerName?: string;
  partnerAvatar?: string;
  currentPlayerName?: string;
  currentPlayerAvatar?: string;
  myAnswer: string | null;
  onSubmitAnswer: (answer: string) => void;
  partnerAnswer?: string | null;
}

export function HowWellKnowMeGameView({
  question,
  phase,
  partnerName = 'Partner',
  partnerAvatar = '💖',
  currentPlayerName = 'You',
  currentPlayerAvatar = '⚡',
  myAnswer,
  onSubmitAnswer,
  partnerAnswer = 'Pizza & Netflix binge',
}: HowWellKnowMeGameViewProps) {
  const [inputAnswer, setInputAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;
    sound.playSuccess();
    onSubmitAnswer(inputAnswer.trim());
  };

  const isMatch =
    myAnswer &&
    partnerAnswer &&
    (myAnswer.toLowerCase().trim() === partnerAnswer.toLowerCase().trim() ||
      myAnswer.toLowerCase().includes(partnerAnswer.toLowerCase()) ||
      partnerAnswer.toLowerCase().includes(myAnswer.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <GlassCard variant="purple" className="p-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-violet/25 border border-brand-violet/40 text-brand-violet text-xs font-black uppercase mb-3">
          <Heart className="w-3.5 h-3.5 fill-brand-violet" />
          <span>How Well Do You Know Each Other?</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto">
          &ldquo;{question.prompt}&rdquo;
        </h2>
        <p className="text-xs text-brand-cyan font-bold mt-2">
          Both write your answers simultaneously without looking!
        </p>
      </GlassCard>

      {/* Answering Phase */}
      {phase === 'answering' && (
        <GlassCard variant="default" className="p-5">
          {!myAnswer ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/80 block mb-2">
                  Lock In Your Answer:
                </label>
                <input
                  type="text"
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  placeholder="Type your honest answer..."
                  className="w-full px-4 py-3 rounded-xl bg-midnight-950 border border-white/15 text-white placeholder-white/30 text-base font-semibold focus:outline-none focus:border-brand-pink"
                />
              </div>

              <NeonButton type="submit" variant="pink" fullWidth size="lg">
                <Send className="w-4 h-4 mr-1.5" /> Submit & Lock In Secret
              </NeonButton>
            </form>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center space-y-1">
              <div className="inline-flex p-2 rounded-full bg-emerald-500/20 mb-1">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-extrabold text-base">Your Answer is Locked!</h4>
              <p className="text-xs text-white/60">
                Waiting for {partnerName} to submit their answer...
              </p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Reveal Phase: Side-by-Side Comparison */}
      {phase === 'reveal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* My Answer */}
            <GlassCard variant="pink" className="p-5 text-center space-y-2">
              <span className="text-3xl">{currentPlayerAvatar}</span>
              <h4 className="font-extrabold text-sm text-white">{currentPlayerName}&apos;s Answer:</h4>
              <div className="p-4 rounded-xl bg-midnight-950/80 border border-brand-pink/40 text-lg font-black text-brand-pink">
                &ldquo;{myAnswer || 'Favorite comfort snack'}&rdquo;
              </div>
            </GlassCard>

            {/* Partner's Answer */}
            <GlassCard variant="purple" className="p-5 text-center space-y-2">
              <span className="text-3xl">{partnerAvatar}</span>
              <h4 className="font-extrabold text-sm text-white">{partnerName}&apos;s Answer:</h4>
              <div className="p-4 rounded-xl bg-midnight-950/80 border border-brand-violet/40 text-lg font-black text-brand-cyan">
                &ldquo;{partnerAnswer}&rdquo;
              </div>
            </GlassCard>
          </div>

          {/* Match Score Verdict Card */}
          <GlassCard
            variant={isMatch ? 'glow' : 'default'}
            className="p-6 text-center space-y-2"
          >
            <span className="text-4xl">{isMatch ? '🎉' : '💀'}</span>
            <h3 className="text-2xl font-black text-white">
              {isMatch ? 'PERFECT SYNC! (+150 PTS)' : 'HILARIOUS MISMATCH! (+50 PTS)'}
            </h3>
            <p className="text-xs text-white/70 max-w-md mx-auto">
              {isMatch
                ? 'You two are completely in sync! True relationship telepathy.'
                : 'Different answers, but pure comedy gold for the room!'}
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
