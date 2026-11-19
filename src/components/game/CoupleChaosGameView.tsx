'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameQuestion, RoundPhase } from '@/lib/supabase/types';
import { Swords, Shield, Flame, Check, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { sound } from '@/lib/sound';

interface CoupleChaosGameViewProps {
  question: GameQuestion;
  phase: RoundPhase;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  couplesScore?: number;
  singlesScore?: number;
  results?: {
    optionCounts: Record<string, number>;
    totalVotes: number;
  };
}

export function CoupleChaosGameView({
  question,
  phase,
  selectedOption,
  onSelectOption,
  couplesScore = 320,
  singlesScore = 290,
  results,
}: CoupleChaosGameViewProps) {
  const options = question.options && question.options.length > 0
    ? question.options
    : ['Partner 1', 'Partner 2', 'Both Equal / Neither'];

  const handleSelect = (opt: string) => {
    if (phase !== 'answering') return;
    sound.playPop();
    onSelectOption(opt);
  };

  return (
    <div className="space-y-6">
      {/* Team Battle Scoreboard */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-brand-pink/20 to-brand-violet/20 border border-brand-pink/40 text-center">
          <span className="text-[10px] font-extrabold uppercase text-brand-pink tracking-wider flex items-center justify-center gap-1">
            💖 Couples Team
          </span>
          <span className="text-2xl font-black text-white">{couplesScore} pts</span>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-r from-brand-cyan/20 to-blue-600/20 border border-brand-cyan/40 text-center">
          <span className="text-[10px] font-extrabold uppercase text-brand-cyan tracking-wider flex items-center justify-center gap-1">
            ⚡ Singles Squad
          </span>
          <span className="text-2xl font-black text-white">{singlesScore} pts</span>
        </div>
      </div>

      {/* Question Card */}
      <GlassCard variant="glow" className="p-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase mb-3">
          <Swords className="w-3.5 h-3.5" />
          <span>Couple Chaos Battle Round</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto">
          &ldquo;{question.prompt}&rdquo;
        </h2>
        {question.scenario_details && (
          <p className="text-xs text-white/60 mt-2 italic">{question.scenario_details}</p>
        )}
      </GlassCard>

      {/* Voting Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt;
          const count = results?.optionCounts?.[opt] || 0;
          const total = results?.totalVotes || 1;
          const pct = Math.round((count / total) * 100);

          return (
            <motion.div
              key={opt}
              whileHover={phase === 'answering' ? { scale: 1.02 } : {}}
              whileTap={phase === 'answering' ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(opt)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-pink/25 border-brand-pink ring-2 ring-brand-pink/50 shadow-[0_0_20px_rgba(255,46,147,0.4)]'
                  : 'bg-midnight-950/70 border-white/10 hover:border-brand-purple/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-black text-white">{opt}</h4>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-brand-pink flex items-center justify-center text-white text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {phase === 'reveal' && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white/70">{count} Votes</span>
                    <span className="text-brand-cyan">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-midnight-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-pink to-brand-cyan"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
