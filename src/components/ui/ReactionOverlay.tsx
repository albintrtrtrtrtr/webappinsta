'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiReaction, PlayerReaction } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { sound } from '@/lib/sound';

export const REACTION_EMOJIS: EmojiReaction[] = ['😂', '❤️', '🔥', '👀', '💀', '😭', '👏'];

interface FloatingReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  xPercent: number;
}

interface ReactionOverlayProps {
  sessionId?: string;
  currentPlayerId?: string;
  currentPlayerName?: string;
  showBar?: boolean;
}

export function ReactionOverlay({
  sessionId,
  currentPlayerId = 'guest',
  currentPlayerName = 'Player',
  showBar = true,
}: ReactionOverlayProps) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReactionItem[]>([]);

  const addReactionToScreen = useCallback((emoji: string, senderName: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Random horizontal position between 15% and 85%
    const xPercent = Math.floor(Math.random() * 70) + 15;

    setFloatingReactions((prev) => [...prev.slice(-15), { id, emoji, senderName, xPercent }]);
    sound.playPop();

    // Clean up after 2.5s
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  }, []);

  // Listen for realtime reactions via Supabase Realtime Broadcast channel
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`reactions_${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'reaction' }, (payload) => {
        if (payload?.payload?.emoji) {
          addReactionToScreen(payload.payload.emoji, payload.payload.senderName || 'Player');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, addReactionToScreen]);

  const sendReaction = async (emoji: EmojiReaction) => {
    // 1. Show immediately locally
    addReactionToScreen(emoji, currentPlayerName);

    // 2. Broadcast to other connected players via Supabase Realtime
    if (sessionId) {
      const channel = supabase.channel(`reactions_${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: {
          emoji,
          senderName: currentPlayerName,
          senderId: currentPlayerId,
        },
      });

      // Also optionally record in table (non-blocking)
      try {
        supabase.from('player_reactions').insert({
          session_id: sessionId,
          player_id: currentPlayerId,
          player_name: currentPlayerName,
          emoji,
        }).then();
      } catch {}
    }
  };

  return (
    <>
      {/* Floating Animated Emojis in screen space */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((item) => (
            <motion.div
              key={item.id}
              initial={{ y: '85vh', opacity: 1, scale: 0.6 }}
              animate={{
                y: '20vh',
                opacity: [1, 1, 0.8, 0],
                scale: [0.6, 1.4, 1.1, 0.7],
                rotate: [0, (Math.random() - 0.5) * 35],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              style={{ left: `${item.xPercent}%` }}
              className="absolute flex flex-col items-center"
            >
              <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,46,147,0.8)] filter">
                {item.emoji}
              </span>
              <span className="text-[10px] font-bold text-white/80 bg-midnight-950/70 px-1.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm mt-0.5">
                {item.senderName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Interactive Bottom Reaction Bar */}
      {showBar && (
        <div className="flex items-center justify-center gap-2 p-2 bg-midnight-950/80 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl max-w-fit mx-auto">
          {REACTION_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.25, y: -3 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => sendReaction(emoji)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/10 active:bg-brand-pink/30 transition-all select-none"
              title={`React ${emoji}`}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      )}
    </>
  );
}
