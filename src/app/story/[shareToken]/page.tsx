'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { InstagramStoryCard, StoryTemplateType } from '@/components/story/InstagramStoryCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ArrowLeft, Sparkles, Trophy, Flame, Heart, Share2 } from 'lucide-react';
import { getGuestSession } from '@/lib/session';
import { sound } from '@/lib/sound';

function StoryCardPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const shareToken = (params?.shareToken as string) || 'token_1';
  const modeParam = searchParams.get('mode') || 'singles';
  const scoreParam = parseInt(searchParams.get('score') || '450', 10);
  const superlativeParam = searchParams.get('superlative') || 'Certified Green Flag Magnet';
  const partnerParam = searchParams.get('partner') || 'Alex';

  const session = getGuestSession();

  const [activeTemplate, setActiveTemplate] = useState<StoryTemplateType>(
    modeParam === 'couples' ? 'couple_report' : 'compatibility_report'
  );

  const TEMPLATES: Array<{ id: StoryTemplateType; name: string; icon: string }> = [
    { id: 'compatibility_report', name: 'Compatibility Report', icon: '💘' },
    { id: 'chaos_award', name: 'Chaos Award', icon: '🔥' },
    { id: 'couple_report', name: 'Couple Telepathy', icon: '💍' },
    { id: 'leaderboard_legend', name: 'Leaderboard Legend', icon: '🏆' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <span className="text-xs text-brand-pink font-bold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> 1080 × 1920 HD Story Card
        </span>
      </div>

      {/* Template Selector Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-midnight-950/80 border border-white/10 max-w-lg mx-auto">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => {
              sound.playPop();
              setActiveTemplate(tmpl.id);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTemplate === tmpl.id
                ? 'bg-gradient-to-r from-brand-pink to-brand-violet text-white shadow-[0_0_12px_rgba(255,46,147,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tmpl.icon}</span>
            <span>{tmpl.name}</span>
          </button>
        ))}
      </div>

      {/* Main Story Card Preview & Export Component */}
      <InstagramStoryCard
        template={activeTemplate}
        playerName={session?.nickname || 'Viber'}
        playerAvatar={session?.avatar || '⚡'}
        partnerName={partnerParam}
        partnerAvatar="💖"
        score={scoreParam}
        superlative={superlativeParam}
        referralCode={session?.id || 'play12'}
      />
    </div>
  );
}

export default function StoryCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-white/50 text-sm">
          Loading Story Card...
        </div>
      }
    >
      <StoryCardPageContent />
    </Suspense>
  );
}
