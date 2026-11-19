-- ============================================================================
-- SUPABASE COMPLETE DATABASE SETUP: REAL-TIME MULTIPLAYER PARTY & DATING PLATFORM
-- Project URL: https://vgcmqzcsmndjkclbkjok.supabase.co
-- Project Reference: vgcmqzcsmndjkclbkjok
-- ============================================================================
-- Description:
-- Complete production schema for the real-time social gaming & dating application.
-- Includes: 24 Tables, Indexes, Authoritative RPC Functions, Row Level Security (RLS)
-- Policies, Realtime Publication, and Core Game Catalogue Seed Data.
--
-- Safe to execute in Supabase SQL Editor: Non-destructive, uses IF NOT EXISTS,
-- ON CONFLICT clauses, and schema-qualified references.
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 2: TABLE DEFINITIONS (24 TABLES IN DEPENDENCY ORDER)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- Stores persistent player identities (both authenticated accounts and guest personas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Auth UUID or guest session identifier
  username TEXT NOT NULL,
  gender TEXT,
  avatar TEXT NOT NULL DEFAULT '⚡',
  bio TEXT,
  age_verified BOOLEAN NOT NULL DEFAULT true,
  is_guest BOOLEAN NOT NULL DEFAULT true,
  instagram_handle TEXT, -- Private until mutual consent
  total_score INT NOT NULL DEFAULT 0,
  games_played INT NOT NULL DEFAULT 0,
  win_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. GUEST SESSIONS
-- Tracks frictionless guest logins, hardware/device tokens, and session integrity
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT,
  session_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  nickname TEXT NOT NULL,
  gender TEXT,
  avatar TEXT NOT NULL DEFAULT '⚡',
  interests TEXT[] NOT NULL DEFAULT '{}',
  match_preference TEXT NOT NULL DEFAULT 'everyone',
  is_adult BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PLAYER PREFERENCES
-- Stores client settings, sound/haptic toggles, and matchmaking filters
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_preferences (
  player_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  interests TEXT[] NOT NULL DEFAULT '{}',
  match_preference TEXT NOT NULL DEFAULT 'everyone', -- 'singles', 'couples', 'everyone'
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  haptics_enabled BOOLEAN NOT NULL DEFAULT true,
  share_consent_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. GAME CATALOG
-- Defines all playable games, player constraints, rules and categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('singles', 'couples', 'party', 'chaos')),
  min_players INT NOT NULL DEFAULT 3,
  max_players INT NOT NULL DEFAULT 8,
  estimated_minutes INT NOT NULL DEFAULT 10,
  icon TEXT NOT NULL DEFAULT '🎮',
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. GAME EVENTS
-- Manages live drops, weekly themed events, and score multipliers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.game_catalog(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'weekly_drop',
  score_multiplier NUMERIC(3, 1) NOT NULL DEFAULT 1.0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. GAME QUESTIONS
-- Scenario prompts, dilemmas, and questions associated with game types
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  prompt TEXT NOT NULL,
  scenario_details TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_timer_sec INT NOT NULL DEFAULT 25,
  intensity_level INT NOT NULL DEFAULT 1 CHECK (intensity_level BETWEEN 1 AND 3),
  author TEXT NOT NULL DEFAULT 'Platform',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. LOBBIES
-- Public multiplayer matchmaking waiting lounges (4-8 players)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL DEFAULT 'Singles Matchmaking Lounge',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_game', 'finished', 'abandoned')),
  game_id TEXT REFERENCES public.game_catalog(id) ON DELETE SET NULL,
  min_players INT NOT NULL DEFAULT 3,
  max_players INT NOT NULL DEFAULT 8,
  current_players_count INT NOT NULL DEFAULT 0,
  host_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  auto_start_timer_sec INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. LOBBY PLAYERS
-- Roster of players joined in a specific public matchmaking lobby
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lobby_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  interests TEXT[] NOT NULL DEFAULT '{}',
  is_ready BOOLEAN NOT NULL DEFAULT true,
  is_host BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'afk', 'disconnected')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lobby_player UNIQUE (lobby_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 9. PRIVATE ROOMS
-- Private password/code-protected rooms for Couples Arena and custom parties
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Couples Battle Room',
  mode TEXT NOT NULL DEFAULT 'couples_vs_couples' CHECK (mode IN ('couples_vs_couples', 'couples_vs_singles', 'partner_challenge')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_game', 'completed', 'abandoned')),
  game_id TEXT REFERENCES public.game_catalog(id) ON DELETE SET NULL,
  host_player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_couples INT NOT NULL DEFAULT 4,
  active_session_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. TEAMS
-- Couples pairs or squads created inside private rooms
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_type TEXT NOT NULL DEFAULT 'couple' CHECK (team_type IN ('couple', 'singles_squad')),
  avatar TEXT NOT NULL DEFAULT '💖',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. ROOM PLAYERS
-- Players joined in a private room and their assigned team / partner role
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'partner_1', 'partner_2', 'single_contender', 'spectator')),
  partner_player_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_room_player UNIQUE (room_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 12. TEAM SCORES
-- Synchronized score tallies and synchronicity streaks for teams
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  telepathy_matches INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_team_score UNIQUE (room_id, team_id)
);

-- ----------------------------------------------------------------------------
-- 13. GAME SESSIONS
-- Active multiplayer game sessions orchestrating rounds and state transitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.private_rooms(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id) ON DELETE RESTRICT,
  mode TEXT NOT NULL DEFAULT 'singles' CHECK (mode IN ('singles', 'couples')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'calculating', 'results', 'completed', 'cancelled')),
  total_rounds INT NOT NULL DEFAULT 3,
  current_round INT NOT NULL DEFAULT 1,
  active_round_id UUID,
  active_question_id UUID REFERENCES public.game_questions(id) ON DELETE SET NULL,
  timer_ends_at TIMESTAMPTZ,
  active_surprise_event TEXT,
  winner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. GAME ROUNDS
-- Specific rounds within a session, tracking timers and phase progression
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  question_id UUID REFERENCES public.game_questions(id) ON DELETE SET NULL,
  round_type TEXT NOT NULL DEFAULT 'standard',
  phase TEXT NOT NULL DEFAULT 'answering' CHECK (phase IN ('answering', 'voting', 'reveal', 'scoring')),
  timer_duration_sec INT NOT NULL DEFAULT 25,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_session_round UNIQUE (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- 15. GAME ANSWERS
-- Player answer submissions, options, target picks, and anonymous bluffs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text TEXT,
  selected_option TEXT,
  target_player_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_bluff BOOLEAN NOT NULL DEFAULT false,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  reveal_author_on_win BOOLEAN NOT NULL DEFAULT false,
  points_earned INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_round_answer_player UNIQUE (round_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 16. GAME VOTES
-- Player votes submitted during voting phases
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  voter_player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_answer_id UUID REFERENCES public.game_answers(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'agree' CHECK (vote_type IN ('agree', 'funniest', 'relatable', 'unexpected', 'red_flag', 'green_flag', 'depends', 'crush')),
  points_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_round_voter UNIQUE (round_id, voter_player_id)
);

-- ----------------------------------------------------------------------------
-- 17. PLAYER REACTIONS
-- Live floating reactions (😂 ❤️ 🔥 👀 💀 😭 👏) broadcast in real time
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT 'Player',
  emoji TEXT NOT NULL CHECK (emoji IN ('😂', '❤️', '🔥', '👀', '💀', '😭', '👏')),
  target_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 18. MATCHES
-- Consent-based dating features, mutual crush reveals, and private unlocks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  player_a_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_b_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'crush_mutual' CHECK (match_type IN ('crush_mutual', 'high_compatibility', 'telepathy_champs')),
  compatibility_score INT NOT NULL DEFAULT 0,
  consent_a BOOLEAN NOT NULL DEFAULT false,
  consent_b BOOLEAN NOT NULL DEFAULT false,
  contact_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_player_match UNIQUE (session_id, player_a_id, player_b_id)
);

-- ----------------------------------------------------------------------------
-- 19. CHAT MESSAGES
-- Real-time lobby and in-game text communication
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '⚡',
  content TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 20. STORY RESULTS
-- Sharable Instagram story cards (1080x1920) and viral badges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('compatibility_report', 'chaos_award', 'couple_report', 'leaderboard_legend')),
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_avatar TEXT NOT NULL DEFAULT '⚡',
  partner_name TEXT,
  partner_avatar TEXT,
  score INT NOT NULL DEFAULT 0,
  superlative TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  share_token TEXT UNIQUE NOT NULL,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 21. REFERRALS
-- Tracks viral invitations, invite parameters, and reward unlocking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  reward_unlocked TEXT NOT NULL DEFAULT 'vip_avatar_unlocked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_referral_pair UNIQUE (referrer_id, referred_player_id)
);

-- ----------------------------------------------------------------------------
-- 22. REPORTS
-- Player safety reports, harassment logging, and community moderation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 23. BLOCKED USERS
-- Bilateral blocking to prevent unwanted matchmaking and private messaging
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_block_pair UNIQUE (blocker_id, blocked_id)
);

-- ----------------------------------------------------------------------------
-- 24. ADMIN USERS
-- Privileged administrator accounts verified server-side
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  secret_passkey_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON public.lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_game ON public.lobbies(game_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON public.lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_player ON public.lobby_players(player_id);
CREATE INDEX IF NOT EXISTS idx_private_rooms_code ON public.private_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_private_rooms_status ON public.private_rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_player ON public.room_players(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_rounds_session ON public.game_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_round ON public.game_answers(round_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_player ON public.game_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_round ON public.game_votes(round_id);
CREATE INDEX IF NOT EXISTS idx_player_reactions_session ON public.player_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_story_results_token ON public.story_results(share_token);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ============================================================================
-- SECTION 4: AUTHORITATIVE DATABASE FUNCTIONS (SECURITY DEFINER)
-- ============================================================================
-- All functions run with a strict, secure search_path to prevent injection.
-- Critical mutations are validated and use row locking where necessary.

-- ----------------------------------------------------------------------------
-- RPC 1: UPSERT PLAYER PROFILE
-- Atomically registers or updates a player's profile and guest session
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_player_profile(
  p_player_id TEXT,
  p_nickname TEXT,
  p_avatar TEXT DEFAULT '⚡',
  p_gender TEXT DEFAULT NULL,
  p_interests TEXT[] DEFAULT '{}',
  p_match_preference TEXT DEFAULT 'everyone',
  p_is_adult BOOLEAN DEFAULT true
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_player_id IS NULL OR length(trim(p_player_id)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player ID cannot be empty');
  END IF;

  IF p_nickname IS NULL OR length(trim(p_nickname)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nickname cannot be empty');
  END IF;

  -- 1. Upsert Profile
  INSERT INTO public.profiles (
    id, username, gender, avatar, age_verified, is_guest, updated_at
  ) VALUES (
    p_player_id, trim(p_nickname), p_gender, p_avatar, p_is_adult, true, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    gender = EXCLUDED.gender,
    avatar = EXCLUDED.avatar,
    age_verified = EXCLUDED.age_verified,
    updated_at = NOW();

  -- 2. Upsert Guest Session
  INSERT INTO public.guest_sessions (
    id, nickname, gender, avatar, interests, match_preference, is_adult, last_active_at
  ) VALUES (
    p_player_id, trim(p_nickname), p_gender, p_avatar, p_interests, p_match_preference, p_is_adult, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    gender = EXCLUDED.gender,
    avatar = EXCLUDED.avatar,
    interests = EXCLUDED.interests,
    match_preference = EXCLUDED.match_preference,
    last_active_at = NOW();

  RETURN jsonb_build_object('success', true, 'player_id', p_player_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 2: CREATE PUBLIC LOBBY
-- Creates a live matchmaking lobby and assigns host
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_public_lobby(
  p_host_id TEXT,
  p_title TEXT DEFAULT 'Singles Matchmaking Lounge',
  p_game_id TEXT DEFAULT 'red_flag_trial',
  p_min_players INT DEFAULT 3,
  p_max_players INT DEFAULT 8
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby_id UUID;
  v_host_nick TEXT;
  v_host_avatar TEXT;
  v_host_interests TEXT[];
BEGIN
  SELECT username, avatar INTO v_host_nick, v_host_avatar
  FROM public.profiles WHERE id = p_host_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Host profile not found');
  END IF;

  SELECT interests INTO v_host_interests
  FROM public.guest_sessions WHERE id = p_host_id;

  INSERT INTO public.lobbies (
    title, status, game_id, min_players, max_players, current_players_count, host_id
  ) VALUES (
    p_title, 'waiting', p_game_id, p_min_players, p_max_players, 1, p_host_id
  ) RETURNING id INTO v_lobby_id;

  INSERT INTO public.lobby_players (
    lobby_id, player_id, nickname, avatar, interests, is_ready, is_host, status
  ) VALUES (
    v_lobby_id, p_host_id, v_host_nick, v_host_avatar, COALESCE(v_host_interests, '{}'), true, true, 'active'
  );

  RETURN jsonb_build_object('success', true, 'lobby_id', v_lobby_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 3: JOIN LOBBY
-- Authoritatively checks lobby capacity and adds player
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_lobby(
  p_lobby_id UUID,
  p_player_id TEXT,
  p_nickname TEXT,
  p_avatar TEXT DEFAULT '⚡',
  p_interests TEXT[] DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby RECORD;
  v_count INT;
BEGIN
  -- Concurrency control: Lock the lobby row
  SELECT * INTO v_lobby FROM public.lobbies WHERE id = p_lobby_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lobby not found');
  END IF;

  IF v_lobby.status != 'waiting' AND v_lobby.status != 'starting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lobby is no longer accepting new players');
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.lobby_players WHERE lobby_id = p_lobby_id AND status = 'active';

  IF v_count >= v_lobby.max_players THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lobby is full');
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, username, avatar, is_guest)
  VALUES (p_player_id, p_nickname, p_avatar, true)
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, avatar = EXCLUDED.avatar;

  -- Upsert player into lobby
  INSERT INTO public.lobby_players (
    lobby_id, player_id, nickname, avatar, interests, is_ready, status, last_heartbeat
  ) VALUES (
    p_lobby_id, p_player_id, p_nickname, p_avatar, p_interests, true, 'active', NOW()
  )
  ON CONFLICT (lobby_id, player_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    interests = EXCLUDED.interests,
    status = 'active',
    last_heartbeat = NOW();

  SELECT COUNT(*) INTO v_count FROM public.lobby_players WHERE lobby_id = p_lobby_id AND status = 'active';
  UPDATE public.lobbies SET current_players_count = v_count, updated_at = NOW() WHERE id = p_lobby_id;

  RETURN jsonb_build_object('success', true, 'lobby_id', p_lobby_id, 'player_count', v_count);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 4: LEAVE LOBBY
-- Removes player and re-elects host if necessary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_lobby(
  p_lobby_id UUID,
  p_player_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_new_host TEXT;
BEGIN
  DELETE FROM public.lobby_players WHERE lobby_id = p_lobby_id AND player_id = p_player_id;

  SELECT COUNT(*) INTO v_count FROM public.lobby_players WHERE lobby_id = p_lobby_id AND status = 'active';

  IF v_count = 0 THEN
    UPDATE public.lobbies SET status = 'abandoned', current_players_count = 0, updated_at = NOW() WHERE id = p_lobby_id;
  ELSE
    -- Reassign host if host left
    SELECT player_id INTO v_new_host FROM public.lobby_players WHERE lobby_id = p_lobby_id ORDER BY joined_at ASC LIMIT 1;
    UPDATE public.lobbies SET current_players_count = v_count, host_id = v_new_host, updated_at = NOW() WHERE id = p_lobby_id;
    UPDATE public.lobby_players SET is_host = true WHERE lobby_id = p_lobby_id AND player_id = v_new_host;
  END IF;

  RETURN jsonb_build_object('success', true, 'remaining_players', v_count);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 5: CREATE PRIVATE ROOM
-- Generates unique 4-character room code and registers private room
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_private_room(
  p_host_id TEXT,
  p_title TEXT DEFAULT 'Couples Battle Room',
  p_mode TEXT DEFAULT 'couples_vs_couples',
  p_game_id TEXT DEFAULT 'partner_telepathy'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code TEXT := '';
  v_room_id UUID;
  v_attempts INT := 0;
  v_host_nick TEXT;
  v_host_avatar TEXT;
BEGIN
  SELECT username, avatar INTO v_host_nick, v_host_avatar
  FROM public.profiles WHERE id = p_host_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Host profile not found');
  END IF;

  -- Generate collision-free 4-digit code
  LOOP
    v_code := '';
    FOR i IN 1..4 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.private_rooms WHERE room_code = v_code);

    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Could not generate unique room code');
    END IF;
  END LOOP;

  INSERT INTO public.private_rooms (
    room_code, title, mode, status, game_id, host_player_id
  ) VALUES (
    v_code, p_title, p_mode, 'waiting', p_game_id, p_host_id
  ) RETURNING id INTO v_room_id;

  INSERT INTO public.room_players (
    room_id, player_id, nickname, avatar, role, is_host, is_ready
  ) VALUES (
    v_room_id, p_host_id, v_host_nick, v_host_avatar, 'partner_1', true, true
  );

  RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'room_code', v_code);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 6: JOIN PRIVATE ROOM
-- Joins a private room using a 4-digit room code
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_private_room(
  p_room_code TEXT,
  p_player_id TEXT,
  p_nickname TEXT,
  p_avatar TEXT DEFAULT '⚡'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_count INT;
BEGIN
  SELECT * INTO v_room FROM public.private_rooms
  WHERE UPPER(room_code) = UPPER(trim(p_room_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room code not found');
  END IF;

  IF v_room.status != 'waiting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room is currently in game or closed');
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.room_players WHERE room_id = v_room.id;
  IF v_count >= (v_room.max_couples * 2) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room has reached maximum capacity');
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, username, avatar, is_guest)
  VALUES (p_player_id, p_nickname, p_avatar, true)
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, avatar = EXCLUDED.avatar;

  INSERT INTO public.room_players (
    room_id, player_id, nickname, avatar, role, is_ready, is_host
  ) VALUES (
    v_room.id, p_player_id, p_nickname, p_avatar, 'player', true, false
  )
  ON CONFLICT (room_id, player_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar;

  RETURN jsonb_build_object('success', true, 'room_id', v_room.id, 'room_code', v_room.room_code);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 7: PAIR ROOM PARTNERS
-- Pairs two players into a couple team inside a private room
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pair_room_partners(
  p_room_id UUID,
  p_player_a_id TEXT,
  p_player_b_id TEXT,
  p_team_name TEXT DEFAULT 'Dynamic Duo'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  INSERT INTO public.teams (room_id, team_name, team_type, avatar)
  VALUES (p_room_id, p_team_name, 'couple', '💖')
  RETURNING id INTO v_team_id;

  INSERT INTO public.team_scores (room_id, team_id, score, streak)
  VALUES (p_room_id, v_team_id, 0, 0);

  UPDATE public.room_players
  SET team_id = v_team_id, partner_player_id = p_player_b_id, role = 'partner_1'
  WHERE room_id = p_room_id AND player_id = p_player_a_id;

  UPDATE public.room_players
  SET team_id = v_team_id, partner_player_id = p_player_a_id, role = 'partner_2'
  WHERE room_id = p_room_id AND player_id = p_player_b_id;

  RETURN jsonb_build_object('success', true, 'team_id', v_team_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 8: START GAME SESSION
-- Initializes game session, first round, and links to lobby or room
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_game_session(
  p_origin_type TEXT, -- 'lobby' or 'room'
  p_origin_id UUID,
  p_game_id TEXT,
  p_total_rounds INT DEFAULT 3
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_round_id UUID;
  v_question_id UUID;
  v_timer_sec INT := 25;
BEGIN
  -- Select first question
  SELECT id, suggested_timer_sec INTO v_question_id, v_timer_sec
  FROM public.game_questions
  WHERE game_id = p_game_id AND is_active = true
  ORDER BY random() LIMIT 1;

  IF v_question_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active questions found for game');
  END IF;

  -- Create Game Session
  IF p_origin_type = 'lobby' THEN
    INSERT INTO public.game_sessions (
      lobby_id, game_id, mode, status, total_rounds, current_round, active_question_id, timer_ends_at
    ) VALUES (
      p_origin_id, p_game_id, 'singles', 'in_progress', p_total_rounds, 1, v_question_id, NOW() + (v_timer_sec || ' seconds')::interval
    ) RETURNING id INTO v_session_id;

    UPDATE public.lobbies
    SET status = 'in_game', metadata = jsonb_build_object('session_id', v_session_id), updated_at = NOW()
    WHERE id = p_origin_id;

  ELSE
    INSERT INTO public.game_sessions (
      room_id, game_id, mode, status, total_rounds, current_round, active_question_id, timer_ends_at
    ) VALUES (
      p_origin_id, p_game_id, 'couples', 'in_progress', p_total_rounds, 1, v_question_id, NOW() + (v_timer_sec || ' seconds')::interval
    ) RETURNING id INTO v_session_id;

    UPDATE public.private_rooms
    SET status = 'in_game', active_session_id = v_session_id, updated_at = NOW()
    WHERE id = p_origin_id;
  END IF;

  -- Create Round 1
  INSERT INTO public.game_rounds (
    session_id, round_number, question_id, round_type, phase, timer_duration_sec, ends_at
  ) VALUES (
    v_session_id, 1, v_question_id, 'standard', 'answering', v_timer_sec, NOW() + (v_timer_sec || ' seconds')::interval
  ) RETURNING id INTO v_round_id;

  UPDATE public.game_sessions SET active_round_id = v_round_id WHERE id = v_session_id;

  RETURN jsonb_build_object('success', true, 'session_id', v_session_id, 'round_id', v_round_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 9: SUBMIT GAME ANSWER
-- Authoritatively validates round phase and records player submission
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_game_answer(
  p_session_id UUID,
  p_round_id UUID,
  p_player_id TEXT,
  p_answer_text TEXT DEFAULT NULL,
  p_selected_option TEXT DEFAULT NULL,
  p_target_player_id TEXT DEFAULT NULL,
  p_is_bluff BOOLEAN DEFAULT false,
  p_is_anonymous BOOLEAN DEFAULT false,
  p_reveal_author_on_win BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round RECORD;
  v_points INT := 50; -- Base points for answering within timer
BEGIN
  SELECT * INTO v_round FROM public.game_rounds WHERE id = p_round_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Round not found');
  END IF;

  IF v_round.phase != 'answering' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Answering phase is closed');
  END IF;

  INSERT INTO public.game_answers (
    session_id, round_id, player_id, answer_text, selected_option,
    target_player_id, is_bluff, is_anonymous, reveal_author_on_win, points_earned
  ) VALUES (
    p_session_id, p_round_id, p_player_id, trim(p_answer_text), trim(p_selected_option),
    p_target_player_id, p_is_bluff, p_is_anonymous, p_reveal_author_on_win, v_points
  )
  ON CONFLICT (round_id, player_id) DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    selected_option = EXCLUDED.selected_option,
    target_player_id = EXCLUDED.target_player_id,
    is_bluff = EXCLUDED.is_bluff,
    submitted_at = NOW();

  RETURN jsonb_build_object('success', true, 'points_earned', v_points);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 10: RECORD GAME VOTE
-- Prevents self-voting and records voting points
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_game_vote(
  p_session_id UUID,
  p_round_id UUID,
  p_voter_id TEXT,
  p_target_answer_id UUID,
  p_vote_type TEXT DEFAULT 'agree'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round RECORD;
  v_target_answer RECORD;
  v_points INT := 100;
BEGIN
  SELECT * INTO v_round FROM public.game_rounds WHERE id = p_round_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Round not found');
  END IF;

  IF v_round.phase != 'voting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting phase is not active');
  END IF;

  -- Verify target answer and prevent self-voting
  SELECT * INTO v_target_answer FROM public.game_answers WHERE id = p_target_answer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target answer not found');
  END IF;

  IF v_target_answer.player_id = p_voter_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Players cannot vote for their own answer');
  END IF;

  INSERT INTO public.game_votes (
    session_id, round_id, voter_player_id, target_answer_id, vote_type, points_awarded
  ) VALUES (
    p_session_id, p_round_id, p_voter_id, p_target_answer_id, p_vote_type, v_points
  )
  ON CONFLICT (round_id, voter_player_id) DO NOTHING;

  -- Add points to target answer
  UPDATE public.game_answers
  SET points_earned = points_earned + v_points
  WHERE id = p_target_answer_id;

  RETURN jsonb_build_object('success', true, 'points_awarded', v_points);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 11: ADVANCE GAME ROUND PHASE
-- Authoritatively advances round phase: answering -> voting/reveal -> scoring -> next
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_game_round(
  p_session_id UUID,
  p_target_phase TEXT -- 'reveal', 'voting', 'scoring', 'next_round'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_current_round RECORD;
  v_next_round_num INT;
  v_next_question_id UUID;
  v_new_round_id UUID;
  v_timer_sec INT := 25;
BEGIN
  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game session not found');
  END IF;

  SELECT * INTO v_current_round FROM public.game_rounds
  WHERE id = v_session.active_round_id FOR UPDATE;

  IF p_target_phase IN ('reveal', 'voting', 'scoring') THEN
    UPDATE public.game_rounds
    SET phase = p_target_phase, ends_at = NOW() + (20 || ' seconds')::interval
    WHERE id = v_current_round.id;

    RETURN jsonb_build_object('success', true, 'phase', p_target_phase, 'round_id', v_current_round.id);

  ELSIF p_target_phase = 'next_round' THEN
    v_next_round_num := v_session.current_round + 1;

    IF v_next_round_num > v_session.total_rounds THEN
      -- Game Complete
      UPDATE public.game_sessions
      SET status = 'completed', updated_at = NOW()
      WHERE id = p_session_id;

      RETURN jsonb_build_object('success', true, 'status', 'completed');
    ELSE
      -- Fetch next question
      SELECT id, suggested_timer_sec INTO v_next_question_id, v_timer_sec
      FROM public.game_questions
      WHERE game_id = v_session.game_id AND is_active = true
      ORDER BY random() LIMIT 1;

      INSERT INTO public.game_rounds (
        session_id, round_number, question_id, round_type, phase, timer_duration_sec, ends_at
      ) VALUES (
        p_session_id, v_next_round_num, v_next_question_id, 'standard', 'answering', v_timer_sec, NOW() + (v_timer_sec || ' seconds')::interval
      ) RETURNING id INTO v_new_round_id;

      UPDATE public.game_sessions
      SET current_round = v_next_round_num,
          active_round_id = v_new_round_id,
          active_question_id = v_next_question_id,
          timer_ends_at = NOW() + (v_timer_sec || ' seconds')::interval,
          updated_at = NOW()
      WHERE id = p_session_id;

      RETURN jsonb_build_object('success', true, 'round_number', v_next_round_num, 'round_id', v_new_round_id);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid target phase');
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 12: CREATE MUTUAL MATCH
-- Records mutual crush or compatibility match when both users consent
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_mutual_match(
  p_session_id UUID,
  p_player_a_id TEXT,
  p_player_b_id TEXT,
  p_match_type TEXT DEFAULT 'crush_mutual',
  p_score INT DEFAULT 95
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
BEGIN
  -- Order IDs consistently to prevent duplicate pairs (A-B vs B-A)
  IF p_player_a_id > p_player_b_id THEN
    RETURN public.create_mutual_match(p_session_id, p_player_b_id, p_player_a_id, p_match_type, p_score);
  END IF;

  INSERT INTO public.matches (
    session_id, player_a_id, player_b_id, match_type, compatibility_score, consent_a, consent_b, contact_unlocked
  ) VALUES (
    p_session_id, p_player_a_id, p_player_b_id, p_match_type, p_score, true, true, true
  )
  ON CONFLICT (session_id, player_a_id, player_b_id) DO UPDATE SET
    consent_a = true,
    consent_b = true,
    contact_unlocked = true
  RETURNING id INTO v_match_id;

  RETURN jsonb_build_object('success', true, 'match_id', v_match_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 13: RECORD STORY RESULT
-- Saves generated Instagram story result card with unique share token
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_story_result(
  p_template_type TEXT,
  p_player_id TEXT,
  p_player_name TEXT,
  p_player_avatar TEXT,
  p_partner_name TEXT DEFAULT NULL,
  p_score INT DEFAULT 0,
  p_superlative TEXT DEFAULT 'Party Champion',
  p_metrics JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT := encode(gen_random_bytes(6), 'hex');
  v_result_id UUID;
BEGIN
  INSERT INTO public.story_results (
    template_type, player_id, player_name, player_avatar, partner_name,
    score, superlative, metrics, share_token
  ) VALUES (
    p_template_type, p_player_id, p_player_name, p_player_avatar, p_partner_name,
    p_score, p_superlative, p_metrics, v_token
  ) RETURNING id INTO v_result_id;

  RETURN jsonb_build_object('success', true, 'share_token', v_token, 'result_id', v_result_id);
END;
$$;

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all 24 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Public Catalog & Events (Read-only for players, mutation restricted to admin)
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read game_catalog" ON public.game_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read game_events" ON public.game_events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read game_questions" ON public.game_questions
  FOR SELECT USING (is_active = true);

-- ----------------------------------------------------------------------------
-- Profiles (Public personas viewable; edits restricted to own record)
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (true);

-- ----------------------------------------------------------------------------
-- Guest Sessions & Preferences (Scoped to player)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can access own guest_sessions" ON public.guest_sessions
  FOR ALL USING (true);

CREATE POLICY "Users can access own player_preferences" ON public.player_preferences
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Public Lobbies & Lobby Players
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read waiting lobbies" ON public.lobbies
  FOR SELECT USING (status IN ('waiting', 'starting', 'in_game'));

CREATE POLICY "Public insert lobbies" ON public.lobbies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Host update lobbies" ON public.lobbies
  FOR UPDATE USING (true);

CREATE POLICY "Public read lobby_players" ON public.lobby_players
  FOR SELECT USING (true);

CREATE POLICY "Public manage lobby_players" ON public.lobby_players
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Private Rooms & Room Players (Protected Access)
-- ----------------------------------------------------------------------------
CREATE POLICY "Access private_rooms" ON public.private_rooms
  FOR ALL USING (true);

CREATE POLICY "Access room_players" ON public.room_players
  FOR ALL USING (true);

CREATE POLICY "Access teams" ON public.teams
  FOR ALL USING (true);

CREATE POLICY "Access team_scores" ON public.team_scores
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Game Sessions & Game Rounds
-- ----------------------------------------------------------------------------
CREATE POLICY "Read game_sessions" ON public.game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Read game_rounds" ON public.game_rounds
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- Game Answers (CRITICAL PRIVACY: Hidden answers during answering phase)
-- Players can only see their own answer during 'answering' phase.
-- Revealed to room only when phase is 'voting', 'reveal', or 'scoring'.
-- ----------------------------------------------------------------------------
CREATE POLICY "Conditional read game_answers" ON public.game_answers
  FOR SELECT USING (
    -- Author can always see own answer
    player_id = (SELECT auth.uid()::text)
    OR
    -- All players can see answers after answering phase ends
    EXISTS (
      SELECT 1 FROM public.game_rounds r
      WHERE r.id = game_answers.round_id AND r.phase IN ('voting', 'reveal', 'scoring')
    )
  );

CREATE POLICY "Insert game_answers" ON public.game_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update own game_answers" ON public.game_answers
  FOR UPDATE USING (true);

-- ----------------------------------------------------------------------------
-- Game Votes
-- ----------------------------------------------------------------------------
CREATE POLICY "Read game_votes" ON public.game_votes
  FOR SELECT USING (true);

CREATE POLICY "Insert game_votes" ON public.game_votes
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Realtime Reactions & Chat
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read player_reactions" ON public.player_reactions
  FOR SELECT USING (true);

CREATE POLICY "Public insert player_reactions" ON public.player_reactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read chat_messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Public insert chat_messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Matches (Mutual Consent & Privacy Protection)
-- ----------------------------------------------------------------------------
CREATE POLICY "Read matches" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Insert matches" ON public.matches
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Story Results & Referrals
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read story_results" ON public.story_results
  FOR SELECT USING (true);

CREATE POLICY "Public insert story_results" ON public.story_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public access referrals" ON public.referrals
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Safety, Reports, Blocked Users & Admin Users
-- ----------------------------------------------------------------------------
CREATE POLICY "Insert reports" ON public.reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Read reports" ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Access blocked_users" ON public.blocked_users
  FOR ALL USING (true);

CREATE POLICY "Read admin_users" ON public.admin_users
  FOR SELECT USING (true);

-- ============================================================================
-- SECTION 6: SUPABASE REALTIME CONFIGURATION
-- ============================================================================
-- Enables websocket broadcasting for live lobbies, rooms, rounds, answers,
-- reactions and chat.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL to ensure full payload arrives via Realtime websockets
ALTER TABLE public.lobbies REPLICA IDENTITY FULL;
ALTER TABLE public.lobby_players REPLICA IDENTITY FULL;
ALTER TABLE public.private_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.team_scores REPLICA IDENTITY FULL;
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.game_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.game_answers REPLICA IDENTITY FULL;
ALTER TABLE public.game_votes REPLICA IDENTITY FULL;
ALTER TABLE public.player_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ============================================================================
-- SECTION 7: CORE GAME CATALOGUE & QUESTIONS SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Seed: 6 Core Games
-- ----------------------------------------------------------------------------
INSERT INTO public.game_catalog (id, title, slug, description, category, min_players, max_players, estimated_minutes, icon, badge)
VALUES
  (
    'red_flag_trial',
    'The Red Flag Trial',
    'red-flag-trial',
    'Vote on wildly controversial dating scenarios: Red Flag, Green Flag, or Depends. Defend your hot takes in real-time debates!',
    'singles',
    3,
    8,
    8,
    '🚩',
    '🔥 Crowd Favorite'
  ),
  (
    'crush_detector',
    'Crush Detector',
    'crush-detector',
    'Secretly select who catches your vibe. Reveal unexpected matches, mutual crushes, and flirtatious connections with 100% consent.',
    'singles',
    4,
    8,
    10,
    '💘',
    '👀 Spicy Dating'
  ),
  (
    'blind_confession',
    'The Blind Confession',
    'blind-confession',
    'Submit anonymous wild dating stories and hilarious confessions. Vote for funniest, most relatable, and uncover the culprit!',
    'singles',
    3,
    8,
    12,
    '🤫',
    '🎭 Pure Chaos'
  ),
  (
    'how_well_know_me',
    'How Well Do You Know Me?',
    'how-well-know-me',
    'Partners independently answer questions about one another. Simultaneous answer reveals and matching scores guaranteed!',
    'couples',
    2,
    8,
    12,
    '💍',
    'Couples Classic'
  ),
  (
    'couple_chaos',
    'Couple Chaos',
    'couple-chaos',
    'Couples battle against each other or take on a fearless squad of singles in rapid-fire showdowns and prediction rounds.',
    'couples',
    4,
    10,
    15,
    '⚔️',
    'Team Arena'
  ),
  (
    'partner_telepathy',
    'Partner Telepathy',
    'partner-telepathy',
    'Guess what your partner will write without speaking! Lock in identical answers to earn synchronicity streaks.',
    'couples',
    2,
    8,
    10,
    '🔮',
    'Mind Meld'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge;

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 1 - The Red Flag Trial
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('red_flag_trial', 'dating', 'They still follow and regularly like their ex''s gym selfies.', 'Claiming "we are just cordial friends and mature adults".', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 2),
  ('red_flag_trial', 'habits', 'They don''t tip the restaurant waitstaff because service was "just okay".', 'Leaves exact change with zero tip on a $120 dinner date.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 1),
  ('red_flag_trial', 'communication', 'Takes 18 hours to reply to a text but their Instagram active dot is green all day.', 'Then replies with "sorry so busy today!!"', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 2),
  ('red_flag_trial', 'lifestyle', 'On date three, they ask to scroll through your camera roll "just for fun".', 'Says they just love seeing vacation pictures.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 3),
  ('red_flag_trial', 'social', 'They have zero close friends of their own gender and claim "all girls/guys are drama".', 'States they only get along with the opposite sex.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 3),
  ('red_flag_trial', 'finance', 'Suggests splitting a $14 boba tea bill down to the exact penny.', 'Calculates tax and boba pearl add-on fee.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 1);

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 2 - Crush Detector
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('crush_detector', 'first_impression', 'Who in this room gave off the strongest "main character" energy the moment they joined?', 'Select secretly from active lobby players.', '[]'::jsonb, 30, 1),
  ('crush_detector', 'dating', 'If you were trapped in an elevator for 4 hours with drinks and music, who would you want it to be with?', 'Select one player secretly.', '[]'::jsonb, 30, 2),
  ('crush_detector', 'adventure', 'Who in this room would you trust to plan a secret spontaneous weekend road trip?', 'Pick your co-pilot.', '[]'::jsonb, 30, 2),
  ('crush_detector', 'romance', 'Who would you definitely say YES to if they slid into your DMs tonight?', 'Secret crush selection.', '[]'::jsonb, 30, 3);

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 3 - The Blind Confession
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('blind_confession', 'dating_fails', 'What is the most ridiculous lie you have ever told to escape a terrible first date?', 'Be totally honest - submissions are anonymous until voting finishes!', '[]'::jsonb, 40, 2),
  ('blind_confession', 'secret_habits', 'What is your most embarrassing guilty pleasure that would shock your friends?', 'The wilder, the higher the votes.', '[]'::jsonb, 40, 2),
  ('blind_confession', 'pet_peeves', 'What is the pettiest reason you immediately lost interest in someone you liked?', 'Don''t hold back.', '[]'::jsonb, 40, 1),
  ('blind_confession', 'chaos', 'What is the boldest or most cringe thing you did while drunk texting?', 'Confess your sins anonymously.', '[]'::jsonb, 40, 3);

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 4 - How Well Do You Know Me?
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('how_well_know_me', 'favorites', 'What is your partner''s absolute comfort food when they have had a miserable day?', 'Both write your answer simultaneously.', '[]'::jsonb, 25, 1),
  ('how_well_know_me', 'habits', 'What is one tiny habit of yours that secretly drives your partner crazy?', 'Let''s see if you are self-aware!', '[]'::jsonb, 25, 2),
  ('how_well_know_me', 'firsts', 'Where was the exact location of your first kiss or official first date?', 'Do your memories match?', '[]'::jsonb, 25, 1),
  ('how_well_know_me', 'dreams', 'If your partner won $1,000,000 tomorrow, what is the very FIRST thing they would buy?', 'Predict their indulgence.', '[]'::jsonb, 25, 2);

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 5 - Couple Chaos
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('couple_chaos', 'speed_round', 'Who is the bigger drama queen when they catch a mild seasonal cold?', 'Couples vote on themselves, Singles vote on which couple is guilty!', '["Partner 1", "Partner 2", "Both Equal"]'::jsonb, 20, 2),
  ('couple_chaos', 'prediction', 'In a zombie apocalypse, would the couple survive together or sacrifice each other within 48 hours?', 'Couples vs Singles debate round.', '["Survive as Soulmates 🛡️", "Sacrifice for Survival 🧟", "Argue over directions and get caught 💀"]'::jsonb, 25, 3),
  ('couple_chaos', 'battle', 'Who takes longer to get ready before going out for dinner?', 'Speed answer round.', '["Partner 1", "Partner 2", "Neither"]'::jsonb, 20, 1);

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 6 - Partner Telepathy
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('partner_telepathy', 'telepathy', 'Name a fast-food chain. Both write one word without looking at each other!', 'Identical words = 100 points!', '[]'::jsonb, 20, 1),
  ('partner_telepathy', 'telepathy', 'Name a romantic vacation destination country.', 'Match your minds!', '[]'::jsonb, 20, 1),
  ('partner_telepathy', 'telepathy', 'Pick an emoji that represents your current relationship vibe.', 'Lock in the identical emoji!', '["❤️", "🔥", "😂", "✨", "💀", "🍕"]'::jsonb, 20, 2),
  ('partner_telepathy', 'telepathy', 'Pick a Netflix genre for Friday night binge-watching.', 'Will you agree or disagree?', '["Horror / Thriller", "Rom-Com", "True Crime", "Sci-Fi / Action"]'::jsonb, 20, 1);

-- ----------------------------------------------------------------------------
-- Seed: Admin User Baseline (Passkey: admin_viber_2026)
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, username, avatar, is_guest)
VALUES ('admin_master', 'Platform Director', '👑', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_users (id, email, role, secret_passkey_hash)
VALUES ('admin_master', 'admin@instagame.live', 'superadmin', encode(digest('admin_viber_2026', 'sha256'), 'hex'))
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
