'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Sparkles, Calendar, Clock, Trophy, Flame } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  multiplier: string;
  endsIn: string;
  icon: string;
}

const FEATURED_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Midnight Red Flag Showdown',
    description: 'Double XP on all controversial dating votes & high-stakes debate rounds.',
    badge: '2X Score Drop',
    multiplier: '2.0x XP',
    endsIn: '3h 42m',
    icon: '🌙',
  },
  {
    id: '2',
    title: 'Couples Telepathy Championship',
    description: 'Score 5 consecutive answer syncs to unlock the limited "Soulmate Badge" story card.',
    badge: 'Exclusive Story Card',
    multiplier: 'Rare Drop',
    endsIn: '1d 14h',
    icon: '🔮',
  },
  {
    id: '3',
    title: 'Blind Confession Roast Night',
    description: 'Top voted hilarious confession wins the Viral IG Story Legend Trophy.',
    badge: 'Community Pick',
    multiplier: '500 Pts',
    endsIn: '4d 06h',
    icon: '🔥',
  },
];

export function LiveChallengesSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Live Challenges & Drops
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">
                Weekly Drop
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Limited-time party events, double-score rounds & exclusive IG story badges
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURED_EVENTS.map((evt) => (
          <GlassCard key={evt.id} variant="default" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{evt.icon}</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                  {evt.badge}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-white">{evt.title}</h3>
              <p className="text-xs text-white/65 mt-1.5 leading-relaxed">{evt.description}</p>
            </div>

            <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {evt.multiplier}
              </span>
              <span className="text-white/50 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {evt.endsIn}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
