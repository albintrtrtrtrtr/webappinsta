'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InstagramStoryCard } from '@/components/story/InstagramStoryCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowLeft, Sparkles, Share2 } from 'lucide-react';
import { getGuestSession } from '@/lib/session';

export default function StoryPreviewPage() {
  const router = useRouter();
  const session = getGuestSession();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <span className="text-xs font-bold text-brand-pink flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Story Showcase
        </span>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Your Instagram Story Cards</h1>
        <p className="text-xs text-white/60">
          Share your game results, compatibility scores, and chaos awards directly to your story!
        </p>
      </div>

      <InstagramStoryCard
        template="compatibility_report"
        playerName={session?.nickname || 'GuestViber'}
        playerAvatar={session?.avatar || '⚡'}
        partnerName="Alex"
        score={880}
        superlative="Certified Green Flag Magnet"
      />
    </div>
  );
}
