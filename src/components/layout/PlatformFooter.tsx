'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Heart, Trophy, Share2, Shield, Sparkles, ExternalLink } from 'lucide-react';
import { sound } from '@/lib/sound';

export function PlatformFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-midnight-950/80 backdrop-blur-xl mt-12 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link
              href="/"
              onClick={() => sound.playPop()}
              className="flex items-center gap-2 select-none group inline-flex"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-pink via-purple-600 to-brand-cyan flex items-center justify-center shadow-[0_0_15px_rgba(255,46,147,0.5)] group-hover:scale-105 transition-transform">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-pink-200 to-brand-cyan bg-clip-text text-transparent">
                    InstaGame
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-brand-pink/20 text-brand-pink border border-brand-pink/30">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-white/50 tracking-wider">Party & Dating Arena</p>
              </div>
            </Link>

            <p className="text-xs text-white/70 max-w-sm leading-relaxed">
              Real-time multiplayer social gaming combining Jackbox party chaos, Hinge-style mutual discovery, and viral Instagram story export cards.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Realtime Active</span>
              </div>
              <span className="text-xs text-white/40">• 18+ Social Gaming</span>
            </div>
          </div>

          {/* Quick Play Column */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-brand-cyan uppercase tracking-wider">
              Game Modes
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70 font-medium">
              <li>
                <Link
                  href="/singles/lobby"
                  onClick={() => sound.playPop()}
                  className="hover:text-brand-pink transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-brand-pink" /> Singles Lounge
                </Link>
              </li>
              <li>
                <Link
                  href="/couples"
                  onClick={() => sound.playPop()}
                  className="hover:text-brand-violet transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-brand-violet" /> Couples Arena
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  onClick={() => sound.playPop()}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Hall of Fame
                </Link>
              </li>
              <li>
                <Link
                  href="/story/preview"
                  onClick={() => sound.playPop()}
                  className="hover:text-brand-cyan transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-cyan" /> Story Card Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Moderation Column */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-brand-pink uppercase tracking-wider">
              Safety & Trust
            </h4>
            <ul className="space-y-1.5 text-xs text-white/70 font-medium">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Mutual Consent Matches
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Encrypted Answer Masking
              </li>
              <li>
                <Link
                  href="/admin"
                  onClick={() => sound.playPop()}
                  className="hover:text-white transition-colors flex items-center gap-1 text-white/50"
                >
                  Moderator Portal <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} InstaGame Live. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Community Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
