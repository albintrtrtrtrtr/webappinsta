'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { TimerBar } from '@/components/game/TimerBar';
import { HowWellKnowMeGameView } from '@/components/game/HowWellKnowMeGameView';
import { CoupleChaosGameView } from '@/components/game/CoupleChaosGameView';
import { PartnerTelepathyGameView } from '@/components/game/PartnerTelepathyGameView';
import { RoundResultsModal } from '@/components/game/RoundResultsModal';
import { ReactionOverlay } from '@/components/ui/ReactionOverlay';
import { GameQuestion, RoundPhase } from '@/lib/supabase/types';
import { getGuestSession } from '@/lib/session';
import { ArrowLeft } from 'lucide-react';
import { sound } from '@/lib/sound';

const COUPLES_QUESTIONS: Record<string, GameQuestion[]> = {
  partner_telepathy: [
    {
      id: 'pt_1',
      game_id: 'partner_telepathy',
      category: 'Telepathy',
      prompt: 'Name a fast-food chain. Both write one word without speaking!',
      options: [],
      suggested_timer_sec: 20,
      intensity_level: 1,
      author: 'Platform',
    },
    {
      id: 'pt_2',
      game_id: 'partner_telepathy',
      category: 'Telepathy',
      prompt: 'Name a romantic vacation destination country.',
      options: [],
      suggested_timer_sec: 20,
      intensity_level: 1,
      author: 'Platform',
    },
    {
      id: 'pt_3',
      game_id: 'partner_telepathy',
      category: 'Telepathy',
      prompt: 'Pick a Netflix binge genre for a cozy Friday night.',
      options: ['Horror / Thriller', 'Rom-Com', 'True Crime', 'Sci-Fi'],
      suggested_timer_sec: 20,
      intensity_level: 2,
      author: 'Platform',
    },
  ],
  how_well_know_me: [
    {
      id: 'hw_1',
      game_id: 'how_well_know_me',
      category: 'Habits',
      prompt: 'What is your partner\'s absolute comfort food after a miserable day?',
      options: [],
      suggested_timer_sec: 25,
      intensity_level: 1,
      author: 'Platform',
    },
    {
      id: 'hw_2',
      game_id: 'how_well_know_me',
      category: 'Intimacy',
      prompt: 'Where was the exact location of your first kiss or official first date?',
      options: [],
      suggested_timer_sec: 25,
      intensity_level: 1,
      author: 'Platform',
    },
    {
      id: 'hw_3',
      game_id: 'how_well_know_me',
      category: 'Dreams',
      prompt: 'If your partner won $1,000,000 tomorrow, what is the FIRST thing they buy?',
      options: [],
      suggested_timer_sec: 25,
      intensity_level: 2,
      author: 'Platform',
    },
  ],
  couple_chaos: [
    {
      id: 'cc_1',
      game_id: 'couple_chaos',
      category: 'Drama',
      prompt: 'Who is the bigger drama queen when they catch a mild seasonal cold?',
      options: ['Partner 1', 'Partner 2', 'Both Equal / Neither'],
      suggested_timer_sec: 20,
      intensity_level: 2,
      author: 'Platform',
    },
    {
      id: 'cc_2',
      game_id: 'couple_chaos',
      category: 'Survival',
      prompt: 'In a zombie apocalypse, would the couple survive together or sacrifice each other?',
      options: ['Survive as Soulmates 🛡️', 'Sacrifice for Survival 🧟', 'Argue over directions and get caught 💀'],
      suggested_timer_sec: 25,
      intensity_level: 3,
      author: 'Platform',
    },
    {
      id: 'cc_3',
      game_id: 'couple_chaos',
      category: 'Speed',
      prompt: 'Who takes longer to get ready before going out for dinner?',
      options: ['Partner 1', 'Partner 2', 'Neither'],
      suggested_timer_sec: 20,
      intensity_level: 1,
      author: 'Platform',
    },
  ],
};

function CouplesGameArenaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = (params?.sessionId as string) || 'couples_session';
  const gameParam = searchParams.get('game') || 'partner_telepathy';

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<RoundPhase>('answering');
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const currentQuestions = COUPLES_QUESTIONS[gameParam] || COUPLES_QUESTIONS.partner_telepathy;
  const activeQuestion = currentQuestions[(currentRound - 1) % currentQuestions.length];

  // Timer countdown
  useEffect(() => {
    if (phase !== 'answering') return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('reveal');
          sound.playMatch();
          setTimeout(() => {
            setIsResultsOpen(true);
          }, 7000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const handleNextRound = () => {
    setIsResultsOpen(false);
    setCurrentRound((r) => r + 1);
    setPhase('answering');
    setMyAnswer(null);
    setTimerSeconds(20);
  };

  const handleGenerateStoryCard = () => {
    sound.playSuccess();
    const token = Math.random().toString(36).substring(2, 10);
    router.push(`/story/${token}?mode=couples&score=980&superlative=Telepathic%20Soulmates&partner=Alex`);
  };

  const scores = [
    {
      playerId: 'duo_1',
      nickname: 'You & Alex',
      avatar: '💍',
      score: 520,
      pointsAdded: 200,
      badge: '100% Mind Meld',
    },
    {
      playerId: 'duo_2',
      nickname: 'Maya & Ethan',
      avatar: '✨',
      score: 410,
      pointsAdded: 120,
      badge: 'Unstoppable Duo',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/couples')}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Room
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-midnight-900 border border-white/15 text-xs font-black text-brand-pink">
            Couples Arena • Round {currentRound} / 3
          </div>
          <div className="px-3 py-1 rounded-full bg-brand-violet/20 border border-brand-violet/40 text-xs font-black text-brand-cyan uppercase animate-pulse">
            {phase === 'answering' ? 'Mind Meld Live' : 'Reveals & Scoring'}
          </div>
        </div>
      </div>

      <TimerBar secondsLeft={timerSeconds} totalSeconds={20} className="max-w-md mx-auto" />

      {/* Render Active Couples Game */}
      {gameParam === 'partner_telepathy' && (
        <PartnerTelepathyGameView
          question={activeQuestion}
          phase={phase}
          myAnswer={myAnswer}
          onSubmitAnswer={(ans) => setMyAnswer(ans)}
          partnerName="Alex"
          partnerAnswer="In-N-Out"
        />
      )}

      {gameParam === 'how_well_know_me' && (
        <HowWellKnowMeGameView
          question={activeQuestion}
          phase={phase}
          myAnswer={myAnswer}
          onSubmitAnswer={(ans) => setMyAnswer(ans)}
          partnerName="Alex"
          partnerAvatar="💖"
        />
      )}

      {gameParam === 'couple_chaos' && (
        <CoupleChaosGameView
          question={activeQuestion}
          phase={phase}
          selectedOption={myAnswer}
          onSelectOption={(opt) => setMyAnswer(opt)}
          couplesScore={450}
          singlesScore={390}
          results={{
            optionCounts: { 'Partner 1': 3, 'Partner 2': 1, 'Both Equal / Neither': 2 },
            totalVotes: 6,
          }}
        />
      )}

      {/* Results Recap Modal */}
      <RoundResultsModal
        isOpen={isResultsOpen}
        roundNumber={currentRound}
        totalRounds={3}
        scores={scores}
        onNextRound={handleNextRound}
        onViewStoryCard={handleGenerateStoryCard}
        isHost={true}
        surpriseEvent={currentRound === 2 ? 'Telepathy Multiplier 2x' : null}
      />

      {/* Realtime Floating Reaction Bar */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <ReactionOverlay
          sessionId={sessionId}
          currentPlayerId="guest_player"
          currentPlayerName="Player"
          showBar={true}
        />
      </div>
    </div>
  );
}

export default function CouplesGameArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-white/50 text-sm">
          Loading Couples Arena...
        </div>
      }
    >
      <CouplesGameArenaContent />
    </Suspense>
  );
}
