import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glow' | 'pink' | 'cyan' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  variant = 'default',
  children,
  className,
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: 'bg-midnight-900/70 border-white/10 hover:border-white/20',
    glow: 'bg-midnight-900/80 border-brand-purple/40 shadow-[0_0_25px_rgba(147,51,234,0.18)] hover:border-brand-purple/70',
    pink: 'bg-midnight-900/80 border-brand-pink/40 shadow-[0_0_25px_rgba(255,46,147,0.18)] hover:border-brand-pink/70',
    cyan: 'bg-midnight-900/80 border-brand-cyan/40 shadow-[0_0_25px_rgba(0,242,254,0.18)] hover:border-brand-cyan/70',
    purple: 'bg-midnight-900/80 border-brand-violet/40 shadow-[0_0_25px_rgba(124,58,237,0.18)] hover:border-brand-violet/70',
  };

  return (
    <motion.div
      className={cn(
        'backdrop-blur-xl border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
