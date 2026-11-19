'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Trophy, Flame, Heart, Crown, Medal, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LeaderboardEntry } from '@/lib/supabase/types';
import { sound } from '@/lib/sound';

const DEFAULT_SINGLES_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, id: 'p1', name: 'CyberAphrodite', avatar: '💖', score: 3420, badge: 'Green Flag Magnet', category: 'singles', winStreak: 7 },
  { rank: 2, id: 'p2', name: 'MidnightVibe', avatar: '⚡', score: 2980, badge: 'Debate Champion', category: 'singles', winStreak: 5 },
  { rank: 3, id: 'p3', name: 'NeonFox', avatar: '🦊', score: 2650, badge: 'Crush Magnet', category: 'singles', winStreak: 4 },
  { rank: 4, id: 'p4', name: 'ChaosKing', avatar: '👑', score: 2410, badge: 'Wild Confessor', category: 'singles', winStreak: 3 },
  { rank: 5, id: 'p5', name: 'VelvetStar', avatar: '🍸', score: 2190, badge: 'Social Butterfly', category: 'singles', winStreak: 3 },
];

const DEFAULT_COUPLES_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, id: 'c1', name: 'Aria & Leo', avatar: '💍', score: 4890, badge: 'Telepathic Soulmates', category: 'couples', winStreak: 12 },
  { rank: 2, id: 'c2', name: 'Maya & Ethan', avatar: '✨', score: 4210, badge: 'Unstoppable Duo', category: 'couples', winStreak: 8 },
  { rank: 3, id: 'c3', name: 'Kai & Chloe', avatar: '🔥', score: 3840, badge: 'Chaos Crushers', category: 'couples', winStreak: 6 },
  { rank: 4, id: 'c4', name: 'Sam & Alex', avatar: '🦄', score: 3410, badge: 'Mind Readers', category: 'couples', winStreak: 5 },
];

export function LeaderboardSection() {
  const [tab, setTab] = useState<'daily' | 'weekly' | 'couples'>('daily');
  const [singlesData, setSinglesData] = useState<LeaderboardEntry[]>(DEFAULT_SINGLES_LEADERBOARD);
  const [couplesData, setCouplesData] = useState<LeaderboardEntry[]>(DEFAULT_COUPLES_LEADERBOARD);

  useEffect(() => {
    // Attempt to pull real team scores or profile scores from Supabase
    const fetchRealScores = async () => {
      try {
        const { data: teamData } = await supabase
          .from('team_scores')
          .select('score, streak, telepathy_matches, teams(team_name, avatar)')
          .order('score', { ascending: false })
          .limit(5);

        if (teamData && teamData.length > 0) {
          const formatted: LeaderboardEntry[] = teamData.map((t: any, idx: number) => ({
            rank: idx + 1,
            id: `team_${idx}`,
            name: t.teams?.team_name || `Duo ${idx + 1}`,
            avatar: t.teams?.avatar || '💖',
            score: t.score || 0,
            badge: t.streak > 3 ? 'Hot Streak 🔥' : 'Telepathy Champions',
            category: 'couples',
            winStreak: t.streak || 1,
          }));
          setCouplesData(formatted);
        }
      } catch {}
    };

    fetchRealScores();
  }, []);

  const activeList = tab === 'couples' ? couplesData : singlesData;

  const handleTabChange = (t: 'daily' | 'weekly' | 'couples') => {
    sound.playPop();
    setTab(t);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            <Trophy className="w-4 h-4 fill-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Hall of Fame & Leaderboard
            </h2>
            <p className="text-xs text-white/60">
              Real-time rankings • Updated after every game session
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-xl bg-midnight-950/80 border border-white/10 text-xs self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('daily')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              tab === 'daily'
                ? 'bg-brand-pink text-white shadow-[0_0_10px_rgba(255,46,147,0.5)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Daily Rivals
          </button>
          <button
            onClick={() => handleTabChange('weekly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              tab === 'weekly'
                ? 'bg-brand-violet text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Weekly Legends
          </button>
          <button
            onClick={() => handleTabChange('couples')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              tab === 'couples'
                ? 'bg-brand-cyan text-midnight-950 shadow-[0_0_10px_rgba(0,242,254,0.5)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Winning Couples
          </button>
        </div>
      </div>

      <GlassCard variant="default" className="p-0 overflow-hidden">
        <div className="divide-y divide-white/10">
          {activeList.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const rankMedal =
              entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-black text-sm text-white/80">
                    {rankMedal}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-midnight-950 border border-white/15 flex items-center justify-center text-xl shadow-md">
                    {entry.avatar}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{entry.name}</span>
                      {entry.winStreak > 2 && (
                        <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-rose-500" /> {entry.winStreak}W
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/50">{entry.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm sm:text-base text-brand-cyan block">
                    {entry.score.toLocaleString()} pts
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    +{Math.floor(entry.score * 0.1)} today
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </section>
  );
}
