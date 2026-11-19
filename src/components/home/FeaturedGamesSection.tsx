'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Gamepad2, Users, Clock, Sparkles, Flame, Heart, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

interface MiniGame {
  id: string;
  title: string;
  slug: string;
  description: string;
  mode: 'singles' | 'couples';
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes: number;
  icon: string;
  badge: string;
  tagline: string;
}

const ALL_CATALOG_GAMES: MiniGame[] = [
  {
    id: 'red_flag_trial',
    title: 'The Red Flag Trial',
    slug: 'red-flag-trial',
    description: 'Vote on controversial dating scenarios: Red Flag 🚩, Green Flag 🟢, or Depends 🤔. Defend your hot takes in real-time debates!',
    mode: 'singles',
    minPlayers: 3,
    maxPlayers: 8,
    estimatedMinutes: 8,
    icon: '🚩',
    badge: 'Most Viral',
    tagline: 'Singles Dating Debate',
  },
  {
    id: 'crush_detector',
    title: 'Crush Detector',
    slug: 'crush-detector',
    description: 'Secretly select who shares an electric connection. Reveal unexpected matches, mutual crushes, and flirtatious vibes with 100% consent.',
    mode: 'singles',
    minPlayers: 4,
    maxPlayers: 8,
    estimatedMinutes: 10,
    icon: '💘',
    badge: 'Matchmaker',
    tagline: 'Secret Vibe Reveal',
  },
  {
    id: 'blind_confession',
    title: 'The Blind Confession',
    slug: 'blind-confession',
    description: 'Submit anonymous spicy answers to outrageous prompts, then vote on the wildest confession before the dramatic author reveal.',
    mode: 'singles',
    minPlayers: 3,
    maxPlayers: 8,
    estimatedMinutes: 7,
    icon: '🎭',
    badge: 'Wild Chaos',
    tagline: 'Anonymous Truths',
  },
  {
    id: 'how_well_know_me',
    title: 'How Well Do You Know Me?',
    slug: 'how-well-know-me',
    description: 'The ultimate couples showdown. Both partners answer simultaneously to reveal who remembers dates, quirks, and secret habits best.',
    mode: 'couples',
    minPlayers: 2,
    maxPlayers: 4,
    estimatedMinutes: 8,
    icon: '💍',
    badge: 'Couples Favorite',
    tagline: 'Partner Trivia Duel',
  },
  {
    id: 'couple_chaos',
    title: 'Couple Chaos: Couples vs Singles',
    slug: 'couple-chaos',
    description: 'Fast-paced squad arena where established couples defend their relationship quirks against single players looking for drama.',
    mode: 'couples',
    minPlayers: 4,
    maxPlayers: 8,
    estimatedMinutes: 12,
    icon: '⚡',
    badge: 'Team Arena',
    tagline: 'Squad Battleground',
  },
  {
    id: 'partner_telepathy',
    title: 'Partner Telepathy',
    slug: 'partner-telepathy',
    description: 'Anticipate partner answers without speaking! Lock in identical word or emoji entries to earn unbroken synchronicity streaks.',
    mode: 'couples',
    minPlayers: 2,
    maxPlayers: 8,
    estimatedMinutes: 10,
    icon: '🔮',
    badge: 'Mind Meld',
    tagline: 'Synchronicity Streak',
  },
];

export function FeaturedGamesSection() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'singles' | 'couples'>('all');

  const filteredGames = ALL_CATALOG_GAMES.filter((g) => {
    if (filter === 'all') return true;
    return g.mode === filter;
  });

  const handleLaunchGame = (game: MiniGame) => {
    sound.playSuccess();
    if (game.mode === 'singles') {
      router.push(`/singles/lobby?game=${game.id}`);
    } else {
      router.push(`/couples?action=create&game=${game.id}`);
    }
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            <Gamepad2 className="w-4 h-4 fill-brand-cyan" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Featured Mini-Games
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-cyan/25 text-brand-cyan border border-brand-cyan/40">
                6 Active Modes
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Jackbox-style multiplayer entertainment engineered for live reactions & viral clips
            </p>
          </div>
        </div>

        {/* Mode Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-midnight-950/80 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => {
              sound.playPop();
              setFilter('all');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white/20 text-white shadow'
                : 'text-white/50 hover:text-white'
            }`}
          >
            All Games ({ALL_CATALOG_GAMES.length})
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setFilter('singles');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              filter === 'singles'
                ? 'bg-brand-pink text-white shadow-[0_0_10px_rgba(255,46,147,0.5)]'
                : 'text-white/50 hover:text-brand-pink'
            }`}
          >
            <Flame className="w-3 h-3 fill-current" /> Singles
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setFilter('couples');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              filter === 'couples'
                ? 'bg-brand-violet text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                : 'text-white/50 hover:text-brand-violet'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" /> Couples
          </button>
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map((game) => {
          const isSingles = game.mode === 'singles';

          return (
            <GlassCard
              key={game.id}
              variant={isSingles ? 'pink' : 'purple'}
              className="flex flex-col justify-between group hover:border-white/30 transition-all hover:-translate-y-1 duration-200"
            >
              <div>
                {/* Top Badge & Mode Indicator */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform">
                    {game.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isSingles
                          ? 'bg-brand-pink/20 text-brand-pink border-brand-pink/40'
                          : 'bg-brand-violet/25 text-purple-300 border-brand-violet/40'
                      }`}
                    >
                      {game.badge}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan block">
                    {game.tagline}
                  </span>
                  <h3 className="text-lg font-black text-white group-hover:text-pink-200 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed mt-1">
                    {game.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Info & Launch Button */}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-white/60 font-semibold">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {game.minPlayers}-{game.maxPlayers} Players
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{game.estimatedMinutes} Mins
                  </span>
                </div>

                <NeonButton
                  variant={isSingles ? 'pink' : 'purple'}
                  size="sm"
                  fullWidth
                  onClick={() => handleLaunchGame(game)}
                  className="font-bold text-xs"
                >
                  Play {isSingles ? 'Singles Lobby' : 'Couples Arena'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </NeonButton>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
