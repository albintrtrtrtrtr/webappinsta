'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameQuestion, RoundPhase } from '@/lib/supabase/types';
import { Sparkles, Check, Send, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/sound';

interface PartnerTelepathyGameViewProps {
  question: GameQuestion;
  phase: RoundPhase;
  myAnswer: string | null;
  onSubmitAnswer: (ans: string) => void;
  partnerName?: string;
  partnerAnswer?: string | null;
}

export function PartnerTelepathyGameView({
  question,
  phase,
  myAnswer,
  onSubmitAnswer,
  partnerName = 'Partner',
  partnerAnswer = 'McDonalds',
}: PartnerTelepathyGameViewProps) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sound.playSuccess();
    onSubmitAnswer(inputText.trim());
  };

  const isTelepathyMatch =
    myAnswer &&
    partnerAnswer &&
    myAnswer.toLowerCase().trim() === partnerAnswer.toLowerCase().trim();

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <GlassCard variant="purple" className="p-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan text-xs font-black uppercase mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Partner Telepathy Mind-Meld</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto">
          &ldquo;{question.prompt}&rdquo;
        </h2>
        <p className="text-xs text-white/60 mt-2">
          Guess the exact word or choice your partner is thinking! No speaking allowed.
        </p>
      </GlassCard>

      {/* Answering Phase */}
      {phase === 'answering' && (
        <GlassCard variant="default" className="p-5">
          {!myAnswer ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/80 block mb-2">
                  Lock In Your Word / Choice:
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g. In-N-Out, Hawaii, ❤️..."
                  className="w-full text-center text-xl font-black px-4 py-3 rounded-xl bg-midnight-950 border border-brand-violet/40 text-white placeholder-white/30 focus:outline-none focus:border-brand-pink"
                />
              </div>

              <NeonButton type="submit" variant="pink" fullWidth size="lg">
                <Send className="w-4 h-4 mr-1.5" /> Send Telepathic Wave 🔮
              </NeonButton>
            </form>
          ) : (
            <div className="p-5 rounded-2xl bg-brand-violet/20 border border-brand-violet/50 text-white text-center space-y-1">
              <div className="inline-flex p-2 rounded-full bg-brand-violet/30 mb-1">
                <Check className="w-6 h-6 stroke-[3] text-brand-cyan" />
              </div>
              <h4 className="font-extrabold text-base">Telepathic Thought Locked!</h4>
              <p className="text-xs text-white/60">
                Waiting for {partnerName} to transmit their answer...
              </p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Reveal Phase */}
      {phase === 'reveal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard variant="pink" className="p-5 text-center">
              <span className="text-xs font-bold text-white/60 uppercase block mb-1">
                Your Mind-Meld Choice
              </span>
              <div className="text-2xl font-black text-brand-pink py-3">
                &ldquo;{myAnswer || 'Tacos'}&rdquo;
              </div>
            </GlassCard>

            <GlassCard variant="purple" className="p-5 text-center">
              <span className="text-xs font-bold text-white/60 uppercase block mb-1">
                {partnerName}&apos;s Mind-Meld Choice
              </span>
              <div className="text-2xl font-black text-brand-cyan py-3">
                &ldquo;{partnerAnswer}&rdquo;
              </div>
            </GlassCard>
          </div>

          <GlassCard
            variant={isTelepathyMatch ? 'glow' : 'default'}
            className="p-6 text-center space-y-2"
          >
            <span className="text-4xl">{isTelepathyMatch ? '🧠⚡' : '🌪️'}</span>
            <h3 className="text-2xl font-black text-white">
              {isTelepathyMatch ? '100% TELEPATHY DETECTED! (+200 PTS)' : 'CHAOTIC DISCONNECT (+40 PTS)'}
            </h3>
            <p className="text-xs text-white/70 max-w-md mx-auto">
              {isTelepathyMatch
                ? 'Identical thoughts! You two literally read each others minds.'
                : 'Not quite on the same wavelength this round, but you still earn chaos points!'}
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
