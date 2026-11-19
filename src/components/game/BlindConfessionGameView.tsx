'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameQuestion, RoundPhase } from '@/lib/supabase/types';
import { Send, Check, Eye, EyeOff, Trophy, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { sound } from '@/lib/sound';

interface ConfessionItem {
  id: string;
  playerId: string;
  authorNickname?: string;
  authorAvatar?: string;
  text: string;
  revealAuthor?: boolean;
  votes: {
    funniest: number;
    relatable: number;
    unexpected: number;
  };
}

interface BlindConfessionGameViewProps {
  question: GameQuestion;
  phase: RoundPhase;
  currentPlayerId: string;
  submittedAnswer: string | null;
  onSubmitAnswer: (text: string, allowReveal: boolean) => void;
  confessions: ConfessionItem[];
  onVote: (confessionId: string, voteType: 'funniest' | 'relatable' | 'unexpected') => void;
  myVotes?: Record<string, 'funniest' | 'relatable' | 'unexpected'>;
}

export function BlindConfessionGameView({
  question,
  phase,
  currentPlayerId,
  submittedAnswer,
  onSubmitAnswer,
  confessions,
  onVote,
  myVotes = {},
}: BlindConfessionGameViewProps) {
  const [inputText, setInputText] = useState('');
  const [allowAuthorReveal, setAllowAuthorReveal] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sound.playSuccess();
    onSubmitAnswer(inputText.trim(), allowAuthorReveal);
  };

  const handleVote = (confessionId: string, type: 'funniest' | 'relatable' | 'unexpected') => {
    sound.playPop();
    onVote(confessionId, type);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Card */}
      <GlassCard variant="purple" className="p-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-violet/25 border border-brand-violet/40 text-brand-violet text-xs font-black uppercase mb-3">
          <EyeOff className="w-3.5 h-3.5" />
          <span>Anonymous Confession Box</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug max-w-2xl mx-auto">
          &ldquo;{question.prompt}&rdquo;
        </h2>
        <p className="text-xs text-white/60 mt-2">
          {phase === 'answering'
            ? 'All answers are 100% anonymous during voting. Spill the truth!'
            : 'Vote on the confessions below to crown the round champion.'}
        </p>
      </GlassCard>

      {/* Phase 1: Answering Form */}
      {phase === 'answering' && (
        <GlassCard variant="default" className="p-5">
          {!submittedAnswer ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/80 block mb-2">
                  Your Anonymous Confession
                </label>
                <textarea
                  rows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Tell your wildest, funniest, or most embarrassing story..."
                  className="w-full px-4 py-3 rounded-xl bg-midnight-950 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAuthorReveal}
                    onChange={(e) => setAllowAuthorReveal(e.target.checked)}
                    className="accent-brand-pink rounded w-4 h-4"
                  />
                  <span>Reveal my name if my confession wins</span>
                </label>

                <NeonButton type="submit" variant="pink" size="md">
                  <Send className="w-4 h-4 mr-1.5" /> Lock In Secret
                </NeonButton>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Confession locked! Waiting for others to confess...</span>
            </div>
          )}
        </GlassCard>
      )}

      {/* Phase 2: Voting on Anonymous Cards */}
      {(phase === 'voting' || phase === 'reveal') && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-white/70 uppercase tracking-wider">
            {phase === 'voting' ? 'Vote on the confessions:' : 'Voting Results & Crown:'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confessions.map((confession, idx) => {
              const myVote = myVotes[confession.id];
              const totalVotes =
                confession.votes.funniest + confession.votes.relatable + confession.votes.unexpected;

              return (
                <GlassCard
                  key={confession.id}
                  variant={totalVotes > 2 ? 'glow' : 'default'}
                  className="p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-extrabold text-brand-cyan uppercase tracking-wider">
                        Confession #{idx + 1}
                      </span>
                      {phase === 'reveal' && confession.authorNickname && (
                        <span className="text-xs font-bold text-brand-pink flex items-center gap-1">
                          By: {confession.authorAvatar} {confession.authorNickname}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white/90 leading-relaxed italic bg-midnight-950/50 p-3 rounded-xl border border-white/5 mb-4">
                      &ldquo;{confession.text}&rdquo;
                    </p>
                  </div>

                  {/* Voting Buttons */}
                  {phase === 'voting' ? (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleVote(confession.id, 'funniest')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                          myVote === 'funniest'
                            ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg">😂</span>
                        <span>Funniest</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(confession.id, 'relatable')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                          myVote === 'relatable'
                            ? 'bg-brand-pink/30 border-brand-pink text-pink-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg">💯</span>
                        <span>Relatable</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(confession.id, 'unexpected')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                          myVote === 'unexpected'
                            ? 'bg-brand-violet/30 border-brand-violet text-purple-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg">😱</span>
                        <span>Unexpected</span>
                      </button>
                    </div>
                  ) : (
                    /* Reveal Breakdown */
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-bold">
                      <div className="flex items-center gap-3 text-white/70">
                        <span>😂 {confession.votes.funniest}</span>
                        <span>💯 {confession.votes.relatable}</span>
                        <span>😱 {confession.votes.unexpected}</span>
                      </div>
                      <span className="text-brand-cyan text-sm">
                        {totalVotes * 50} pts awarded
                      </span>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
