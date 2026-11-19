'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLobby } from '@/hooks/useLobby';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { AvatarBadge } from '@/components/ui/AvatarBadge';
import { ReactionOverlay } from '@/components/ui/ReactionOverlay';
import {
  Users,
  Flame,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Clock,
  Play,
  ShieldCheck,
  Send,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/sound';

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  avatar: string;
}

function SinglesLobbyContent() {
  const searchParams = useSearchParams();
  const gameParam = searchParams.get('game') || 'red_flag_trial';

  const {
    lobby,
    players,
    currentSession,
    isHost,
    isLoading,
    countdown,
    toggleReady,
    startGame,
    leaveLobby,
  } = useLobby(gameParam);

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: '1', sender: 'System', text: 'Welcome to the Singles Lounge! Say hi or test reactions below.', avatar: '⚡' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentSession) return;
    sound.playPop();
    const newMsg: ChatMsg = {
      id: Math.random().toString(),
      sender: currentSession.nickname,
      text: chatInput.trim(),
      avatar: currentSession.avatar || '⚡',
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const getGameTitle = (id?: string | null) => {
    switch (id) {
      case 'crush_detector':
        return '💘 Crush Detector';
      case 'blind_confession':
        return '🤫 The Blind Confession';
      case 'red_flag_trial':
      default:
        return '🚩 The Red Flag Trial';
    }
  };

  const maxSlots = 8;
  const emptySlotsCount = Math.max(0, maxSlots - players.length);
  const myPlayer = players.find((p) => p.player_id === currentSession?.id);
  const canStart = players.length >= 1; // Allows quick testing or waiting for more

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={leaveLobby}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Leave Lounge
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-brand-pink text-xs font-bold shadow-[0_0_12px_rgba(255,46,147,0.3)]">
            <span className="w-2 h-2 rounded-full bg-brand-pink animate-ping" />
            <Flame className="w-3.5 h-3.5 fill-brand-pink" />
            <span>Matchmaking Live</span>
          </div>

          <button
            onClick={() => setShowChat(!showChat)}
            className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition-all sm:hidden"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Room Card */}
      <GlassCard variant="pink" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Singles Party Lounge
              </h1>
            </div>
            <p className="text-xs text-brand-cyan font-bold flex items-center gap-1.5">
              <span>Selected Game:</span>
              <span className="text-white px-2 py-0.5 rounded-full bg-midnight-950/80 border border-brand-cyan/40">
                {getGameTitle(lobby?.game_id)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-white/50 block">Players Joined</span>
              <span className="text-lg font-black text-white">
                {players.length} / {maxSlots}
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-pink to-brand-violet flex items-center justify-center font-black text-white text-lg shadow-lg">
              {players.length}
            </div>
          </div>
        </div>

        {/* Player Roster Grid (4-8 Slots) */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-pink" /> Connected Contenders
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              ● Live Realtime Sync
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {players.map((player) => (
              <motion.div
                key={player.player_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between gap-2 text-center transition-all ${
                  player.player_id === currentSession?.id
                    ? 'bg-brand-pink/15 border-brand-pink shadow-[0_0_15px_rgba(255,46,147,0.3)]'
                    : 'bg-midnight-950/60 border-white/10'
                }`}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-midnight-900 border border-white/20 flex items-center justify-center text-3xl shadow-md">
                    {player.avatar || '⚡'}
                  </div>
                  {player.is_host && (
                    <span className="absolute -top-1 -right-1 text-xs bg-amber-400 text-black font-extrabold rounded-full px-1 shadow">
                      👑
                    </span>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-midnight-950 ${
                      player.is_ready ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'
                    }`}
                  />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-white truncate max-w-[120px]">
                    {player.nickname}
                  </h4>
                  <span className="text-[10px] text-white/50 block">
                    {player.player_id === currentSession?.id ? '(You)' : 'Ready'}
                  </span>
                </div>

                {/* Interest tags */}
                {player.interests && player.interests.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {player.interests.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-brand-cyan border border-brand-cyan/30 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Empty waiting slots */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="p-4 rounded-2xl border border-dashed border-white/10 bg-midnight-950/20 flex flex-col items-center justify-center gap-2 text-center select-none"
              >
                <div className="w-12 h-12 rounded-2xl border border-dashed border-white/15 flex items-center justify-center text-white/20 text-xl">
                  +
                </div>
                <span className="text-xs font-semibold text-white/30">
                  Waiting for player...
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lobby Actions & Controls */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Age-verified 18+ singles • Safe & consent-based reveals</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <NeonButton
              variant="outline"
              size="md"
              onClick={toggleReady}
              className="flex-1 sm:flex-initial"
            >
              {myPlayer?.is_ready ? '✓ You Are Ready' : 'Set Ready'}
            </NeonButton>

            {isHost && (
              <NeonButton
                variant="pink"
                size="md"
                onClick={startGame}
                disabled={!canStart}
                className="flex-1 sm:flex-initial"
              >
                <Play className="w-4 h-4 mr-1.5 fill-white" /> Start Game
              </NeonButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Realtime Waiting Room Chat */}
      <GlassCard variant="default" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-brand-cyan" /> Lounge Chat & Banter
          </span>
          <span className="text-[11px] text-white/40">Say hi while waiting!</span>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-2 mb-3 pr-2">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-xs">
              <span className="text-base select-none">{msg.avatar}</span>
              <div className="bg-white/5 rounded-xl px-3 py-1.5 border border-white/10 max-w-sm">
                <span className="font-bold text-brand-pink mr-1.5">{msg.sender}:</span>
                <span className="text-white/80">{msg.text}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Drop a quick message in the lounge..."
            className="flex-1 px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-pink"
          />
          <NeonButton type="submit" variant="pink" size="sm">
            <Send className="w-3.5 h-3.5" />
          </NeonButton>
        </form>
      </GlassCard>

      {/* Floating Reaction Bar */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <ReactionOverlay
          sessionId={lobby?.id || 'lobby_reactions'}
          currentPlayerId={currentSession?.id}
          currentPlayerName={currentSession?.nickname}
          showBar={true}
        />
      </div>
    </div>
  );
}

export default function SinglesLobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-white/50 text-sm">
          Loading Singles Lounge...
        </div>
      }
    >
      <SinglesLobbyContent />
    </Suspense>
  );
}
