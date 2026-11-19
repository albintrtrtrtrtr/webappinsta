'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { NeonButton } from '@/components/ui/NeonButton';
import { Share2, Download, Sparkles, Heart, Trophy, Flame, Check } from 'lucide-react';
import { sound } from '@/lib/sound';

export type StoryTemplateType =
  | 'compatibility_report'
  | 'chaos_award'
  | 'couple_report'
  | 'leaderboard_legend';

interface StoryCardProps {
  template: StoryTemplateType;
  playerName: string;
  playerAvatar: string;
  partnerName?: string;
  partnerAvatar?: string;
  score: number;
  superlative: string;
  referralCode?: string;
}

export function InstagramStoryCard({
  template,
  playerName,
  playerAvatar,
  partnerName = 'Alex',
  partnerAvatar = '💖',
  score,
  superlative,
  referralCode = 'vibe77',
}: StoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    sound.playPop();

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });

      // Convert dataUrl to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `instagame_story_${template}.png`, { type: 'image/png' });

      // Web Share API with File support
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'My InstaGame Story Card',
          text: `Check out my ${superlative} on InstaGame! Play now:`,
        });
      } else {
        // Fallback standard download
        triggerDownload(dataUrl);
      }
    } catch (err) {
      console.error('Share error:', err);
      // Fallback
      if (cardRef.current) {
        const fallbackUrl = await toPng(cardRef.current);
        triggerDownload(fallbackUrl);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDirectDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    sound.playSuccess();

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      triggerDownload(dataUrl);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `instagame-${template}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto">
      {/* 9:16 Instagram Story Canvas (1080x1920 ratio, scaled for mobile) */}
      <div
        ref={cardRef}
        style={{ width: '360px', height: '640px' }}
        className="relative overflow-hidden rounded-[32px] p-6 flex flex-col justify-between text-white select-none shadow-[0_0_50px_rgba(255,46,147,0.35)] border border-white/20"
      >
        {/* Ambient Gradient Backgrounds based on template */}
        {template === 'compatibility_report' && (
          <div className="absolute inset-0 bg-gradient-to-br from-midnight-950 via-purple-950 to-midnight-900 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-pink/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-cyan/25 rounded-full blur-3xl" />
          </div>
        )}

        {template === 'chaos_award' && (
          <div className="absolute inset-0 bg-gradient-to-br from-midnight-950 via-rose-950 to-midnight-900 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-red-600/25 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-500/25 rounded-full blur-3xl" />
          </div>
        )}

        {template === 'couple_report' && (
          <div className="absolute inset-0 bg-gradient-to-br from-midnight-950 via-violet-950 to-midnight-900 pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-brand-violet/35 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-pink/30 rounded-full blur-3xl" />
          </div>
        )}

        {template === 'leaderboard_legend' && (
          <div className="absolute inset-0 bg-gradient-to-br from-midnight-950 via-blue-950 to-midnight-900 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-amber-400/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-brand-cyan/30 rounded-full blur-3xl" />
          </div>
        )}

        {/* Story Card Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-pink to-brand-cyan flex items-center justify-center text-sm shadow-md">
              ⚡
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block leading-none">
                InstaGame
              </span>
              <span className="text-[9px] text-white/50 tracking-wider uppercase">
                Verified Social Report
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase text-brand-pink tracking-wider">
            Official Drop
          </span>
        </div>

        {/* Center Content Section */}
        <div className="relative z-10 text-center space-y-4 my-auto">
          {/* Avatar Duo or Solo */}
          <div className="flex items-center justify-center -space-x-3">
            <div className="w-20 h-20 rounded-3xl bg-midnight-900 border-2 border-brand-pink flex items-center justify-center text-4xl shadow-2xl relative z-10">
              {playerAvatar}
            </div>
            {(template === 'compatibility_report' || template === 'couple_report') && (
              <div className="w-20 h-20 rounded-3xl bg-midnight-900 border-2 border-brand-violet flex items-center justify-center text-4xl shadow-2xl">
                {partnerAvatar}
              </div>
            )}
          </div>

          {/* Names */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {template === 'compatibility_report' || template === 'couple_report'
                ? `${playerName} & ${partnerName}`
                : playerName}
            </h2>
            <div className="inline-block mt-1 px-3 py-1 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-brand-pink text-xs font-black uppercase tracking-wider">
              {superlative}
            </div>
          </div>

          {/* Big Score Reveal Number */}
          <div className="py-2">
            <span className="text-6xl font-black tracking-tight bg-gradient-to-r from-brand-pink via-purple-200 to-brand-cyan bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,46,147,0.5)]">
              {template === 'compatibility_report' || template === 'couple_report'
                ? '98%'
                : `${score} pts`}
            </span>
            <span className="text-xs text-white/60 block mt-1 uppercase tracking-widest font-bold">
              {template === 'compatibility_report' && 'Flirt & Vibe Match'}
              {template === 'couple_report' && 'Telepathy Mind Meld'}
              {template === 'chaos_award' && 'Social Chaos Index'}
              {template === 'leaderboard_legend' && 'Season 1 Arena Score'}
            </span>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2 px-2 text-left">
            <div className="p-2 rounded-xl bg-midnight-950/70 border border-white/10">
              <span className="text-[9px] text-white/50 uppercase font-bold block">Sparks</span>
              <span className="text-xs font-black text-brand-pink">Ultra High</span>
            </div>
            <div className="p-2 rounded-xl bg-midnight-950/70 border border-white/10">
              <span className="text-[9px] text-white/50 uppercase font-bold block">Status</span>
              <span className="text-xs font-black text-emerald-400">Green Flag</span>
            </div>
            <div className="p-2 rounded-xl bg-midnight-950/70 border border-white/10">
              <span className="text-[9px] text-white/50 uppercase font-bold block">Rank</span>
              <span className="text-xs font-black text-brand-cyan">Top 1%</span>
            </div>
          </div>
        </div>

        {/* Story Card Footer / Call to Action */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-white/50 block font-medium">
              Play with me on InstaGame:
            </span>
            <span className="font-extrabold text-brand-cyan text-xs tracking-wider">
              instagame.app/ref/{referralCode}
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-xs text-brand-pink">
            IG
          </div>
        </div>
      </div>

      {/* Sharing & Download Actions */}
      <div className="w-full flex gap-3">
        <NeonButton
          variant="pink"
          fullWidth
          size="md"
          isLoading={isExporting}
          onClick={handleShare}
          className="font-bold text-sm shadow-xl"
        >
          <Share2 className="w-4 h-4 mr-1.5" /> Share to Instagram Stories
        </NeonButton>

        <NeonButton
          variant="outline"
          size="md"
          isLoading={isExporting}
          onClick={handleDirectDownload}
        >
          {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
        </NeonButton>
      </div>
    </div>
  );
}
