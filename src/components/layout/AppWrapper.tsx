'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { GuestOnboardingModal } from '@/components/onboarding/GuestOnboardingModal';
import { getGuestSession } from '@/lib/session';
import { GuestSession } from '@/lib/supabase/types';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [session, setSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    const existing = getGuestSession();
    if (!existing) {
      // First-time visitor: open frictionless onboarding
      setIsOnboardingOpen(true);
    } else {
      setSession(existing);
    }
  }, []);

  const handleOnboardingComplete = (newSession: GuestSession) => {
    setSession(newSession);
    setIsOnboardingOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-midnight-950 text-white selection:bg-brand-pink selection:text-white">
      <Navbar onOpenProfile={() => setIsOnboardingOpen(true)} />

      <main className="flex-1 pb-24 sm:pb-12">
        {children}
      </main>

      <BottomNav />

      <GuestOnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
