import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { sound } from '@/lib/sound';

interface NeonButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'pink' | 'purple' | 'cyan' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function NeonButton({
  variant = 'pink',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  children,
  className,
  onClick,
  disabled,
  ...props
}: NeonButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wide rounded-xl select-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const variantStyles = {
    pink: 'bg-gradient-to-r from-brand-pink via-rose-500 to-brand-violet text-white shadow-[0_0_20px_rgba(255,46,147,0.4)] hover:shadow-[0_0_28px_rgba(255,46,147,0.65)] hover:brightness-110 border border-brand-pink/50',
    purple: 'bg-gradient-to-r from-brand-violet via-purple-600 to-brand-pink text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_28px_rgba(124,58,237,0.65)] hover:brightness-110 border border-brand-violet/50',
    cyan: 'bg-gradient-to-r from-brand-cyan to-blue-600 text-midnight-950 shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:shadow-[0_0_28px_rgba(0,242,254,0.7)] font-extrabold border border-brand-cyan/60',
    outline: 'border border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md hover:border-white/40',
    glass: 'bg-midnight-800/80 border border-white/10 text-white hover:bg-midnight-700/80 backdrop-blur-lg hover:border-brand-purple/50',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.playPop();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
