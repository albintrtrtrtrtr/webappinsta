'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { GameCatalogItem, Lobby } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { Flame, Users, Play, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

const SINGLES_GAMES: GameCatalogItem[] = [
  {
    id: 'red_flag_trial',
    title: 'The Red Flag Trial',
    slug: 'red-flag-trial',
    description: 'Vote on wildly controversial dating scenarios: Red Flag, Green Flag, or Depends. Defend your hot takes!',
    category: 'singles',
    min_players: 4,
    max_players: 8,
    estimated_minutes: 8,
    icon: '🚩',
    badge: '🔥 Most Popular',
    is_active: true,
  },
  {
    id: 'crush_detector',
    title: 'Crush Detector',
    slug: 'crush-detector',
    description: 'Secretly select who catches your vibe. Reveal unexpected matches and mutual crushes with 100% consent.',
    category: 'singles',
    min_players: 4,
    max_players: 8,
    estimated_minutes: 10,
    icon: '💘',
    badge: '👀 Dating Radar',
    is_active: true,
  },
  {
    id: 'blind_confession',
    title: 'The Blind Confession',
    slug: 'blind-confession',
    description: 'Submit anonymous wild dating stories and hilarious confessions. Guess the author and vote for funniest!',
    category: 'singles',
    min_players: 4,
    max_players: 8,
    estimated_minutes: 12,
    icon: '🤫',
    badge: '🎭 Pure Chaos',
    is_active: true,
  },
];

interface SinglesLobbySectionProps {
  onJoinGame: (gameId: string) => void;
}

export function SinglesLobbySection({ onJoinGame }: SinglesLobbySectionProps) {
  const router = useRouter();
  const [activeLobbies, setActiveLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const { data } = await supabase
          .from('lobbies')
          .select('*')
          .in('status', ['waiting', 'starting'])
          .order('created_at', { ascending: false })
          .limit(4);

        if (data && data.length > 0) {
          setActiveLobbies(data);
        }
      } catch {}
    };

    fetchLobbies();
  }, []);

  const handleQuickJoin = (gameId?: string) => {
    sound.playPop();
    router.push(`/singles/lobby${gameId ? `?game=${gameId}` : ''}`);
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center text-brand-pink shadow-[0_0_10px_rgba(255,46,147,0.3)]">
            <Flame className="w-4 h-4 fill-brand-pink" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Singles Matchmaking
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-pink/25 text-brand-pink border border-brand-pink/40">
                4-8 Players
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Live public party rooms • Flirt, debate, and uncover instant sparks
            </p>
          </div>
        </div>

        <NeonButton
          variant="outline"
          size="sm"
          onClick={() => handleQuickJoin()}
          className="hidden sm:inline-flex"
        >
          View All Lobbies →
        </NeonButton>
      </div>

      {/* 3 Core Singles Games */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SINGLES_GAMES.map((game) => (
          <GlassCard
            key={game.id}
            variant="pink"
            className="flex flex-col justify-between hover:scale-[1.01] transition-all cursor-pointer group"
            onClick={() => handleQuickJoin(game.id)}
          >
            <div>
              {/* Badge & Icon */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {game.icon}
                </span>
                {game.badge && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-pink/20 text-brand-pink border border-brand-pink/40">
                    {game.badge}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-brand-pink transition-colors">
                {game.title}
              </h3>
              <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                {game.description}
              </p>
            </div>

            <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-brand-cyan" /> {game.min_players}-{game.max_players} players
              </span>

              <NeonButton
                variant="pink"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickJoin(game.id);
                }}
              >
                Join Lobby <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </NeonButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
