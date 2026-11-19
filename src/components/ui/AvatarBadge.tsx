import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AvatarBadgeProps {
  avatar: string;
  nickname?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isHost?: boolean;
  isReady?: boolean;
  score?: number;
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AvatarBadge({
  avatar,
  nickname,
  size = 'md',
  isHost = false,
  isReady,
  score,
  highlight = false,
  className,
  onClick,
}: AvatarBadgeProps) {
  const sizeStyles = {
    sm: 'w-9 h-9 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 select-none cursor-pointer group',
        className
      )}
    >
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'rounded-2xl flex items-center justify-center bg-gradient-to-br from-midnight-700 to-midnight-900 border transition-all duration-300 relative shadow-lg',
            sizeStyles[size],
            highlight
              ? 'border-brand-pink ring-2 ring-brand-pink/50 shadow-[0_0_15px_rgba(255,46,147,0.5)]'
              : 'border-white/15 group-hover:border-brand-purple/60 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
          )}
        >
          <span>{avatar}</span>
        </motion.div>

        {isHost && (
          <span
            title="Host"
            className="absolute -top-1 -right-1 text-xs bg-amber-500 text-black font-extrabold rounded-full px-1 shadow-sm leading-tight"
          >
            👑
          </span>
        )}

        {isReady !== undefined && (
          <span
            className={cn(
              'absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-midnight-950',
              isReady ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'
            )}
          />
        )}
      </div>

      {nickname && (
        <span className="text-xs font-semibold text-white/90 truncate max-w-[80px] text-center">
          {nickname}
        </span>
      )}

      {score !== undefined && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-violet/30 border border-brand-violet/40 text-brand-cyan">
          {score} pts
        </span>
      )}
    </div>
  );
}
