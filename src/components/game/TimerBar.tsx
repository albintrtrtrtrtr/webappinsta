'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { sound } from '@/lib/sound';

interface TimerBarProps {
  secondsLeft: number;
  totalSeconds: number;
  className?: string;
}

export function TimerBar({ secondsLeft, totalSeconds, className }: TimerBarProps) {
  const percentage = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  useEffect(() => {
    if (secondsLeft <= 5 && secondsLeft > 0) {
      sound.playTick();
    }
  }, [secondsLeft]);

  const getColor = () => {
    if (percentage > 50) return 'from-emerald-400 to-brand-cyan';
    if (percentage > 20) return 'from-amber-400 to-brand-pink';
    return 'from-rose-500 to-red-600 animate-pulse';
  };

  return (
    <div className={`w-full space-y-1.5 select-none ${className}`}>
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5 text-white/70">
          <Clock className={`w-3.5 h-3.5 ${secondsLeft <= 5 ? 'text-rose-400 animate-ping' : 'text-brand-cyan'}`} />
          <span>Timer</span>
        </span>
        <span className={`font-mono text-sm ${secondsLeft <= 5 ? 'text-rose-400 font-extrabold animate-bounce' : 'text-white'}`}>
          0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
        </span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-midnight-950/80 border border-white/10 overflow-hidden p-0.5">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-300 shadow-md`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
