'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameQuestion, RoundPhase } from '@/lib/supabase/types';
import { Flame, Check, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/sound';

interface RedFlagGameViewProps {
  question: GameQuestion;
  phase: RoundPhase;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  results?: {
    optionCounts: Record<string, number>;
    totalVotes: number;
    playerChoices: Array<{ playerId: string; nickname: string; avatar: string; option: string }>;
  };
  onDefendChoice?: (text: string) => void;
}

export function RedFlagGameView({
  question,
  phase,
  selectedOption,
  onSelectOption,
  results,
  onDefendChoice,
}: RedFlagGameViewProps) {
  const [defenseText, setDefenseText] = useState('');
  const [defenseSubmitted, setDefenseSubmitted] = useState(false);

  const OPTIONS = [
    {
      id: 'Red Flag 🚩',
      label: 'Red Flag 🚩',
      color: 'from-rose-500 to-red-600',
      borderColor: 'border-rose-500/50 hover:border-rose-500',
      activeColor: 'bg-rose-500/25 border-rose-500 ring-2 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.4)]',
      desc: 'Dealbreaker! Run for the hills immediately.',
    },
    {
      id: 'Green Flag 🟢',
      label: 'Green Flag 🟢',
      color: 'from-emerald-400 to-teal-500',
      borderColor: 'border-emerald-500/50 hover:border-emerald-500',
      activeColor: 'bg-emerald-500/25 border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
      desc: 'Healthy & mature! Shows confidence and zero insecurity.',
    },
    {
      id: 'Depends 🤔',
      label: 'Depends 🤔',
      color: 'from-amber-400 to-yellow-500',
      borderColor: 'border-amber-500/50 hover:border-amber-500',
      activeColor: 'bg-amber-500/25 border-amber-500 ring-2 ring-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      desc: 'Context matters! How long have they been broken up?',
    },
  ];

  const handleSelect = (optionId: string) => {
    if (phase !== 'answering') return;
    sound.playPop();
    onSelectOption(optionId);
  };

  const handleDefend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseText.trim()) return;
    sound.playSuccess();
    setDefenseSubmitted(true);
    if (onDefendChoice) onDefendChoice(defenseText.trim());
  };

  return (
    <div className="space-y-6">
      {/* Question Prompt Card */}
      <GlassCard variant="pink" className="p-6 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-brand-pink text-xs font-black uppercase mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Dating Scenario #{question.category}</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto">
          &ldquo;{question.prompt}&rdquo;
        </h2>

        {question.scenario_details && (
          <p className="text-sm text-white/70 mt-3 italic max-w-lg mx-auto bg-midnight-950/40 p-2.5 rounded-xl border border-white/5">
            {question.scenario_details}
          </p>
        )}
      </GlassCard>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const voteCount = results?.optionCounts?.[opt.id] || 0;
          const total = results?.totalVotes || 1;
          const percentage = Math.round((voteCount / total) * 100);

          return (
            <motion.div
              key={opt.id}
              whileHover={phase === 'answering' ? { scale: 1.02 } : {}}
              whileTap={phase === 'answering' ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(opt.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? opt.activeColor
                  : `bg-midnight-950/70 border-white/10 ${phase === 'answering' ? opt.borderColor : ''}`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-white">{opt.label}</h3>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-brand-pink flex items-center justify-center text-white text-xs shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{opt.desc}</p>
              </div>

              {/* Reveal Phase Statistics */}
              {phase === 'reveal' && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white/80">{voteCount} Votes</span>
                    <span className="text-brand-cyan text-sm">{percentage}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-midnight-900 border border-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${opt.color}`}
                    />
                  </div>

                  {/* Voters avatars */}
                  {results?.playerChoices && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {results.playerChoices
                        .filter((p) => p.option === opt.id)
                        .map((p) => (
                          <span
                            key={p.playerId}
                            title={p.nickname}
                            className="text-base bg-white/10 p-1 rounded-lg border border-white/10"
                          >
                            {p.avatar}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Reveal Phase: Hot Take / Defend your choice */}
      {phase === 'reveal' && (
        <GlassCard variant="default" className="p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-pink uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" />
            <span>Defend Your Take! (Lobby Live Debate)</span>
          </div>

          {!defenseSubmitted ? (
            <form onSubmit={handleDefend} className="flex gap-2">
              <input
                type="text"
                value={defenseText}
                onChange={(e) => setDefenseText(e.target.value)}
                placeholder="Why is your take 100% correct? Tell the room..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-midnight-950 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-pink"
              />
              <NeonButton type="submit" variant="pink" size="md">
                Send Take 🔥
              </NeonButton>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Your hot take was broadcasted to the room!</span>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
