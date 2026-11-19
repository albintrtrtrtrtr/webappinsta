'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSinglesGame } from '@/hooks/useSinglesGame';
import { TimerBar } from '@/components/game/TimerBar';
import { RedFlagGameView } from '@/components/game/RedFlagGameView';
import { CrushDetectorGameView } from '@/components/game/CrushDetectorGameView';
import { BlindConfessionGameView } from '@/components/game/BlindConfessionGameView';
import { RoundResultsModal } from '@/components/game/RoundResultsModal';
import { ReactionOverlay } from '@/components/ui/ReactionOverlay';
import { ArrowLeft, Sparkles, Trophy } from 'lucide-react';
import { sound } from '@/lib/sound';

export default function SinglesGameArenaPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string) || 'default_session';

  const {
    gameId,
    activeQuestion,
    currentRoundNumber,
    totalRounds,
    phase,
    timerSeconds,
    totalTimerSeconds,
    players,
    currentSession,
    myAnswer,
    selectedCrushTarget,
    optionCounts,
    playerChoices,
    detectedMatches,
    confessionsList,
    isResultsModalOpen,
    submitAnswer,
    submitCrushPick,
    nextRound,
    setIsResultsModalOpen,
  } = useSinglesGame(sessionId);

  const handleExit = () => {
    sound.playPop();
    router.push('/singles/lobby');
  };

  const handleGenerateStoryCard = () => {
    sound.playMatch();
    const token = Math.random().toString(36).substring(2, 10);
    router.push(`/story/${token}?mode=singles&score=450&superlative=Certified%20Green%20Flag%20Magnet`);
  };

  const dummyScores = [
    {
      playerId: currentSession?.id || 'p1',
      nickname: currentSession?.nickname || 'You',
      avatar: currentSession?.avatar || '⚡',
      score: 350,
      pointsAdded: 150,
      badge: 'Main Character',
    },
    {
      playerId: 'p2',
      nickname: 'MidnightRider',
      avatar: '🔥',
      score: 280,
      pointsAdded: 100,
      badge: 'Debate Instigator',
    },
    {
      playerId: 'p3',
      nickname: 'VelvetHeart',
      avatar: '💖',
      score: 240,
      pointsAdded: 80,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Header & Round Indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Game
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-midnight-900 border border-white/15 text-xs font-black text-brand-cyan">
            Round {currentRoundNumber} / {totalRounds}
          </div>
          <div className="px-3 py-1 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-xs font-black text-brand-pink uppercase animate-pulse">
            {phase === 'answering' ? 'Voting Live' : 'Reveal & Banter'}
          </div>
        </div>
      </div>

      {/* Countdown Timer Bar */}
      <TimerBar
        secondsLeft={timerSeconds}
        totalSeconds={totalTimerSeconds}
        className="max-w-md mx-auto"
      />

      {/* Active Game Component */}
      {activeQuestion && (
        <>
          {gameId === 'red_flag_trial' && (
            <RedFlagGameView
              question={activeQuestion}
              phase={phase}
              selectedOption={myAnswer}
              onSelectOption={submitAnswer}
              results={{
                optionCounts,
                totalVotes: 6,
                playerChoices,
              }}
            />
          )}

          {gameId === 'crush_detector' && (
            <CrushDetectorGameView
              question={activeQuestion}
              phase={phase}
              players={players.length > 0 ? players : [
                { id: '1', lobby_id: '', player_id: currentSession?.id || 'p1', nickname: currentSession?.nickname || 'You', avatar: '⚡', interests: ['Funny'], is_ready: true, is_host: true, status: 'active', joined_at: '', last_heartbeat: '' },
                { id: '2', lobby_id: '', player_id: 'p2', nickname: 'NovaStar', avatar: '💖', interests: ['Romantic', 'Music'], is_ready: true, is_host: false, status: 'active', joined_at: '', last_heartbeat: '' },
                { id: '3', lobby_id: '', player_id: 'p3', nickname: 'CyberRebel', avatar: '🔥', interests: ['Adventurous'], is_ready: true, is_host: false, status: 'active', joined_at: '', last_heartbeat: '' },
                { id: '4', lobby_id: '', player_id: 'p4', nickname: 'VelvetFox', avatar: '🦊', interests: ['Gamer', 'Flirty'], is_ready: true, is_host: false, status: 'active', joined_at: '', last_heartbeat: '' },
              ]}
              currentPlayerId={currentSession?.id || 'p1'}
              selectedPlayerId={selectedCrushTarget}
              onSelectPlayer={submitCrushPick}
              matches={detectedMatches}
              popularPlayerId="p2"
            />
          )}

          {gameId === 'blind_confession' && (
            <BlindConfessionGameView
              question={activeQuestion}
              phase={phase}
              currentPlayerId={currentSession?.id || 'p1'}
              submittedAnswer={myAnswer}
              onSubmitAnswer={submitAnswer}
              confessions={confessionsList}
              onVote={() => sound.playPop()}
            />
          )}
        </>
      )}

      {/* Round & Game Standings Modal */}
      <RoundResultsModal
        isOpen={isResultsModalOpen}
        roundNumber={currentRoundNumber}
        totalRounds={totalRounds}
        scores={dummyScores}
        onNextRound={nextRound}
        onViewStoryCard={handleGenerateStoryCard}
        isHost={true}
        surpriseEvent={currentRoundNumber === 2 ? 'Double Score Frenzy 🔥' : null}
      />

      {/* Floating Reaction Bar */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <ReactionOverlay
          sessionId={sessionId}
          currentPlayerId={currentSession?.id}
          currentPlayerName={currentSession?.nickname}
          showBar={true}
        />
      </div>
    </div>
  );
}
