'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { HelpCircle, Zap, ShieldCheck, Eye, Share2, Sparkles, CheckCircle2 } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Frictionless Entry',
    tagline: 'Zero Passwords, 100% Party',
    description: 'Enter with a guest persona or link Supabase auth. Join matchmaking lobbies in under 5 seconds or create private 4-digit code rooms.',
    icon: '⚡',
    accent: 'from-brand-pink/20 to-purple-500/20 text-brand-pink',
  },
  {
    number: '02',
    title: 'Secret Answer Lock-In',
    tagline: 'Cryptographic Privacy',
    description: 'Synchronized live rounds count down. Your answers stay encrypted and strictly masked until the buzzer sounds—no peeking allowed.',
    icon: '🔒',
    accent: 'from-brand-cyan/20 to-blue-500/20 text-brand-cyan',
  },
  {
    number: '03',
    title: 'Consensus & Crushes',
    tagline: 'Social Chaos & Mutual Sparks',
    description: 'Vote on hot takes, trigger live emoji storms, and secretly tag players who catch your eye. Mutual crushes unlock only when both players say YES.',
    icon: '💘',
    accent: 'from-brand-violet/20 to-pink-500/20 text-purple-300',
  },
  {
    number: '04',
    title: 'Instant Story Flex',
    tagline: '1080x1920 Story Cards',
    description: 'Generate high-voltage Instagram Story cards with dynamic compatibility scores, archetype titles, and shareable QR tokens.',
    icon: '📸',
    accent: 'from-amber-500/20 to-brand-pink/20 text-amber-300',
  },
];

export function HowToPlaySection() {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              How To Play & Vibe
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                Quick Guide
              </span>
            </h2>
            <p className="text-xs text-white/60">
              The Jackbox x Hinge social gaming loop in 4 quick steps
            </p>
          </div>
        </div>
      </div>

      {/* 4 Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step) => (
          <GlassCard
            key={step.number}
            variant="default"
            className="flex flex-col justify-between relative overflow-hidden group hover:border-white/30 transition-all duration-200"
          >
            <div>
              {/* Header with step number and icon */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl filter drop-shadow">{step.icon}</span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                  {step.number}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                  {step.tagline}
                </span>
                <h3 className="text-base font-black text-white group-hover:text-brand-cyan transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed mt-2">
                  {step.description}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-Time Synchronized</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
