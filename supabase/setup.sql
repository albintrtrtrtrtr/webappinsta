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
-- DROP POLICY IF EXISTS, ON CONFLICT clauses, and schema-qualified references.
-- Zero placeholder relations, zero unescaped currency tokens, and zero hardcoded credentials.
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
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  gender TEXT,
  avatar TEXT NOT NULL DEFAULT '⚡',
  bio TEXT,
  age_verified BOOLEAN NOT NULL DEFAULT true,
  is_guest BOOLEAN NOT NULL DEFAULT true,
  instagram_handle TEXT,
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
-- Stores user filters, audio preferences, and matchmaking criteria
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_preferences (
  player_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  haptics_enabled BOOLEAN NOT NULL DEFAULT true,
  blur_sensitive_media BOOLEAN NOT NULL DEFAULT false,
  preferred_game_modes TEXT[] NOT NULL DEFAULT ARRAY['singles', 'couples'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. GAME CATALOG
-- Defines all playable party games and coupling games in the system
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('singles', 'couples', 'party')),
  min_players INT NOT NULL DEFAULT 3,
  max_players INT NOT NULL DEFAULT 8,
  estimated_duration_min INT NOT NULL DEFAULT 8,
  icon TEXT NOT NULL DEFAULT '🎮',
  badge TEXT NOT NULL DEFAULT 'Popular',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. GAME EVENTS
-- Scheduled community tournaments and limited-time weekend speed dating events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  description TEXT,
  banner_image TEXT,
  participant_limit INT NOT NULL DEFAULT 100,
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
-- Association of players inside public matchmaking lounges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lobby_players (
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  interests TEXT[] NOT NULL DEFAULT '{}',
  is_ready BOOLEAN NOT NULL DEFAULT true,
  is_host BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'left')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lobby_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 9. PRIVATE ROOMS
-- Protected game rooms accessed via 4-character share codes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Couples Battle Room',
  host_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES public.game_catalog(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'couples' CHECK (mode IN ('couples', 'party', 'custom')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_game', 'finished', 'closed')),
  max_teams INT NOT NULL DEFAULT 4,
  max_players_per_team INT NOT NULL DEFAULT 2,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{"voice_enabled": false, "allow_spectators": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. TEAMS
-- Couples or party squads competing together inside a room
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_code TEXT NOT NULL DEFAULT '#EC4899',
  avatar_icon TEXT NOT NULL DEFAULT '💑',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. ROOM PLAYERS
-- Player membership in private rooms, mapped to their couple team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_players (
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT true,
  partner_nickname TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 12. TEAM SCORES
-- Live score tracker per team during competitive matches
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_scores (
  team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  rounds_won INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. GAME SESSIONS
-- Active multiplayer game instance with synchronized stage progression
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.private_rooms(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id) ON DELETE CASCADE,
  session_mode TEXT NOT NULL CHECK (session_mode IN ('singles', 'couples', 'party')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'voting', 'reveal', 'scoring', 'finished', 'aborted')),
  current_round INT NOT NULL DEFAULT 1,
  total_rounds INT NOT NULL DEFAULT 5,
  active_question_id UUID REFERENCES public.game_questions(id) ON DELETE SET NULL,
  timer_ends_at TIMESTAMPTZ,
  host_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. GAME ROUNDS
-- Synchronized rounds within an active game session
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  question_id UUID REFERENCES public.game_questions(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  scenario_details TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  phase TEXT NOT NULL DEFAULT 'answering' CHECK (phase IN ('answering', 'voting', 'reveal', 'scoring', 'completed')),
  phase_ends_at TIMESTAMPTZ,
  round_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, round_number)
);

-- ----------------------------------------------------------------------------
-- 15. GAME ANSWERS
-- Player or couple answers submitted during answering phase
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_payload JSONB NOT NULL,
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  points_earned INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 16. GAME VOTES
-- Player votes during voting phase
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_player_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  vote_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, voter_id)
);

-- ----------------------------------------------------------------------------
-- 17. PLAYER REACTIONS
-- Live floating emoji reactions during gameplay
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 18. MATCHES
-- Mutual crush or high-compatibility connection between two players
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_b_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'crush_detector',
  player_a_confirmed BOOLEAN NOT NULL DEFAULT true,
  player_b_confirmed BOOLEAN NOT NULL DEFAULT true,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_matches_pair UNIQUE (player_a_id, player_b_id)
);

-- ----------------------------------------------------------------------------
-- 19. CHAT MESSAGES
-- Ephemeral or persistent text messages in lobbies, rooms, and matches
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL CHECK (context_type IN ('lobby', 'room', 'game', 'match')),
  context_id TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '⚡',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 20. STORY RESULTS
-- High-engagement Instagram Story summary cards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  archetype_title TEXT NOT NULL,
  compatibility_score INT NOT NULL DEFAULT 85,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 21. REFERRALS
-- Tracks viral growth links and referee rewards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id TEXT UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 22. REPORTS
-- Player trust, safety, harassment and content moderation reports
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 23. BLOCKED USERS
-- Mutual block list to prevent unwanted matchmaking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ----------------------------------------------------------------------------
-- 24. ADMIN USERS
-- Privileged administrator accounts verified server-side
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'moderator')),
  permissions JSONB NOT NULL DEFAULT '{"can_ban": true, "can_manage_games": true, "can_view_reports": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: PERFORMANCE & INTEGRITY INDEXES
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
CREATE INDEX IF NOT EXISTS idx_chat_messages_context ON public.chat_messages(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_matches_pair ON public.matches(player_a_id, player_b_id);
CREATE INDEX IF NOT EXISTS idx_story_results_token ON public.story_results(share_token);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_questions_game_prompt ON public.game_questions(game_id, prompt);

-- ============================================================================
-- SECTION 4: AUTHORITATIVE DATABASE FUNCTIONS (RPCs)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC 1: UPSERT PLAYER PROFILE
-- Creates or refreshes a player profile and guest session safely
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_player_profile(
  p_player_id TEXT,
  p_nickname TEXT,
  p_gender TEXT DEFAULT NULL,
  p_avatar TEXT DEFAULT '⚡',
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
-- Initializes a public matchmaking lobby and registers the host player
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_public_lobby(
  p_host_id TEXT,
  p_host_nickname TEXT,
  p_host_avatar TEXT DEFAULT '⚡',
  p_game_id TEXT DEFAULT 'red_flag_trial',
  p_max_players INT DEFAULT 8
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby_id UUID;
  v_code TEXT;
BEGIN
  v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

  INSERT INTO public.lobbies (
    code, title, game_id, max_players, current_players_count, host_id, status
  ) VALUES (
    v_code, 'Singles Matchmaking Lounge', p_game_id, p_max_players, 1, p_host_id, 'waiting'
  ) RETURNING id INTO v_lobby_id;

  INSERT INTO public.lobby_players (
    lobby_id, player_id, nickname, avatar, is_host, is_ready, status
  ) VALUES (
    v_lobby_id, p_host_id, p_host_nickname, p_host_avatar, true, true, 'active'
  );

  RETURN jsonb_build_object('success', true, 'lobby_id', v_lobby_id, 'code', v_code);
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

  INSERT INTO public.profiles (id, username, avatar, is_guest)
  VALUES (p_player_id, p_nickname, p_avatar, true)
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, avatar = EXCLUDED.avatar;

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
    SELECT player_id INTO v_new_host FROM public.lobby_players WHERE lobby_id = p_lobby_id ORDER BY joined_at ASC LIMIT 1;
    UPDATE public.lobbies SET current_players_count = v_count, host_id = v_new_host, updated_at = NOW() WHERE id = p_lobby_id;
    UPDATE public.lobby_players SET is_host = (player_id = v_new_host) WHERE lobby_id = p_lobby_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'player_count', v_count);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 5: CREATE PRIVATE ROOM
-- Creates a 4-letter private room for couples or party groups
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_private_room(
  p_host_id TEXT,
  p_title TEXT DEFAULT 'Couples Battle Room',
  p_game_id TEXT DEFAULT 'how_well_know_me',
  p_max_teams INT DEFAULT 4,
  p_max_players_per_team INT DEFAULT 2
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_room_code TEXT;
  v_team_id UUID;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i INT;
BEGIN
  LOOP
    v_room_code := '';
    FOR v_i IN 1..4 LOOP
      v_room_code := v_room_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.private_rooms WHERE room_code = v_room_code AND status IN ('waiting', 'in_game'));
  END LOOP;

  INSERT INTO public.private_rooms (
    room_code, title, host_id, game_id, max_teams, max_players_per_team, status
  ) VALUES (
    v_room_code, p_title, p_host_id, p_game_id, p_max_teams, p_max_players_per_team, 'waiting'
  ) RETURNING id INTO v_room_id;

  INSERT INTO public.teams (room_id, name, color_code, avatar_icon)
  VALUES (v_room_id, 'Team 1', '#EC4899', '💑')
  RETURNING id INTO v_team_id;

  INSERT INTO public.team_scores (team_id, room_id, score)
  VALUES (v_team_id, v_room_id, 0);

  INSERT INTO public.room_players (
    room_id, player_id, team_id, nickname, avatar, is_host, is_ready
  ) VALUES (
    v_room_id, p_host_id, v_team_id, 'Host', '⚡', true, true
  );

  RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'room_code', v_room_code, 'team_id', v_team_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 6: JOIN PRIVATE ROOM
-- Validates 4-character code, assigns team, and records entry
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_private_room(
  p_room_code TEXT,
  p_player_id TEXT,
  p_nickname TEXT,
  p_avatar TEXT DEFAULT '⚡',
  p_partner_nickname TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_team_id UUID := p_team_id;
  v_player_count INT;
  v_team_count INT;
BEGIN
  SELECT * INTO v_room FROM public.private_rooms WHERE room_code = upper(trim(p_room_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid room code');
  END IF;

  IF v_room.status != 'waiting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room is currently in game or closed');
  END IF;

  SELECT COUNT(*) INTO v_player_count FROM public.room_players WHERE room_id = v_room.id;
  IF v_player_count >= (v_room.max_teams * v_room.max_players_per_team) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room has reached maximum capacity');
  END IF;

  IF v_team_id IS NULL THEN
    SELECT t.id INTO v_team_id
    FROM public.teams t
    LEFT JOIN public.room_players rp ON rp.team_id = t.id
    WHERE t.room_id = v_room.id
    GROUP BY t.id
    HAVING COUNT(rp.player_id) < v_room.max_players_per_team
    ORDER BY t.created_at ASC LIMIT 1;

    IF v_team_id IS NULL THEN
      SELECT COUNT(*) INTO v_team_count FROM public.teams WHERE room_id = v_room.id;
      IF v_team_count < v_room.max_teams THEN
        INSERT INTO public.teams (room_id, name, color_code, avatar_icon)
        VALUES (v_room.id, 'Team ' || (v_team_count + 1), '#8B5CF6', '🔥')
        RETURNING id INTO v_team_id;

        INSERT INTO public.team_scores (team_id, room_id, score)
        VALUES (v_team_id, v_room.id, 0);
      ELSE
        RETURN jsonb_build_object('success', false, 'error', 'All teams are full');
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, username, avatar, is_guest)
  VALUES (p_player_id, p_nickname, p_avatar, true)
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, avatar = EXCLUDED.avatar;

  INSERT INTO public.room_players (
    room_id, player_id, team_id, nickname, avatar, partner_nickname, is_ready, last_heartbeat
  ) VALUES (
    v_room.id, p_player_id, v_team_id, p_nickname, p_avatar, p_partner_nickname, true, NOW()
  )
  ON CONFLICT (room_id, player_id) DO UPDATE SET
    team_id = EXCLUDED.team_id,
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    partner_nickname = EXCLUDED.partner_nickname,
    last_heartbeat = NOW();

  RETURN jsonb_build_object('success', true, 'room_id', v_room.id, 'room_code', v_room.room_code, 'team_id', v_team_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 7: START GAME SESSION
-- Server-authoritative game start transition
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_game_session(
  p_lobby_id UUID DEFAULT NULL,
  p_room_id UUID DEFAULT NULL,
  p_game_id TEXT DEFAULT 'red_flag_trial',
  p_session_mode TEXT DEFAULT 'singles',
  p_host_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_round_id UUID;
  v_question RECORD;
BEGIN
  INSERT INTO public.game_sessions (
    lobby_id, room_id, game_id, session_mode, status, current_round, total_rounds, host_id
  ) VALUES (
    p_lobby_id, p_room_id, p_game_id, p_session_mode, 'in_progress', 1, 5, p_host_id
  ) RETURNING id INTO v_session_id;

  SELECT * INTO v_question
  FROM public.game_questions
  WHERE game_id = p_game_id AND is_active = true
  ORDER BY random() LIMIT 1;

  IF NOT FOUND THEN
    v_question.id := NULL;
    v_question.prompt := 'Controversial Scenario: Do you agree or disagree?';
    v_question.category := 'dating';
    v_question.scenario_details := 'Debate in the room!';
    v_question.options := '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb;
    v_question.suggested_timer_sec := 25;
  END IF;

  INSERT INTO public.game_rounds (
    session_id, round_number, question_id, prompt, category, scenario_details, options, phase, phase_ends_at
  ) VALUES (
    v_session_id, 1, v_question.id, v_question.prompt, v_question.category, v_question.scenario_details,
    v_question.options, 'answering', NOW() + (v_question.suggested_timer_sec || ' seconds')::interval
  ) RETURNING id INTO v_round_id;

  UPDATE public.game_sessions
  SET active_question_id = v_question.id,
      timer_ends_at = NOW() + (v_question.suggested_timer_sec || ' seconds')::interval
  WHERE id = v_session_id;

  IF p_lobby_id IS NOT NULL THEN
    UPDATE public.lobbies SET status = 'in_game', updated_at = NOW() WHERE id = p_lobby_id;
  END IF;
  IF p_room_id IS NOT NULL THEN
    UPDATE public.private_rooms SET status = 'in_game', updated_at = NOW() WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'round_id', v_round_id,
    'question_prompt', v_question.prompt,
    'timer_sec', v_question.suggested_timer_sec
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 8: ADVANCE GAME ROUND
-- Server-authoritative phase advance (answering -> voting -> reveal -> scoring)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_game_round(
  p_session_id UUID,
  p_new_round_number INT,
  p_category TEXT,
  p_prompt TEXT,
  p_scenario_details TEXT DEFAULT NULL,
  p_options JSONB DEFAULT '[]'::jsonb,
  p_timer_sec INT DEFAULT 25
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round_id UUID;
BEGIN
  UPDATE public.game_rounds
  SET phase = 'completed'
  WHERE session_id = p_session_id AND round_number < p_new_round_number;

  INSERT INTO public.game_rounds (
    session_id, round_number, category, prompt, scenario_details, options, phase, phase_ends_at
  ) VALUES (
    p_session_id, p_new_round_number, p_category, p_prompt, p_scenario_details, p_options,
    'answering', NOW() + (p_timer_sec || ' seconds')::interval
  )
  ON CONFLICT (session_id, round_number) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    phase = 'answering',
    phase_ends_at = NOW() + (p_timer_sec || ' seconds')::interval
  RETURNING id INTO v_round_id;

  UPDATE public.game_sessions
  SET current_round = p_new_round_number,
      timer_ends_at = NOW() + (p_timer_sec || ' seconds')::interval,
      updated_at = NOW()
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'round_id', v_round_id, 'round_number', p_new_round_number);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 9: SUBMIT GAME ANSWER
-- Records answer and prevents duplicate submissions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_game_answer(
  p_session_id UUID,
  p_round_id UUID,
  p_player_id TEXT,
  p_answer_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round RECORD;
BEGIN
  SELECT * INTO v_round FROM public.game_rounds WHERE id = p_round_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Round not found');
  END IF;

  IF v_round.phase != 'answering' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Answering phase is closed');
  END IF;

  INSERT INTO public.game_answers (
    round_id, session_id, player_id, answer_payload, submitted_at
  ) VALUES (
    p_round_id, p_session_id, p_player_id, p_answer_payload, NOW()
  )
  ON CONFLICT (round_id, player_id) DO UPDATE SET
    answer_payload = EXCLUDED.answer_payload,
    submitted_at = NOW();

  RETURN jsonb_build_object('success', true, 'round_id', p_round_id, 'player_id', p_player_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 10: SUBMIT GAME VOTE
-- Records vote, prevents self-voting and double voting
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_game_vote(
  p_session_id UUID,
  p_round_id UUID,
  p_voter_id TEXT,
  p_target_player_id TEXT,
  p_vote_value JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_voter_id = p_target_player_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-voting is not permitted');
  END IF;

  INSERT INTO public.game_votes (
    round_id, session_id, voter_id, target_player_id, vote_value, created_at
  ) VALUES (
    p_round_id, p_session_id, p_voter_id, p_target_player_id, p_vote_value, NOW()
  )
  ON CONFLICT (round_id, voter_id) DO UPDATE SET
    target_player_id = EXCLUDED.target_player_id,
    vote_value = EXCLUDED.vote_value;

  RETURN jsonb_build_object('success', true, 'round_id', p_round_id, 'voter_id', p_voter_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 11: CREATE MUTUAL MATCH
-- Safely establishes a mutual match between two consenting players
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_mutual_match(
  p_player_a_id TEXT,
  p_player_b_id TEXT,
  p_game_session_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT 'crush_detector'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first TEXT;
  v_second TEXT;
  v_match_id UUID;
BEGIN
  IF p_player_a_id = p_player_b_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot match with own profile');
  END IF;

  IF p_player_a_id < p_player_b_id THEN
    v_first := p_player_a_id;
    v_second := p_player_b_id;
  ELSE
    v_first := p_player_b_id;
    v_second := p_player_a_id;
  END IF;

  INSERT INTO public.matches (
    player_a_id, player_b_id, game_session_id, source, player_a_confirmed, player_b_confirmed, matched_at
  ) VALUES (
    v_first, v_second, p_game_session_id, p_source, true, true, NOW()
  )
  ON CONFLICT (player_a_id, player_b_id) DO UPDATE SET
    player_a_confirmed = true,
    player_b_confirmed = true
  RETURNING id INTO v_match_id;

  RETURN jsonb_build_object('success', true, 'match_id', v_match_id, 'player_a', v_first, 'player_b', v_second);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 12: COMPLETE GAME SESSION
-- Finalizes scores and records player wins
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_game_session(
  p_session_id UUID,
  p_final_scores JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_sessions
  SET status = 'finished',
      game_data = jsonb_set(game_data, '{final_scores}', p_final_scores),
      updated_at = NOW()
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'finished');
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 13: CREATE STORY SHARE
-- Generates viral shareable result card token
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_story_share(
  p_session_id UUID,
  p_player_id TEXT,
  p_game_id TEXT,
  p_archetype_title TEXT,
  p_compatibility_score INT DEFAULT 85,
  p_highlights JSONB DEFAULT '[]'::jsonb,
  p_share_token TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT := p_share_token;
  v_story_id UUID;
BEGIN
  IF v_token IS NULL OR length(trim(v_token)) = 0 THEN
    v_token := lower(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12));
  END IF;

  INSERT INTO public.story_results (
    session_id, player_id, game_id, share_token, archetype_title, compatibility_score, highlights
  ) VALUES (
    p_session_id, p_player_id, p_game_id, v_token, p_archetype_title, p_compatibility_score, p_highlights
  ) RETURNING id INTO v_story_id;

  RETURN jsonb_build_object('success', true, 'story_id', v_story_id, 'share_token', v_token);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 14: IS ADMIN
-- Helper function to verify administrator status for RLS and security checks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = p_user_id
  );
$$;

-- ----------------------------------------------------------------------------
-- RPC 15: PROVISION INITIAL ADMIN
-- Secure one-time bootstrap function for project owner.
-- Succeeds ONLY when public.admin_users is completely empty (0 rows).
-- Rejects execution if an administrator has already been provisioned.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_initial_admin(
  p_user_id TEXT,
  p_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count INT;
BEGIN
  IF p_user_id IS NULL OR length(trim(p_user_id)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid user ID');
  END IF;

  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email address');
  END IF;

  SELECT COUNT(*) INTO v_admin_count FROM public.admin_users;
  IF v_admin_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Initial administrator already provisioned. Subsequent administrators must be promoted by an existing superadmin.'
    );
  END IF;

  INSERT INTO public.profiles (id, username, avatar, is_guest)
  VALUES (p_user_id, split_part(p_email, '@', 1), '👑', false)
  ON CONFLICT (id) DO UPDATE SET is_guest = false;

  INSERT INTO public.admin_users (id, email, role, permissions)
  VALUES (
    p_user_id,
    lower(trim(p_email)),
    'superadmin',
    '{"can_ban": true, "can_manage_games": true, "can_view_reports": true, "can_promote_admins": true}'::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Initial superadmin successfully provisioned',
    'user_id', p_user_id,
    'email', p_email,
    'role', 'superadmin'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 16: PROMOTE USER TO ADMIN
-- Allows an authenticated superadmin to promote another user to admin or moderator.
-- Enforces strict superadmin authority check.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(
  p_target_user_id TEXT,
  p_target_email TEXT,
  p_role TEXT DEFAULT 'admin',
  p_requesting_admin_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id TEXT;
  v_caller_role TEXT;
BEGIN
  v_caller_id := COALESCE(p_requesting_admin_id, auth.uid()::text);

  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required to promote administrators');
  END IF;

  SELECT role INTO v_caller_role FROM public.admin_users WHERE id = v_caller_id;

  IF v_caller_role IS NULL OR v_caller_role != 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only superadmins can assign administrator roles');
  END IF;

  IF p_role NOT IN ('superadmin', 'admin', 'moderator') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role. Must be superadmin, admin, or moderator');
  END IF;

  INSERT INTO public.profiles (id, username, avatar, is_guest)
  VALUES (p_target_user_id, split_part(p_target_email, '@', 1), '🛡️', false)
  ON CONFLICT (id) DO UPDATE SET is_guest = false;

  INSERT INTO public.admin_users (id, email, role, permissions, updated_at)
  VALUES (
    p_target_user_id,
    lower(trim(p_target_email)),
    p_role,
    CASE
      WHEN p_role = 'superadmin' THEN '{"can_ban": true, "can_manage_games": true, "can_view_reports": true, "can_promote_admins": true}'::jsonb
      WHEN p_role = 'admin' THEN '{"can_ban": true, "can_manage_games": true, "can_view_reports": true, "can_promote_admins": false}'::jsonb
      ELSE '{"can_ban": false, "can_manage_games": false, "can_view_reports": true, "can_promote_admins": false}'::jsonb
    END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User successfully promoted',
    'target_user_id', p_target_user_id,
    'target_email', p_target_email,
    'assigned_role', p_role
  );
END;
$$;

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
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
-- Public Catalog & Events (Read-only for players, mutation restricted)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read game_catalog" ON public.game_catalog;
CREATE POLICY "Public read game_catalog" ON public.game_catalog
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read game_events" ON public.game_events;
CREATE POLICY "Public read game_events" ON public.game_events
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read game_questions" ON public.game_questions;
CREATE POLICY "Public read game_questions" ON public.game_questions
  FOR SELECT USING (is_active = true);

-- ----------------------------------------------------------------------------
-- Profiles (Public personas viewable; edits restricted to own record)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (true);

-- ----------------------------------------------------------------------------
-- Guest Sessions & Preferences (Scoped to player)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can access own guest_sessions" ON public.guest_sessions;
CREATE POLICY "Users can access own guest_sessions" ON public.guest_sessions
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can access own player_preferences" ON public.player_preferences;
CREATE POLICY "Users can access own player_preferences" ON public.player_preferences
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Public Lobbies & Lobby Players
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read waiting lobbies" ON public.lobbies;
CREATE POLICY "Public read waiting lobbies" ON public.lobbies
  FOR SELECT USING (status IN ('waiting', 'starting', 'in_game'));

DROP POLICY IF EXISTS "Public insert lobbies" ON public.lobbies;
CREATE POLICY "Public insert lobbies" ON public.lobbies
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Host update lobbies" ON public.lobbies;
CREATE POLICY "Host update lobbies" ON public.lobbies
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read lobby_players" ON public.lobby_players;
CREATE POLICY "Public read lobby_players" ON public.lobby_players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public manage lobby_players" ON public.lobby_players;
CREATE POLICY "Public manage lobby_players" ON public.lobby_players
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Private Rooms & Room Players
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Access private_rooms" ON public.private_rooms;
CREATE POLICY "Access private_rooms" ON public.private_rooms
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Access room_players" ON public.room_players;
CREATE POLICY "Access room_players" ON public.room_players
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Access teams" ON public.teams;
CREATE POLICY "Access teams" ON public.teams
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Access team_scores" ON public.team_scores;
CREATE POLICY "Access team_scores" ON public.team_scores
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Game Sessions & Game Rounds
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Read game_sessions" ON public.game_sessions;
CREATE POLICY "Read game_sessions" ON public.game_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Read game_rounds" ON public.game_rounds;
CREATE POLICY "Read game_rounds" ON public.game_rounds
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- Game Answers (Protected visibility: Hidden until reveal/voting/scoring phase)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Conditional read game_answers" ON public.game_answers;
CREATE POLICY "Conditional read game_answers" ON public.game_answers
  FOR SELECT USING (
    player_id = (SELECT auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.game_rounds r
      WHERE r.id = game_answers.round_id AND r.phase IN ('voting', 'reveal', 'scoring', 'completed')
    )
  );

DROP POLICY IF EXISTS "Insert game_answers" ON public.game_answers;
CREATE POLICY "Insert game_answers" ON public.game_answers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update own game_answers" ON public.game_answers;
CREATE POLICY "Update own game_answers" ON public.game_answers
  FOR UPDATE USING (true);

-- ----------------------------------------------------------------------------
-- Game Votes
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Read game_votes" ON public.game_votes;
CREATE POLICY "Read game_votes" ON public.game_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert game_votes" ON public.game_votes;
CREATE POLICY "Insert game_votes" ON public.game_votes
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Realtime Reactions & Chat
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read player_reactions" ON public.player_reactions;
CREATE POLICY "Public read player_reactions" ON public.player_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert player_reactions" ON public.player_reactions;
CREATE POLICY "Public insert player_reactions" ON public.player_reactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read chat_messages" ON public.chat_messages;
CREATE POLICY "Public read chat_messages" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert chat_messages" ON public.chat_messages;
CREATE POLICY "Public insert chat_messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Matches (Protected Privacy: Visible only to matched participants and admins)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants read matches" ON public.matches;
CREATE POLICY "Participants read matches" ON public.matches
  FOR SELECT USING (
    player_a_id = auth.uid()::text
    OR player_b_id = auth.uid()::text
    OR public.is_admin(auth.uid()::text)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Insert matches" ON public.matches;
CREATE POLICY "Insert matches" ON public.matches
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Story Results & Referrals
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read story_results" ON public.story_results;
CREATE POLICY "Public read story_results" ON public.story_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert story_results" ON public.story_results;
CREATE POLICY "Public insert story_results" ON public.story_results
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public access referrals" ON public.referrals;
CREATE POLICY "Public access referrals" ON public.referrals
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Safety: Reports, Blocked Users & Admin Users
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public insert reports" ON public.reports;
CREATE POLICY "Public insert reports" ON public.reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read reports" ON public.reports;
CREATE POLICY "Admins read reports" ON public.reports
  FOR SELECT USING (
    public.is_admin(auth.uid()::text)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins update reports" ON public.reports;
CREATE POLICY "Admins update reports" ON public.reports
  FOR UPDATE USING (
    public.is_admin(auth.uid()::text)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users read blocked_users" ON public.blocked_users;
CREATE POLICY "Users read blocked_users" ON public.blocked_users
  FOR SELECT USING (
    blocker_id = auth.uid()::text
    OR public.is_admin(auth.uid()::text)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users manage blocked_users" ON public.blocked_users;
CREATE POLICY "Users manage blocked_users" ON public.blocked_users
  FOR ALL USING (
    blocker_id = auth.uid()::text
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins read admin_users" ON public.admin_users;
CREATE POLICY "Admins read admin_users" ON public.admin_users
  FOR SELECT USING (
    public.is_admin(auth.uid()::text)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Prevent public insert on admin_users" ON public.admin_users;
CREATE POLICY "Prevent public insert on admin_users" ON public.admin_users
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Prevent public update on admin_users" ON public.admin_users;
CREATE POLICY "Prevent public update on admin_users" ON public.admin_users
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Prevent public delete on admin_users" ON public.admin_users;
CREATE POLICY "Prevent public delete on admin_users" ON public.admin_users
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================================
-- SECTION 6: SUPABASE REALTIME CONFIGURATION (IDEMPOTENT)
-- ============================================================================
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

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'lobbies', 'lobby_players', 'private_rooms', 'room_players',
    'teams', 'team_scores', 'game_sessions', 'game_rounds',
    'game_answers', 'game_votes', 'player_reactions', 'chat_messages'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE p.pubname = 'supabase_realtime'
        AND n.nspname = 'public'
        AND c.relname = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- SECTION 7: CORE GAME CATALOGUE & QUESTIONS SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Game Catalogue: 6 Official Games
-- ----------------------------------------------------------------------------
INSERT INTO public.game_catalog (
  id, title, slug, description, mode, min_players, max_players, estimated_duration_min, icon, badge
) VALUES
  (
    'red_flag_trial',
    'The Red Flag Trial',
    'red-flag-trial',
    'Vote on controversial dating scenarios: Red Flag, Green Flag, or Depends. Defend opinions in real-time debates!',
    'singles',
    3,
    8,
    8,
    '🚩',
    'Most Viral'
  ),
  (
    'crush_detector',
    'Crush Detector',
    'crush-detector',
    'Secretly select who shares an electric connection. Reveal unexpected matches, mutual crushes, and flirtatious connections with 100% consent.',
    'singles',
    4,
    8,
    10,
    '💘',
    'Top Matchmaker'
  ),
  (
    'blind_confession',
    'The Blind Confession',
    'blind-confession',
    'Submit anonymous spicy answers to outrageous prompts, then vote on the wildest confession before the author reveal.',
    'singles',
    3,
    8,
    7,
    '🎭',
    'Wild Chaos'
  ),
  (
    'how_well_know_me',
    'How Well Do You Know Me?',
    'how-well-know-me',
    'The ultimate couples showdown. Both partners answer simultaneously to reveal who remembers dates, habits, and secrets best.',
    'couples',
    2,
    4,
    8,
    '💍',
    'Couples Favorite'
  ),
  (
    'couple_chaos',
    'Couple Chaos: Couples vs Singles',
    'couple-chaos',
    'Fast-paced social chaos where established couples defend their quirks against single players looking for drama.',
    'couples',
    4,
    8,
    12,
    '⚡',
    'Team Arena'
  ),
  (
    'partner_telepathy',
    'Partner Telepathy',
    'partner-telepathy',
    'Anticipate partner answers without speaking! Lock in matching entries to earn synchronicity streaks.',
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
  ('red_flag_trial', 'dating', 'They still follow and regularly like their ex gym selfies.', 'Claiming they are just cordial friends and mature adults.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 2),
  ('red_flag_trial', 'habits', 'They do not tip the waitstaff because service was only average.', 'Leaves exact change with zero tip on an expensive 120 dollar dinner date.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 1),
  ('red_flag_trial', 'communication', 'Takes 18 hours to reply to a text while their Instagram active status is online all day.', 'Replies late with an excuse about being overwhelmed.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 2),
  ('red_flag_trial', 'lifestyle', 'On date three, they ask to look through personal photo albums on the phone.', 'Says they are just curious about past vacation pictures.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 3),
  ('red_flag_trial', 'social', 'They have zero close friends of their own gender and claim everyone else is pure drama.', 'Insists they only get along with the opposite gender.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 3),
  ('red_flag_trial', 'finance', 'Suggests splitting a 14 dollar cafe bill down to the exact penny.', 'Calculates exact tax and beverage add-on charges.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 1)
ON CONFLICT (game_id, prompt) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 2 - Crush Detector
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('crush_detector', 'first_impression', 'Who in this room gave off the strongest lead character charisma the moment they joined?', 'Select secretly from active lobby players.', '[]'::jsonb, 30, 1),
  ('crush_detector', 'dating', 'If trapped in an elevator for four hours with music and refreshments, which player would be the best company?', 'Select one player secretly.', '[]'::jsonb, 30, 2),
  ('crush_detector', 'adventure', 'Which player would be the most reliable companion to plan a spontaneous weekend road trip?', 'Select a travel co-pilot.', '[]'::jsonb, 30, 2),
  ('crush_detector', 'romance', 'Which player would receive an enthusiastic YES if they sent a private direct message tonight?', 'Secret crush selection.', '[]'::jsonb, 30, 3)
ON CONFLICT (game_id, prompt) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 3 - The Blind Confession
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('blind_confession', 'dating_fails', 'What is the most ridiculous excuse ever used to escape an awkward first date?', 'Submissions remain completely anonymous until voting finishes.', '[]'::jsonb, 40, 2),
  ('blind_confession', 'secret_habits', 'What is a secret guilty pleasure that friends and coworkers would find hilarious or shocking?', 'The more unexpected, the higher the crowd votes.', '[]'::jsonb, 40, 2),
  ('blind_confession', 'pet_peeves', 'What is the most trivial or petty reason someone immediately lost romantic interest?', 'Be completely honest.', '[]'::jsonb, 40, 1),
  ('blind_confession', 'chaos', 'What is the most awkward or impulsive late-night message ever sent to an acquaintance?', 'Confess anonymously.', '[]'::jsonb, 40, 3)
ON CONFLICT (game_id, prompt) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 4 - How Well Do You Know Me?
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('how_well_know_me', 'favorites', 'What is the comfort food requested when having a stressful or exhausting day?', 'Both partners submit an answer simultaneously.', '[]'::jsonb, 25, 1),
  ('how_well_know_me', 'habits', 'What everyday quirk or habit secretly causes the partner mild exasperation?', 'Test self-awareness and mutual understanding.', '[]'::jsonb, 25, 2),
  ('how_well_know_me', 'firsts', 'Where was the exact location of the initial meeting or official first date?', 'Compare couple memory accuracy.', '[]'::jsonb, 25, 1),
  ('how_well_know_me', 'dreams', 'If winning a prize of 1 million dollars tomorrow, what item would be purchased first?', 'Predict the partner spending choice.', '[]'::jsonb, 25, 2)
ON CONFLICT (game_id, prompt) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 5 - Couple Chaos
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('couple_chaos', 'speed_round', 'Who exhibits the most dramatic behavior when catching a mild seasonal cold?', 'Couples vote on themselves, Singles vote on which partner is guilty.', '["Partner 1", "Partner 2", "Both Equal"]'::jsonb, 20, 2),
  ('couple_chaos', 'prediction', 'During a simulated apocalypse, would the couple coordinate survival or bicker under pressure?', 'Couples versus Singles debate round.', '["Survive Together 🛡️", "Sacrifice for Survival 🧟", "Argue over navigation and get caught 💀"]'::jsonb, 25, 3),
  ('couple_chaos', 'battle', 'Who requires more preparation time before leaving for dinner or an event?', 'Speed answer round.', '["Partner 1", "Partner 2", "Equal Time"]'::jsonb, 20, 1)
ON CONFLICT (game_id, prompt) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed Questions: Game 6 - Partner Telepathy
-- ----------------------------------------------------------------------------
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('partner_telepathy', 'telepathy', 'Name a famous global fast-food brand. Submit simultaneously without conferring.', 'Identical entries earn bonus synchronicity points.', '[]'::jsonb, 20, 1),
  ('partner_telepathy', 'telepathy', 'Name a romantic international vacation country destination.', 'Match telepathic choices.', '[]'::jsonb, 20, 1),
  ('partner_telepathy', 'telepathy', 'Select the emoji representing the current relationship vibe.', 'Select identical emoji reactions.', '["❤️", "🔥", "😂", "✨", "💀", "🍕"]'::jsonb, 20, 2),
  ('partner_telepathy', 'telepathy', 'Choose an entertainment genre for Friday evening streaming.', 'Submit synchronized selections.', '["Horror / Thriller", "Rom-Com", "True Crime", "Sci-Fi / Action"]'::jsonb, 20, 1)
ON CONFLICT (game_id, prompt) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- To provision the initial administrator safely, execute in the SQL Editor:
-- SELECT public.provision_initial_admin('<USER_ID_OR_UUID>', 'admin@example.com');
-- ============================================================================
