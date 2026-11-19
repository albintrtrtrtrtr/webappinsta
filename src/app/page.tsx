'use client';

import React, { useState } from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { SinglesLobbySection } from '@/components/home/SinglesLobbySection';
import { CouplesArenaSection } from '@/components/home/CouplesArenaSection';
import { LiveChallengesSection } from '@/components/home/LiveChallengesSection';
import { LeaderboardSection } from '@/components/home/LeaderboardSection';
import { ReactionOverlay } from '@/components/ui/ReactionOverlay';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

export default function HomePage() {
  const router = useRouter();

  const handleQuickPlay = () => {
    sound.playSuccess();
    router.push('/singles/lobby');
  };

  const handleJoinSpecificGame = (gameId: string) => {
    sound.playPop();
    router.push(`/singles/lobby?game=${gameId}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-8">
      {/* 1. Hero Dynamic Banner */}
      <HeroBanner onQuickPlay={handleQuickPlay} />

      {/* 2. Singles Matchmaking Lobby Section */}
      <SinglesLobbySection onJoinGame={handleJoinSpecificGame} />

      {/* 3. Couples Team Arena Section */}
      <CouplesArenaSection />

      {/* 4. Live Challenges & Weekly Drops */}
      <LiveChallengesSection />

      {/* 5. Leaderboard & Hall of Fame */}
      <LeaderboardSection />

      {/* Ambient Realtime Floating Reactions demonstration for home */}
      <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-30">
        <ReactionOverlay
          sessionId="global_home"
          currentPlayerId="home_guest"
          currentPlayerName="Viber"
          showBar={true}
        />
      </div>
    </div>
  );
}
