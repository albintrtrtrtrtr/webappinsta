'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Lobby, LobbyPlayer, GuestSession } from '@/lib/supabase/types';
import { getGuestSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

interface UseLobbyReturn {
  lobby: Lobby | null;
  players: LobbyPlayer[];
  currentSession: GuestSession | null;
  isHost: boolean;
  isLoading: boolean;
  countdown: number | null;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  leaveLobby: () => Promise<void>;
}

export function useLobby(preferredGameId?: string): UseLobbyReturn {
  const router = useRouter();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [currentSession, setCurrentSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const lobbyIdRef = useRef<string | null>(null);
  const hasJoinedRef = useRef(false);

  // 1. Initialize or find lobby
  useEffect(() => {
    let isMounted = true;
    const session = getGuestSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    setCurrentSession(session);

    async function initLobby() {
      try {
        setIsLoading(true);
        // Look for waiting lobby
        let query = supabase
          .from('lobbies')
          .select('*')
          .eq('status', 'waiting')
          .lt('current_players_count', 8);

        if (preferredGameId) {
          query = query.eq('game_id', preferredGameId);
        }

        const { data: existingLobbies, error: fetchErr } = await query
          .order('created_at', { ascending: false })
          .limit(1);

        let activeLobby: Lobby;

        if (existingLobbies && existingLobbies.length > 0) {
          activeLobby = existingLobbies[0];
        } else {
          // Create new lobby
          const gameToSet = preferredGameId || 'red_flag_trial';
          const { data: newLobby, error: createErr } = await supabase
            .from('lobbies')
            .insert({
              title: 'Singles Matchmaking Lounge',
              status: 'waiting',
              game_id: gameToSet,
              min_players: 3,
              max_players: 8,
              current_players_count: 1,
              host_id: session?.id,
            })
            .select()
            .single();

          if (createErr || !newLobby) {
            // Fallback mock lobby in local memory if offline/RLS
            activeLobby = {
              id: 'local_lobby_' + Math.random().toString(36).substring(2, 8),
              title: 'Singles Matchmaking Lounge',
              status: 'waiting',
              game_id: gameToSet,
              min_players: 3,
              max_players: 8,
              current_players_count: 1,
              host_id: session?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          } else {
            activeLobby = newLobby;
          }
        }

        if (!isMounted) return;
        setLobby(activeLobby);
        lobbyIdRef.current = activeLobby.id;

        // 2. Add current player to lobby_players
        if (session && !hasJoinedRef.current) {
          hasJoinedRef.current = true;
          await supabase.from('lobby_players').upsert({
            lobby_id: activeLobby.id,
            player_id: session.id,
            nickname: session.nickname,
            avatar: session.avatar || '⚡',
            interests: session.interests || [],
            is_ready: true,
            is_host: activeLobby.host_id === session.id,
            status: 'active',
          });
        }

        // 3. Fetch existing players in this lobby
        const { data: initialPlayers } = await supabase
          .from('lobby_players')
          .select('*')
          .eq('lobby_id', activeLobby.id)
          .eq('status', 'active');

        if (isMounted) {
          if (initialPlayers && initialPlayers.length > 0) {
            setPlayers(initialPlayers);
          } else if (session) {
            // Local fallback player
            setPlayers([
              {
                id: 'lp_1',
                lobby_id: activeLobby.id,
                player_id: session.id,
                nickname: session.nickname,
                avatar: session.avatar || '⚡',
                interests: session.interests || [],
                is_ready: true,
                is_host: true,
                status: 'active',
                joined_at: new Date().toISOString(),
                last_heartbeat: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Error initializing lobby:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initLobby();

    return () => {
      isMounted = false;
    };
  }, [preferredGameId]);

  // 4. Subscribe to Realtime Updates
  useEffect(() => {
    const currentLobbyId = lobbyIdRef.current;
    if (!currentLobbyId) return;

    // Listen to lobby_players changes
    const playersChannel = supabase
      .channel(`lobby_players_${currentLobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${currentLobbyId}`,
        },
        async () => {
          // Re-fetch all active players in this lobby
          const { data } = await supabase
            .from('lobby_players')
            .select('*')
            .eq('lobby_id', currentLobbyId)
            .eq('status', 'active');
          if (data) {
            setPlayers(data);
          }
        }
      )
      .subscribe();

    // Listen to lobbies table updates (e.g. status changes to 'in_game' or metadata)
    const lobbyChannel = supabase
      .channel(`lobby_main_${currentLobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${currentLobbyId}`,
        },
        (payload) => {
          const updated = payload.new as Lobby;
          setLobby(updated);
          if (updated.status === 'in_game' && updated.metadata?.session_id) {
            sound.playMatch();
            router.push(`/singles/game/${updated.metadata.session_id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(lobbyChannel);
    };
  }, [router]);

  // Toggle ready state
  const toggleReady = async () => {
    if (!lobby || !currentSession) return;
    sound.playPop();
    const myPlayer = players.find((p) => p.player_id === currentSession.id);
    const newReady = !myPlayer?.is_ready;

    setPlayers((prev) =>
      prev.map((p) =>
        p.player_id === currentSession.id ? { ...p, is_ready: newReady } : p
      )
    );

    await supabase
      .from('lobby_players')
      .update({ is_ready: newReady })
      .eq('lobby_id', lobby.id)
      .eq('player_id', currentSession.id);
  };

  // Host starts the game
  const startGame = async () => {
    if (!lobby || !currentSession) return;
    sound.playSuccess();

    try {
      // 1. Create a live game session
      const { data: sessionData, error: sessionErr } = await supabase
        .from('game_sessions')
        .insert({
          lobby_id: lobby.id,
          game_id: lobby.game_id || 'red_flag_trial',
          mode: 'singles',
          status: 'in_progress',
          total_rounds: 3,
          current_round: 1,
        })
        .select()
        .single();

      const sessionId = sessionData?.id || `session_${Math.random().toString(36).substring(2, 9)}`;

      // 2. Update lobby status so all connected players are redirected
      await supabase
        .from('lobbies')
        .update({
          status: 'in_game',
          metadata: { session_id: sessionId },
          updated_at: new Date().toISOString(),
        })
        .eq('id', lobby.id);

      router.push(`/singles/game/${sessionId}`);
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  // Leave lobby
  const leaveLobby = async () => {
    if (lobby && currentSession) {
      sound.playPop();
      await supabase
        .from('lobby_players')
        .delete()
        .eq('lobby_id', lobby.id)
        .eq('player_id', currentSession.id);
    }
    router.push('/');
  };

  const isHost = lobby?.host_id === currentSession?.id || players[0]?.player_id === currentSession?.id;

  return {
    lobby,
    players,
    currentSession,
    isHost,
    isLoading,
    countdown,
    toggleReady,
    startGame,
    leaveLobby,
  };
}
