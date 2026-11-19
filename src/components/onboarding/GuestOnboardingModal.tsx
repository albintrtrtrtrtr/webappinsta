'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import {
  INTEREST_TAGS,
  AVATAR_OPTIONS,
  saveGuestSession,
  getGuestSession,
  generateGuestId,
} from '@/lib/session';
import { GuestSession } from '@/lib/supabase/types';
import { Sparkles, ShieldCheck, Heart, User, Check, Flame } from 'lucide-react';
import { sound } from '@/lib/sound';

interface GuestOnboardingModalProps {
  isOpen: boolean;
  onComplete: (session: GuestSession) => void;
  onClose?: () => void;
}

const RANDOM_NICKNAMES = [
  'NeonRebel', 'MidnightVibe', 'CyberCrush', 'SpicySoul',
  'WildCard', 'VelvetMoon', 'PixelHeart', 'GlowGetter',
  'NovaRider', 'ElectricDream', 'StarGazer', 'ChaosQueen'
];

export function GuestOnboardingModal({
  isOpen,
  onComplete,
  onClose,
}: GuestOnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚡');
  const [gender, setGender] = useState<string>('prefer_not_to_say');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Funny', 'Flirty']);
  const [matchPreference, setMatchPreference] = useState('everyone');
  const [isAdultVerified, setIsAdultVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const existing = getGuestSession();
    if (existing) {
      setNickname(existing.nickname);
      setSelectedAvatar(existing.avatar || '⚡');
      setGender(existing.gender || 'prefer_not_to_say');
      setSelectedInterests(existing.interests || ['Funny']);
      setMatchPreference(existing.match_preference || 'everyone');
    } else {
      // Pick random nickname placeholder
      const randomNick = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
      setNickname(randomNick);
    }
  }, [isOpen]);

  const toggleInterest = (tag: string) => {
    sound.playPop();
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNext = () => {
    if (!nickname.trim()) {
      setErrorMsg('Please enter a nickname');
      return;
    }
    setErrorMsg('');
    sound.playSuccess();
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };

  const handleFinish = () => {
    if (!nickname.trim()) {
      setStep(1);
      setErrorMsg('Please choose a nickname');
      return;
    }
    if (!isAdultVerified) {
      setErrorMsg('You must confirm you are 18+ to access social & dating features');
      return;
    }

    const existing = getGuestSession();
    const sessionId = existing?.id || generateGuestId();

    const newSession: GuestSession = {
      id: sessionId,
      nickname: nickname.trim(),
      avatar: selectedAvatar,
      gender: gender === 'prefer_not_to_say' ? null : gender,
      interests: selectedInterests,
      match_preference: matchPreference,
      last_active_at: new Date().toISOString(),
    };

    saveGuestSession(newSession);
    sound.playMatch();
    onComplete(newSession);
  };

  const randomizeName = () => {
    sound.playPop();
    const randomNick = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(randomNick);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md"
      >
        <GlassCard variant="glow" className="p-6 border-brand-purple/40 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-pink to-brand-violet shadow-lg mb-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-white via-pink-200 to-brand-cyan bg-clip-text text-transparent">
              {step === 1 && 'Create Your Persona'}
              {step === 2 && 'Your Vibe & Interests'}
              {step === 3 && 'Dating & Safety Check'}
            </h2>
            <p className="text-xs text-white/60 mt-1">
              Step {step} of 3 • Join in seconds, no password needed
            </p>
          </div>

          {/* Step 1: Nickname & Avatar */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white/80">Nickname</label>
                  <button
                    type="button"
                    onClick={randomizeName}
                    className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Randomize
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={18}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter your game name..."
                    className="w-full px-4 py-3 rounded-xl bg-midnight-950/70 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink font-semibold"
                  />
                  <div className="absolute right-3 top-3 text-lg">{selectedAvatar}</div>
                </div>
                {errorMsg && <p className="text-xs text-rose-400 mt-1 font-medium">{errorMsg}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-2">
                  Choose Avatar Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setSelectedAvatar(av);
                      }}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                        selectedAvatar === av
                          ? 'bg-brand-pink/30 border-2 border-brand-pink shadow-[0_0_12px_rgba(255,46,147,0.5)] scale-105'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-2">Gender</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {['Female', 'Male', 'Non-binary', 'Skip'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setGender(g.toLowerCase());
                      }}
                      className={`py-2 rounded-lg font-medium border transition-all ${
                        gender.toLowerCase() === g.toLowerCase() ||
                        (g === 'Skip' && gender === 'prefer_not_to_say')
                          ? 'bg-brand-violet text-white border-brand-violet shadow-[0_0_10px_rgba(124,58,237,0.4)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <NeonButton fullWidth variant="pink" onClick={handleNext}>
                  Next: Vibe & Interests →
                </NeonButton>
              </div>
            </motion.div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Pick your traits (Select 2 or more)
                </label>
                <p className="text-[11px] text-white/50 mb-3">
                  Helps our matchmaking engine find compatible singles and fun opponents!
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TAGS.map((tag) => {
                    const isSelected = selectedInterests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`text-xs px-3 py-2 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand-pink to-brand-violet text-white border-brand-pink/60 shadow-[0_0_12px_rgba(255,46,147,0.4)]'
                            : 'bg-midnight-950/60 text-white/70 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <NeonButton
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3"
                >
                  ← Back
                </NeonButton>
                <NeonButton
                  variant="pink"
                  onClick={handleNext}
                  className="w-2/3"
                >
                  Next: Match Mode →
                </NeonButton>
              </div>
            </motion.div>
          )}

          {/* Step 3: Matchmaking Mode & Adult Consent */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-2">
                  Preferred Matchmaking Arena
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'singles',
                      title: '🔥 Singles Matchmaking',
                      desc: 'Meet new people, play spicy flirt party games & reveal mutual crushes',
                    },
                    {
                      id: 'couples',
                      title: '💖 Couples Battle Arena',
                      desc: 'Play with your partner in telepathy challenges & couple vs singles battles',
                    },
                    {
                      id: 'everyone',
                      title: '✨ Open to Everything',
                      desc: 'All party lobbies, chaotic challenges and leaderboards',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        sound.playPop();
                        setMatchPreference(item.id);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        matchPreference === item.id
                          ? 'bg-brand-violet/25 border-brand-violet shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                          : 'bg-midnight-950/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-sm text-white">{item.title}</div>
                      <div className="text-[11px] text-white/60 mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Verification Required for Dating Features */}
              <div className="p-3 rounded-xl bg-midnight-950/60 border border-brand-pink/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="adultConsent"
                  checked={isAdultVerified}
                  onChange={(e) => setIsAdultVerified(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-brand-pink focus:ring-brand-pink accent-brand-pink"
                />
                <label htmlFor="adultConsent" className="text-xs text-white/80 leading-relaxed cursor-pointer">
                  <span className="font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" /> I am 18+ years of age
                  </span>
                  I agree to community safety guidelines for dating, party matchmaking and consent-based reveals.
                </label>
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>}

              <div className="flex gap-2 pt-2">
                <NeonButton
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="w-1/3"
                >
                  ← Back
                </NeonButton>
                <NeonButton
                  variant="pink"
                  onClick={handleFinish}
                  className="w-2/3"
                >
                  Enter Platform 🚀
                </NeonButton>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
