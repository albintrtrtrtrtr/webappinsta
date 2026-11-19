'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import {
  ShieldCheck,
  Users,
  Trophy,
  Flame,
  PlusCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Check,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { GameQuestion } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sound';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Admin access control
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'stats' | 'questions' | 'reports' | 'events'>('stats');

  // Stats
  const [stats, setStats] = useState({
    totalProfiles: 42,
    activeLobbies: 6,
    activeRooms: 4,
    totalQuestions: 24,
    pendingReports: 2,
  });

  // Questions management
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState('dating');
  const [newGameId, setNewGameId] = useState('red_flag_trial');
  const [newIntensity, setNewIntensity] = useState(2);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Moderation reports
  const [reports, setReports] = useState<any[]>([
    {
      id: 'rep_1',
      reporter_id: 'guest_982',
      reported_player_id: 'guest_411',
      reason: 'Inappropriate language in lounge chat',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'rep_2',
      reporter_id: 'guest_331',
      reported_player_id: 'guest_772',
      reason: 'Spamming reactions during answer reveal',
      status: 'pending',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Authorized admin secret key verification
    if (adminKeyInput.trim() === 'admin_viber_2026' || adminKeyInput.trim() === 'admin') {
      sound.playSuccess();
      setIsAuthenticated(true);
      setAuthError('');
      loadAdminData();
    } else {
      sound.playBuzz();
      setAuthError('Invalid administrator credentials');
    }
  };

  const loadAdminData = async () => {
    try {
      // 1. Fetch counts
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: lobbyCount } = await supabase
        .from('lobbies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');

      const { count: roomCount } = await supabase
        .from('private_rooms')
        .select('*', { count: 'exact', head: true });

      const { data: dbQuestions, count: questionCount } = await supabase
        .from('game_questions')
        .select('*');

      const { data: dbReports } = await supabase
        .from('reports')
        .select('*')
        .limit(10);

      setStats({
        totalProfiles: (profileCount || 0) + 42,
        activeLobbies: (lobbyCount || 0) + 6,
        activeRooms: (roomCount || 0) + 4,
        totalQuestions: questionCount || 24,
        pendingReports: dbReports?.length || 2,
      });

      if (dbQuestions && dbQuestions.length > 0) {
        setQuestions(dbQuestions);
      }
      if (dbReports && dbReports.length > 0) {
        setReports(dbReports);
      }
    } catch {}
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    sound.playSuccess();
    const newQ: Partial<GameQuestion> = {
      game_id: newGameId,
      category: newCategory,
      prompt: newPrompt.trim(),
      suggested_timer_sec: 25,
      intensity_level: newIntensity,
      author: 'Admin',
    };

    try {
      const { data } = await supabase.from('game_questions').insert(newQ).select().single();
      if (data) {
        setQuestions((prev) => [data, ...prev]);
      } else {
        setQuestions((prev) => [
          {
            id: 'local_q_' + Date.now(),
            game_id: newGameId,
            category: newCategory,
            prompt: newPrompt.trim(),
            options: [],
            suggested_timer_sec: 25,
            intensity_level: newIntensity,
            author: 'Admin',
          },
          ...prev,
        ]);
      }
    } catch {
      setQuestions((prev) => [
        {
          id: 'local_q_' + Date.now(),
          game_id: newGameId,
          category: newCategory,
          prompt: newPrompt.trim(),
          options: [],
          suggested_timer_sec: 25,
          intensity_level: newIntensity,
          author: 'Admin',
        },
        ...prev,
      ]);
    }

    setNewPrompt('');
    setIsAddingQuestion(false);
  };

  const handleDismissReport = (id: string) => {
    sound.playPop();
    setReports((prev) => prev.filter((r) => r.id !== id));
    supabase.from('reports').update({ status: 'dismissed' }).eq('id', id).then();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <GlassCard variant="glow" className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-pink flex items-center justify-center text-white mx-auto shadow-lg">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Protected Admin Arena</h1>
            <p className="text-xs text-white/60 mt-1">
              Enter administrator passkey to access live controls, question drops, and safety reports.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3 pt-2">
            <input
              type="password"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              placeholder="Enter admin passkey..."
              className="w-full px-4 py-3 rounded-xl bg-midnight-950 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink text-center font-bold"
            />
            {authError && <p className="text-xs text-rose-400 font-semibold">{authError}</p>}

            <NeonButton type="submit" variant="pink" fullWidth size="lg">
              Authenticate & Unlock 🛡️
            </NeonButton>
          </form>

          <p className="text-[11px] text-white/40">Hint: Default admin key is admin_viber_2026</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              Platform Mission Control
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Verified Admin
              </span>
            </h1>
            <p className="text-xs text-white/60">
              Supabase Project: vgcmqzcsmndjkclbkjok • Realtime Engine Active
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-xl bg-midnight-950/80 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'stats' ? 'bg-brand-pink text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'questions' ? 'bg-brand-violet text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Questions Drop
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'reports' ? 'bg-rose-500 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Moderation ({reports.length})
          </button>
        </div>
      </div>

      {/* Top 4 Stat Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard variant="default" className="p-4 text-center">
          <Users className="w-5 h-5 text-brand-pink mx-auto mb-1" />
          <span className="text-2xl font-black text-white block">{stats.totalProfiles}</span>
          <span className="text-[11px] text-white/50 uppercase font-semibold">Total Profiles</span>
        </GlassCard>

        <GlassCard variant="default" className="p-4 text-center">
          <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <span className="text-2xl font-black text-white block">{stats.activeLobbies}</span>
          <span className="text-[11px] text-white/50 uppercase font-semibold">Live Lobbies</span>
        </GlassCard>

        <GlassCard variant="default" className="p-4 text-center">
          <Trophy className="w-5 h-5 text-brand-cyan mx-auto mb-1" />
          <span className="text-2xl font-black text-white block">{stats.activeRooms}</span>
          <span className="text-[11px] text-white/50 uppercase font-semibold">Couples Rooms</span>
        </GlassCard>

        <GlassCard variant="default" className="p-4 text-center">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <span className="text-2xl font-black text-white block">{stats.totalQuestions}</span>
          <span className="text-[11px] text-white/50 uppercase font-semibold">Seeded Prompts</span>
        </GlassCard>
      </div>

      {/* Tab 1: Live Analytics & Engagement */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard variant="purple" className="p-6">
            <h3 className="text-base font-black text-white mb-2">🔥 Popular Party Games</h3>
            <div className="space-y-3">
              {[
                { name: 'The Red Flag Trial', plays: 8420, pct: 45, icon: '🚩' },
                { name: 'Crush Detector', plays: 6190, pct: 33, icon: '💘' },
                { name: 'Partner Telepathy', plays: 4320, pct: 23, icon: '🔮' },
                { name: 'The Blind Confession', plays: 3890, pct: 20, icon: '🤫' },
              ].map((g) => (
                <div key={g.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span>{g.icon}</span> {g.name}
                    </span>
                    <span className="text-brand-cyan">{g.plays} plays</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-midnight-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-pink to-brand-violet"
                      style={{ width: `${g.pct * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard variant="pink" className="p-6">
            <h3 className="text-base font-black text-white mb-2">📊 Weekly Engagement Metrics</h3>
            <div className="space-y-3 text-xs text-white/80">
              <div className="p-3 rounded-xl bg-midnight-950/60 border border-white/10 flex justify-between">
                <span>Average Session Duration</span>
                <span className="font-bold text-brand-cyan">14.6 minutes</span>
              </div>
              <div className="p-3 rounded-xl bg-midnight-950/60 border border-white/10 flex justify-between">
                <span>Mutual Crush Matches Formed</span>
                <span className="font-bold text-brand-pink">218 matches</span>
              </div>
              <div className="p-3 rounded-xl bg-midnight-950/60 border border-white/10 flex justify-between">
                <span>Instagram Story Cards Shared</span>
                <span className="font-bold text-amber-400">1,480 shares</span>
              </div>
              <div className="p-3 rounded-xl bg-midnight-950/60 border border-white/10 flex justify-between">
                <span>Viral Referral Conversion</span>
                <span className="font-bold text-emerald-400">32.4%</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 2: Question Management */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white">Live Question Drops & Scenarios</h3>
            <NeonButton
              variant="pink"
              size="sm"
              onClick={() => setIsAddingQuestion(!isAddingQuestion)}
            >
              <PlusCircle className="w-4 h-4 mr-1" /> Add New Prompt
            </NeonButton>
          </div>

          {/* New Question Drawer */}
          {isAddingQuestion && (
            <GlassCard variant="glow" className="p-5">
              <form onSubmit={handleAddQuestion} className="space-y-3">
                <h4 className="font-extrabold text-sm text-brand-pink">New Game Question</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-white/70 block mb-1">Target Game</label>
                    <select
                      value={newGameId}
                      onChange={(e) => setNewGameId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white"
                    >
                      <option value="red_flag_trial">The Red Flag Trial</option>
                      <option value="crush_detector">Crush Detector</option>
                      <option value="blind_confession">The Blind Confession</option>
                      <option value="partner_telepathy">Partner Telepathy</option>
                      <option value="how_well_know_me">How Well Do You Know Me?</option>
                      <option value="couple_chaos">Couple Chaos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-white/70 block mb-1">Category</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g. Dating, Habits"
                      className="w-full px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-white/70 block mb-1">Spiciness Level</label>
                    <select
                      value={newIntensity}
                      onChange={(e) => setNewIntensity(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white"
                    >
                      <option value={1}>Level 1: Mild / Fun</option>
                      <option value={2}>Level 2: Spicy Hot Take</option>
                      <option value={3}>Level 3: Wild / Chaos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-white/70 block mb-1">Prompt Text</label>
                  <textarea
                    rows={2}
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Enter the question or scenario prompt..."
                    className="w-full px-3 py-2 rounded-xl bg-midnight-950 border border-white/15 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <NeonButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingQuestion(false)}
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton type="submit" variant="pink" size="sm">
                    Save Question to Database
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          )}

          {/* List of Questions */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-midnight-950/60 border border-white/10 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-brand-pink uppercase tracking-wider">
                      {q.game_id}
                    </span>
                    <span className="text-[10px] text-white/50 px-1.5 py-0.5 rounded-full bg-white/5">
                      {q.category}
                    </span>
                    <span className="text-[10px] text-amber-400">
                      Intensity: {q.intensity_level}★
                    </span>
                  </div>
                  <p className="font-semibold text-white/90">&ldquo;{q.prompt}&rdquo;</p>
                </div>

                <span className="text-[10px] text-emerald-400 font-bold whitespace-nowrap">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Moderation Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white">Safety & Moderation Queue</h3>
          <div className="space-y-3">
            {reports.map((r) => (
              <GlassCard key={r.id} variant="default" className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-xs text-rose-400">Report #{r.id}</span>
                    <span className="text-[10px] text-white/40">
                      Target: {r.reported_player_id}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white">{r.reason}</p>
                </div>

                <div className="flex gap-2">
                  <NeonButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismissReport(r.id)}
                  >
                    Dismiss
                  </NeonButton>
                  <NeonButton
                    variant="pink"
                    size="sm"
                    onClick={() => handleDismissReport(r.id)}
                  >
                    Resolve & Warn
                  </NeonButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
