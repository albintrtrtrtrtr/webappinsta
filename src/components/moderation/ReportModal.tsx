'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ShieldAlert, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { sound } from '@/lib/sound';

interface ReportModalProps {
  isOpen: boolean;
  reportedPlayerId: string;
  reportedPlayerName: string;
  reporterPlayerId: string;
  onClose: () => void;
}

export function ReportModal({
  isOpen,
  reportedPlayerId,
  reportedPlayerName,
  reporterPlayerId,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState('Inappropriate Behavior / Harassment');
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    sound.playPop();

    try {
      // 1. Submit report
      await supabase.from('reports').insert({
        reporter_id: reporterPlayerId,
        reported_player_id: reportedPlayerId,
        reason,
        details: details.trim(),
        status: 'pending',
      });

      // 2. Block user if checked
      if (blockUser) {
        await supabase.from('blocked_users').upsert({
          blocker_id: reporterPlayerId,
          blocked_id: reportedPlayerId,
        });
      }

      setSubmitted(true);
      sound.playSuccess();
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/85 backdrop-blur-xl">
      <div className="w-full max-w-md">
        <GlassCard variant="glow" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Report Player</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/90">
                  Report <span className="font-bold text-brand-pink">{reportedPlayerName}</span>
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  Our moderation team investigates all safety violations promptly.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-white/80 block mb-1.5">
                  Select Reason:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white focus:outline-none focus:border-brand-pink"
                >
                  <option value="Inappropriate Behavior / Harassment">
                    Inappropriate Behavior / Harassment
                  </option>
                  <option value="Hate Speech or Offensive Content">
                    Hate Speech or Offensive Content
                  </option>
                  <option value="Spam / Bot Activity">Spam / Bot Activity</option>
                  <option value="Underage User (Must be 18+)">Underage User (Must be 18+)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-white/80 block mb-1.5">
                  Optional Details:
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide context on what happened..."
                  className="w-full px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-pink"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockUser}
                  onChange={(e) => setBlockUser(e.target.checked)}
                  className="accent-brand-pink rounded w-4 h-4"
                />
                <span>Also block this user from matchmaking with me</span>
              </label>

              <div className="flex gap-2 pt-2">
                <NeonButton variant="outline" size="sm" onClick={onClose} className="w-1/3">
                  Cancel
                </NeonButton>
                <NeonButton
                  type="submit"
                  variant="pink"
                  size="sm"
                  isLoading={loading}
                  className="w-2/3"
                >
                  Submit Report
                </NeonButton>
              </div>
            </form>
          ) : (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-extrabold text-base text-white">Report Received</h4>
              <p className="text-xs text-white/60">
                Thank you for keeping our party community safe and respectful.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
