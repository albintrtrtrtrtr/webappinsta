'use client';

import React from 'react';
import { LeaderboardSection } from '@/components/home/LeaderboardSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" /> Hall of Fame
        </span>
      </div>

      <LeaderboardSection />
    </div>
  );
}
