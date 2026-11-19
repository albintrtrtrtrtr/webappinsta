'use client';

import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { SinglesLobbySection } from '@/components/home/SinglesLobbySection';
import { CouplesArenaSection } from '@/components/home/CouplesArenaSection';
import { LiveChallengesSection } from '@/components/home/LiveChallengesSection';
import { FeaturedGamesSection } from '@/components/home/FeaturedGamesSection';
import { HowToPlaySection } from '@/components/home/HowToPlaySection';
import { LeaderboardSection } from '@/components/home/LeaderboardSection';
import { PlatformFooter } from '@/components/layout/PlatformFooter';
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
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-10">
        {/* 1. Premium Welcome / Hero Section */}
        <HeroBanner onQuickPlay={handleQuickPlay} />

        {/* 2. Singles Matchmaking Lobby Section */}
        <SinglesLobbySection onJoinGame={handleJoinSpecificGame} />

        {/* 3. Couples Team Arena Section */}
        <CouplesArenaSection />

        {/* 4. Live Challenges & Weekly Drops */}
        <LiveChallengesSection />

        {/* 5. Featured Mini-Games (6 Interactive Party Modes) */}
        <FeaturedGamesSection />

        {/* 6. How-To-Play & Viral Social Loop Guide */}
        <HowToPlaySection />

        {/* 7. Leaderboard & Hall of Fame */}
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

      {/* 8. Platform Footer & Navigation */}
      <PlatformFooter />
    </div>
  );
}
