'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Heart, Trophy, Share2, Home } from 'lucide-react';
import { sound } from '@/lib/sound';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/singles/lobby', label: 'Singles', icon: Flame, badge: 'Live' },
    { href: '/couples', label: 'Couples', icon: Heart },
    { href: '/leaderboard', label: 'Ranks', icon: Trophy },
    { href: '/story/preview', label: 'Stories', icon: Share2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-midnight-950/90 backdrop-blur-xl border-t border-white/10 px-2 py-2 sm:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sound.playPop()}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-brand-pink font-bold'
                  : 'text-white/60 hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 text-[8px] bg-brand-pink text-white font-black px-1 rounded-full uppercase leading-tight animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-brand-pink mt-0.5 shadow-[0_0_6px_#ff2e93]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
