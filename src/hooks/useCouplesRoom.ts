'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  PrivateRoom,
  RoomPlayer,
  Team,
  GuestSession,
  RoomMode,
} from '@/lib/supabase/types';
import { getGuestSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

export function useCouplesRoom(roomCode: string) {
  const router = useRouter();
  const [room, setRoom] = useState<PrivateRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentSession, setCurrentSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string>('partner_telepathy');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasJoinedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const session = getGuestSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    setCurrentSession(session);

    async function initRoom() {
      try {
        setIsLoading(true);
        const code = roomCode.toUpperCase();
        const playerId = session?.id || 'guest_host';
        const playerNickname = session?.nickname || 'Guest';

        // 1. Fetch room from Supabase
        const { data: existingRoom, error: fetchErr } = await supabase
          .from('private_rooms')
          .select('*')
          .eq('room_code', code)
          .single();

        let activeRoom: PrivateRoom;

        if (existingRoom) {
          activeRoom = existingRoom;
        } else {
          // If not found, create room with this code for testing/hosting
          const { data: newRoom, error: createErr } = await supabase
            .from('private_rooms')
            .insert({
              room_code: code,
              title: 'Couples Battle Room',
              mode: 'couples_vs_couples',
              status: 'waiting',
              host_player_id: playerId,
              game_id: 'partner_telepathy',
            })
            .select()
            .single();

          if (newRoom) {
            activeRoom = newRoom;
          } else {
            // Local fallback
            activeRoom = {
              id: 'local_room_' + code,
              room_code: code,
              title: 'Couples Battle Room',
              mode: 'couples_vs_couples',
              status: 'waiting',
              host_player_id: playerId,
              game_id: 'partner_telepathy',
              max_couples: 4,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        }

        if (!isMounted) return;
        setRoom(activeRoom);
        if (activeRoom.game_id) setSelectedGameId(activeRoom.game_id);

        // 2. Add current player to room_players
        if (!hasJoinedRef.current) {
          hasJoinedRef.current = true;
          await supabase.from('room_players').upsert({
            room_id: activeRoom.id,
            player_id: playerId,
            nickname: playerNickname,
            avatar: session?.avatar || '⚡',
            role: 'partner_1',
            is_host: activeRoom.host_player_id === playerId,
            is_ready: true,
          });
        }

        // 3. Fetch players in room
        const { data: roomPlayers } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', activeRoom.id);

        if (isMounted) {
          if (roomPlayers && roomPlayers.length > 0) {
            setPlayers(roomPlayers);
          } else {
            // Fallback player
            setPlayers([
              {
                id: 'rp_1',
                room_id: activeRoom.id,
                player_id: playerId,
                nickname: playerNickname,
                avatar: session?.avatar || '⚡',
                role: 'partner_1',
                is_host: true,
                is_ready: true,
                joined_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err: any) {
        console.error('Error initializing couples room:', err);
        setErrorMsg(err.message || 'Failed to load room');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initRoom();

    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  // Realtime subscription for room changes
  useEffect(() => {
    if (!room) return;

    const playersChannel = supabase
      .channel(`couples_players_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', room.id);
          if (data) setPlayers(data);
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`couples_room_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'private_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as PrivateRoom;
          setRoom(updated);
          if (updated.status === 'in_game' && (updated as any).session_id) {
            sound.playMatch();
            router.push(`/couples/game/${(updated as any).session_id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [room, router]);

  // Pair with another player as duo
  const pairWithPlayer = async (partnerId: string) => {
    if (!room || !currentSession) return;
    sound.playMatch();

    setPlayers((prev) =>
      prev.map((p) =>
        p.player_id === currentSession.id ? { ...p, partner_player_id: partnerId, role: 'partner_1' } : p
      )
    );

    await supabase
      .from('room_players')
      .update({ partner_player_id: partnerId })
      .eq('room_id', room.id)
      .eq('player_id', currentSession.id);
  };

  // Change room mode
  const updateRoomMode = async (mode: RoomMode) => {
    if (!room) return;
    sound.playPop();
    setRoom({ ...room, mode });

    await supabase
      .from('private_rooms')
      .update({ mode })
      .eq('id', room.id);
  };

  // Start couples game
  const startCouplesGame = async () => {
    if (!room || !currentSession) return;
    sound.playSuccess();

    try {
      const { data: sessionData } = await supabase
        .from('game_sessions')
        .insert({
          room_id: room.id,
          game_id: selectedGameId,
          mode: 'couples',
          status: 'in_progress',
          total_rounds: 3,
          current_round: 1,
        })
        .select()
        .single();

      const sessionId = sessionData?.id || `couples_session_${Math.random().toString(36).substring(2, 9)}`;

      await supabase
        .from('private_rooms')
        .update({
          status: 'in_game',
          game_id: selectedGameId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', room.id);

      router.push(`/couples/game/${sessionId}?roomCode=${room.room_code}&game=${selectedGameId}`);
    } catch (err) {
      console.error('Failed to start couples game:', err);
    }
  };

  const isHost = room?.host_player_id === currentSession?.id || players[0]?.player_id === currentSession?.id;

  return {
    room,
    players,
    teams,
    currentSession,
    isHost,
    isLoading,
    selectedGameId,
    setSelectedGameId,
    errorMsg,
    pairWithPlayer,
    updateRoomMode,
    startCouplesGame,
  };
}
