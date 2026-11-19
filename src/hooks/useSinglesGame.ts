'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  GameSession,
  GameRound,
  GameQuestion,
  LobbyPlayer,
  RoundPhase,
  GuestSession,
} from '@/lib/supabase/types';
import { getGuestSession } from '@/lib/session';
import { sound } from '@/lib/sound';

const FALLBACK_QUESTIONS: Record<string, GameQuestion[]> = {
  red_flag_trial: [
    {
      id: 'q_rf_1',
      game_id: 'red_flag_trial',
      category: 'Dating',
      prompt: 'They still follow and regularly like their ex\'s gym selfies.',
      scenario_details: 'Claiming "we are cordial friends and mature adults".',
      options: ['Red Flag 🚩', 'Green Flag 🟢', 'Depends 🤔'],
      suggested_timer_sec: 25,
      intensity_level: 2,
      author: 'Platform',
    },
    {
      id: 'q_rf_2',
      game_id: 'red_flag_trial',
      category: 'Lifestyle',
      prompt: 'On date three, they ask to scroll through your camera roll "just for fun".',
      scenario_details: 'Insisting they just love looking at vacation pictures.',
      options: ['Red Flag 🚩', 'Green Flag 🟢', 'Depends 🤔'],
      suggested_timer_sec: 25,
      intensity_level: 3,
      author: 'Platform',
    },
    {
      id: 'q_rf_3',
      game_id: 'red_flag_trial',
      category: 'Finance',
      prompt: 'Suggests splitting a $14 boba tea bill down to the exact penny.',
      scenario_details: 'Takes out calculator to split the 10% tax evenly.',
      options: ['Red Flag 🚩', 'Green Flag 🟢', 'Depends 🤔'],
      suggested_timer_sec: 25,
      intensity_level: 1,
      author: 'Platform',
    },
  ],
  crush_detector: [
    {
      id: 'q_cd_1',
      game_id: 'crush_detector',
      category: 'First Impressions',
      prompt: 'Who gave off the strongest "main character" energy the moment they joined?',
      scenario_details: 'Select secretly from active lobby players.',
      options: [],
      suggested_timer_sec: 30,
      intensity_level: 1,
      author: 'Platform',
    },
    {
      id: 'q_cd_2',
      game_id: 'crush_detector',
      category: 'Romance',
      prompt: 'Who would you definitely say YES to if they slid into your DMs tonight?',
      scenario_details: 'Mutual matches will be revealed with consent!',
      options: [],
      suggested_timer_sec: 30,
      intensity_level: 3,
      author: 'Platform',
    },
    {
      id: 'q_cd_3',
      game_id: 'crush_detector',
      category: 'Adventure',
      prompt: 'If you had to plan an impromptu weekend road trip, who is your co-pilot?',
      scenario_details: 'Pick your ride-or-die.',
      options: [],
      suggested_timer_sec: 30,
      intensity_level: 2,
      author: 'Platform',
    },
  ],
  blind_confession: [
    {
      id: 'q_bc_1',
      game_id: 'blind_confession',
      category: 'Dating Fails',
      prompt: 'What is the most ridiculous lie you told to escape a terrible date?',
      scenario_details: 'All submissions are 100% anonymous during voting!',
      options: [],
      suggested_timer_sec: 40,
      intensity_level: 2,
      author: 'Platform',
    },
    {
      id: 'q_bc_2',
      game_id: 'blind_confession',
      category: 'Guilty Pleasures',
      prompt: 'What is your most embarrassing guilty pleasure you would never post on Instagram?',
      scenario_details: 'The more honest, the more votes you will get.',
      options: [],
      suggested_timer_sec: 40,
      intensity_level: 2,
      author: 'Platform',
    },
    {
      id: 'q_bc_3',
      game_id: 'blind_confession',
      category: 'Pet Peeves',
      prompt: 'What is the absolute pettiest reason you immediately lost romantic interest in someone?',
      scenario_details: 'No judgment zone!',
      options: [],
      suggested_timer_sec: 40,
      intensity_level: 1,
      author: 'Platform',
    },
  ],
};

export function useSinglesGame(sessionId: string) {
  const [currentSession, setCurrentSession] = useState<GuestSession | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameId, setGameId] = useState<string>('red_flag_trial');
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [phase, setPhase] = useState<RoundPhase>('answering');
  const [timerSeconds, setTimerSeconds] = useState<number>(25);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState<number>(25);
  const [activeQuestion, setActiveQuestion] = useState<GameQuestion | null>(null);

  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [selectedCrushTarget, setSelectedCrushTarget] = useState<string | null>(null);

  // Results & Scoring state
  const [roundScores, setRoundScores] = useState<Record<string, number>>({});
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  // Red Flag votes summary
  const [optionCounts, setOptionCounts] = useState<Record<string, number>>({});
  const [playerChoices, setPlayerChoices] = useState<
    Array<{ playerId: string; nickname: string; avatar: string; option: string }>
  >([]);

  // Crush matches
  const [detectedMatches, setDetectedMatches] = useState<
    Array<{ playerAId: string; playerBId: string; playerAName: string; playerBName: string }>
  >([]);

  // Confessions list
  const [confessionsList, setConfessionsList] = useState<any[]>([]);

  // Initialize
  useEffect(() => {
    const session = getGuestSession();
    setCurrentSession(session);

    async function loadGame() {
      try {
        const { data: dbSession } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        const activeGameId = dbSession?.game_id || 'red_flag_trial';
        setGameId(activeGameId);
        setGameSession(dbSession);

        // Fetch question
        const fallbackList = FALLBACK_QUESTIONS[activeGameId] || FALLBACK_QUESTIONS.red_flag_trial;
        setActiveQuestion(fallbackList[0]);
        setTimerSeconds(fallbackList[0].suggested_timer_sec);
        setTotalTimerSeconds(fallbackList[0].suggested_timer_sec);

        // Fetch lobby players if attached
        if (dbSession?.lobby_id) {
          const { data: lobbyPlayers } = await supabase
            .from('lobby_players')
            .select('*')
            .eq('lobby_id', dbSession.lobby_id);
          if (lobbyPlayers && lobbyPlayers.length > 0) {
            setPlayers(lobbyPlayers);
          }
        }
      } catch {
        // Local fallback
        const fallbackList = FALLBACK_QUESTIONS.red_flag_trial;
        setActiveQuestion(fallbackList[0]);
      }
    }

    loadGame();
  }, [sessionId]);

  // Timer countdown hook
  useEffect(() => {
    if (phase !== 'answering') return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Transition to reveal phase
          handlePhaseTransitionToReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Transition from answering to reveal
  const handlePhaseTransitionToReveal = useCallback(() => {
    setPhase('reveal');
    sound.playMatch();

    // Populate simulated room results if single tester
    if (gameId === 'red_flag_trial') {
      const counts = {
        'Red Flag 🚩': 3,
        'Green Flag 🟢': 1,
        'Depends 🤔': 2,
      };
      setOptionCounts(counts);
    } else if (gameId === 'crush_detector') {
      // Simulate exciting spark
      if (players.length > 1) {
        setDetectedMatches([
          {
            playerAId: currentSession?.id || 'p1',
            playerBId: players[1]?.player_id || 'p2',
            playerAName: currentSession?.nickname || 'You',
            playerBName: players[1]?.nickname || 'Alex',
          },
        ]);
      }
    } else if (gameId === 'blind_confession') {
      setConfessionsList([
        {
          id: 'c1',
          playerId: currentSession?.id || 'p1',
          authorNickname: currentSession?.nickname || 'You',
          authorAvatar: currentSession?.avatar || '⚡',
          text: myAnswer || 'I pretended my fire alarm was going off so I could leave date #1!',
          votes: { funniest: 4, relatable: 2, unexpected: 1 },
        },
        {
          id: 'c2',
          playerId: 'p2',
          authorNickname: 'NeonGhost',
          authorAvatar: '🦊',
          text: 'I ordered three desserts to-go and told my date it was for my sick roommate.',
          votes: { funniest: 2, relatable: 5, unexpected: 0 },
        },
      ]);
    }

    // After 8 seconds of reveal & discussion, show round results modal
    setTimeout(() => {
      setIsResultsModalOpen(true);
    }, 8000);
  }, [gameId, myAnswer, players, currentSession]);

  // Answer handler
  const submitAnswer = async (answerPayload: string) => {
    setMyAnswer(answerPayload);
    sound.playPop();

    if (currentSession) {
      await supabase.from('game_answers').upsert({
        session_id: sessionId,
        player_id: currentSession.id,
        round_id: sessionId,
        answer_text: answerPayload,
        selected_option: answerPayload,
        is_bluff: false,
        is_anonymous: gameId === 'blind_confession',
      });
    }
  };

  // Crush Pick handler
  const submitCrushPick = async (targetId: string) => {
    setSelectedCrushTarget(targetId);
    sound.playPop();

    if (currentSession) {
      await supabase.from('game_answers').upsert({
        session_id: sessionId,
        player_id: currentSession.id,
        round_id: sessionId,
        target_player_id: targetId,
        is_bluff: false,
        is_anonymous: true,
      });
    }
  };

  // Proceed to next round
  const nextRound = () => {
    setIsResultsModalOpen(false);
    const nextR = currentRoundNumber + 1;
    setCurrentRoundNumber(nextR);
    setPhase('answering');
    setMyAnswer(null);
    setSelectedCrushTarget(null);

    const questions = FALLBACK_QUESTIONS[gameId] || FALLBACK_QUESTIONS.red_flag_trial;
    const nextQ = questions[(nextR - 1) % questions.length];
    setActiveQuestion(nextQ);
    setTimerSeconds(nextQ.suggested_timer_sec);
    setTotalTimerSeconds(nextQ.suggested_timer_sec);
  };

  return {
    gameSession,
    gameId,
    activeQuestion,
    currentRoundNumber,
    totalRounds: 3,
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
  };
}
