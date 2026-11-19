'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { NeonButton } from '@/components/ui/NeonButton';
import { Flame, Heart, Sparkles, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HeroBannerProps {
  onQuickPlay: () => void;
}

export function HeroBanner({ onQuickPlay }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-midnight-800 via-midnight-900 to-midnight-950 border border-brand-purple/30 p-6 md:p-8 shadow-2xl">
      {/* Background cyber ambient glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-violet/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-pink/15 border border-brand-pink/40 text-brand-pink text-xs font-bold mb-3 shadow-[0_0_12px_rgba(255,46,147,0.3)]">
            <span className="w-2 h-2 rounded-full bg-brand-pink animate-ping" />
            <Sparkles className="w-3.5 h-3.5" />
            <span>SEASON 1: ZERO FILTER DATING PARTY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Play with strangers.{' '}
            <span className="bg-gradient-to-r from-brand-pink via-purple-300 to-brand-cyan bg-clip-text text-transparent">
              Reveal your crushes.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 mt-3 max-w-lg leading-relaxed">
            Multiplayer party games engineered for social chaos, telepathic couples, and instant Instagram story flexes.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <NeonButton
              variant="pink"
              size="lg"
              onClick={onQuickPlay}
              className="font-black text-base shadow-xl"
            >
              <Zap className="w-5 h-5 mr-1 fill-white" /> Quick Match Now
            </NeonButton>

            <Link href="/couples">
              <NeonButton variant="purple" size="lg">
                <Heart className="w-5 h-5 mr-1 text-pink-300 fill-pink-300" /> Couples Room
              </NeonButton>
            </Link>
          </div>
        </div>

        {/* Live dynamic preview widget */}
        <div className="w-full md:w-72 bg-midnight-950/70 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-white/80">
            <span className="flex items-center gap-1.5 text-brand-cyan">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              TOP TRENDING GAME
            </span>
            <span className="text-brand-pink">8.4k plays</span>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-pink/15 to-brand-violet/20 border border-brand-pink/30 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🚩</span>
              <span className="font-extrabold text-sm text-white">The Red Flag Trial</span>
            </div>
            <p className="text-xs text-white/70 line-clamp-2">
              "They still like their ex&apos;s gym selfies every day..." Dealbreaker or harmless?
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>4-8 Players • 8 Mins</span>
            <span className="text-emerald-400 font-bold">Lobbies Filling Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
