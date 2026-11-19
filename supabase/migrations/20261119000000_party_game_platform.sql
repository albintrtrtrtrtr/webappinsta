-- ============================================================================
-- SUPABASE MIGRATION: REAL-TIME MULTIPLAYER SOCIAL PARTY & DATING PLATFORM
-- Project Ref: vgcmqzcsmndjkclbkjok
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles & Guest Sessions
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- can be Supabase auth uuid or guest session id
  username TEXT NOT NULL,
  gender TEXT,
  avatar TEXT NOT NULL DEFAULT '⚡',
  bio TEXT,
  age_verified BOOLEAN DEFAULT TRUE,
  is_guest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT,
  nickname TEXT NOT NULL,
  gender TEXT,
  avatar TEXT NOT NULL DEFAULT '⚡',
  interests TEXT[] DEFAULT '{}',
  match_preference TEXT DEFAULT 'everyone',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_preferences (
  player_id TEXT PRIMARY KEY,
  interests TEXT[] DEFAULT '{}',
  match_preference TEXT DEFAULT 'everyone', -- 'singles', 'couples', 'everyone'
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptics_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Game Catalog & Events
CREATE TABLE IF NOT EXISTS public.game_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'singles', 'couples', 'party', 'chaos'
  min_players INT NOT NULL DEFAULT 3,
  max_players INT NOT NULL DEFAULT 8,
  estimated_minutes INT NOT NULL DEFAULT 10,
  icon TEXT NOT NULL DEFAULT '🎮',
  badge TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'weekly_drop', 'double_xp', 'weekend_party'
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  badge TEXT,
  game_id TEXT REFERENCES public.game_catalog(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Game Questions & Scenarios
CREATE TABLE IF NOT EXISTS public.game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  prompt TEXT NOT NULL,
  scenario_details TEXT,
  options JSONB DEFAULT '[]'::jsonb, -- e.g. ["Red Flag", "Green Flag", "Depends"]
  suggested_timer_sec INT DEFAULT 30,
  intensity_level INT DEFAULT 1, -- 1: Mild, 2: Spicy, 3: Wild
  author TEXT DEFAULT 'Platform',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Public Lobbies & Players (Singles Matchmaking)
CREATE TABLE IF NOT EXISTS public.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL DEFAULT 'Singles Party Lounge',
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'starting', 'in_game', 'finished'
  game_id TEXT REFERENCES public.game_catalog(id),
  min_players INT NOT NULL DEFAULT 4,
  max_players INT NOT NULL DEFAULT 8,
  current_players_count INT NOT NULL DEFAULT 0,
  host_id TEXT,
  auto_start_timer_sec INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lobby_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  interests TEXT[] DEFAULT '{}',
  is_ready BOOLEAN DEFAULT TRUE,
  is_host BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'afk', 'disconnected'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lobby_id, player_id)
);

-- 5. Private Rooms & Teams (Couples Arena)
CREATE TABLE IF NOT EXISTS public.private_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Couples Battle Room',
  mode TEXT NOT NULL DEFAULT 'couples_vs_couples', -- 'couples_vs_couples', 'couples_vs_singles', 'partner_challenge'
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_game', 'completed'
  game_id TEXT REFERENCES public.game_catalog(id),
  host_player_id TEXT NOT NULL,
  max_couples INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_type TEXT NOT NULL DEFAULT 'couple', -- 'couple', 'singles_squad'
  avatar TEXT DEFAULT '💖',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  player_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  role TEXT DEFAULT 'player', -- 'partner_1', 'partner_2', 'single_contender', 'spectator'
  partner_player_id TEXT,
  is_host BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.team_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  telepathy_matches INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, team_id)
);

-- 6. Live Game Sessions & Rounds
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.private_rooms(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL REFERENCES public.game_catalog(id),
  mode TEXT NOT NULL DEFAULT 'singles', -- 'singles', 'couples'
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'calculating', 'results', 'completed'
  total_rounds INT NOT NULL DEFAULT 3,
  current_round INT NOT NULL DEFAULT 1,
  active_question_id UUID REFERENCES public.game_questions(id),
  timer_ends_at TIMESTAMPTZ,
  active_surprise_event TEXT, -- e.g. 'sudden_death', 'double_score', 'reverse_round'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  question_id UUID REFERENCES public.game_questions(id),
  round_type TEXT DEFAULT 'standard', -- 'standard', 'vote_reveal', 'speed_bluff', 'telepathy'
  phase TEXT NOT NULL DEFAULT 'answering', -- 'answering', 'voting', 'reveal', 'scoring'
  timer_duration_sec INT NOT NULL DEFAULT 30,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Game Answers & Votes
CREATE TABLE IF NOT EXISTS public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  answer_text TEXT,
  selected_option TEXT,
  target_player_id TEXT, -- for Crush Detector or partner prediction
  is_bluff BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.game_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  voter_player_id TEXT NOT NULL,
  target_answer_id UUID REFERENCES public.game_answers(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'agree', -- 'agree', 'funniest', 'relatable', 'unexpected', 'red_flag', 'green_flag', 'crush'
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, voter_player_id)
);

-- 8. Realtime Reactions & Power-ups
CREATE TABLE IF NOT EXISTS public.player_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL DEFAULT 'Guest',
  emoji TEXT NOT NULL, -- 😂 ❤️ 🔥 👀 💀 😭 👏
  target_id TEXT, -- target player id or answer id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  power_up_type TEXT NOT NULL, -- 'double_points', 'anonymous_vote', 'reveal_hint', 'reverse_round', 'second_chance', 'chaos_vote'
  is_used BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ
);

-- 9. Matches (Consent-based Dating Feature)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  player_a_id TEXT NOT NULL,
  player_b_id TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'crush_mutual', -- 'crush_mutual', 'high_compatibility', 'telepathy_champs'
  compatibility_score INT DEFAULT 0,
  revealed_to_both BOOLEAN DEFAULT TRUE,
  consent_a BOOLEAN DEFAULT TRUE,
  consent_b BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.private_rooms(id) ON DELETE CASCADE,
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '⚡',
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Instagram Story Results & Sharable Reports
CREATE TABLE IF NOT EXISTS public.story_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL, -- 'compatibility_report', 'chaos_award', 'couple_report', 'leaderboard_legend'
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_avatar TEXT NOT NULL DEFAULT '⚡',
  partner_name TEXT,
  partner_avatar TEXT,
  score INT NOT NULL DEFAULT 0,
  superlative TEXT NOT NULL, -- e.g. "Certified Green Flag Magnet", "Chaos Instigator", "Telepathic Soulmates"
  metrics JSONB DEFAULT '{}'::jsonb,
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Viral Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL,
  referred_player_id TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  reward_unlocked TEXT DEFAULT 'vip_avatar_unlocked',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_player_id)
);

-- 13. Safety, Reports & Moderation
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL,
  reported_player_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  session_id UUID,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Indexes for high performance realtime queries
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON public.lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON public.lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_private_rooms_code ON public.private_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_round ON public.game_answers(round_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_round ON public.game_votes(round_id);
CREATE INDEX IF NOT EXISTS idx_player_reactions_session ON public.player_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);

-- 15. Enable Row Level Security (RLS)
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
ALTER TABLE public.power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 16. Row Level Security Policies (Allowing guest/anon and authenticated users)
CREATE POLICY "Public read game_catalog" ON public.game_catalog FOR SELECT USING (true);
CREATE POLICY "Public read game_events" ON public.game_events FOR SELECT USING (true);
CREATE POLICY "Public read game_questions" ON public.game_questions FOR SELECT USING (true);

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public read guest_sessions" ON public.guest_sessions FOR SELECT USING (true);
CREATE POLICY "Public upsert guest_sessions" ON public.guest_sessions FOR ALL USING (true);

CREATE POLICY "Public read preferences" ON public.player_preferences FOR SELECT USING (true);
CREATE POLICY "Public upsert preferences" ON public.player_preferences FOR ALL USING (true);

CREATE POLICY "Public access lobbies" ON public.lobbies FOR ALL USING (true);
CREATE POLICY "Public access lobby_players" ON public.lobby_players FOR ALL USING (true);

CREATE POLICY "Public access private_rooms" ON public.private_rooms FOR ALL USING (true);
CREATE POLICY "Public access teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Public access room_players" ON public.room_players FOR ALL USING (true);
CREATE POLICY "Public access team_scores" ON public.team_scores FOR ALL USING (true);

CREATE POLICY "Public access game_sessions" ON public.game_sessions FOR ALL USING (true);
CREATE POLICY "Public access game_rounds" ON public.game_rounds FOR ALL USING (true);
CREATE POLICY "Public access game_answers" ON public.game_answers FOR ALL USING (true);
CREATE POLICY "Public access game_votes" ON public.game_votes FOR ALL USING (true);
CREATE POLICY "Public access player_reactions" ON public.player_reactions FOR ALL USING (true);
CREATE POLICY "Public access power_ups" ON public.power_ups FOR ALL USING (true);
CREATE POLICY "Public access matches" ON public.matches FOR ALL USING (true);
CREATE POLICY "Public access chat_messages" ON public.chat_messages FOR ALL USING (true);
CREATE POLICY "Public access story_results" ON public.story_results FOR ALL USING (true);
CREATE POLICY "Public access referrals" ON public.referrals FOR ALL USING (true);
CREATE POLICY "Public insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Public access blocked_users" ON public.blocked_users FOR ALL USING (true);
CREATE POLICY "Public read admin_users" ON public.admin_users FOR SELECT USING (true);

-- 17. Supabase Realtime Publication configuration
-- Adds tables to the realtime publication so live changes trigger websockets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

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

-- 18. Authoritative Game Functions & RPCs

-- Atomic Lobby Join
CREATE OR REPLACE FUNCTION public.join_lobby_atomic(
  p_lobby_id UUID,
  p_player_id TEXT,
  p_nickname TEXT,
  p_avatar TEXT,
  p_interests TEXT[]
) RETURNS JSONB AS $$
DECLARE
  v_lobby RECORD;
  v_count INT;
BEGIN
  SELECT * INTO v_lobby FROM public.lobbies WHERE id = p_lobby_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lobby not found');
  END IF;

  IF v_lobby.status = 'in_game' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game already in progress');
  END IF;

  INSERT INTO public.lobby_players (lobby_id, player_id, nickname, avatar, interests, is_ready, status)
  VALUES (p_lobby_id, p_player_id, p_nickname, p_avatar, p_interests, true, 'active')
  ON CONFLICT (lobby_id, player_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    interests = EXCLUDED.interests,
    status = 'active',
    last_heartbeat = NOW();

  SELECT COUNT(*) INTO v_count FROM public.lobby_players WHERE lobby_id = p_lobby_id AND status = 'active';
  UPDATE public.lobbies SET current_players_count = v_count, updated_at = NOW() WHERE id = p_lobby_id;

  RETURN jsonb_build_object('success', true, 'player_count', v_count, 'lobby_id', p_lobby_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Lobby Leave
CREATE OR REPLACE FUNCTION public.leave_lobby_atomic(
  p_lobby_id UUID,
  p_player_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM public.lobby_players WHERE lobby_id = p_lobby_id AND player_id = p_player_id;
  SELECT COUNT(*) INTO v_count FROM public.lobby_players WHERE lobby_id = p_lobby_id AND status = 'active';
  UPDATE public.lobbies SET current_players_count = v_count, updated_at = NOW() WHERE id = p_lobby_id;

  RETURN jsonb_build_object('success', true, 'remaining_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Seed Data: Games Catalog (6 Core Games)
INSERT INTO public.game_catalog (id, title, slug, description, category, min_players, max_players, estimated_minutes, icon, badge)
VALUES
  (
    'red_flag_trial',
    'The Red Flag Trial',
    'red-flag-trial',
    'Vote on wildly controversial dating scenarios, uncover dealbreakers, and defend your standards in real-time debates.',
    'singles',
    3,
    8,
    8,
    '🚩',
    'Crowd Favorite'
  ),
  (
    'crush_detector',
    'Crush Detector',
    'crush-detector',
    'Secretly pick who catches your vibe. Reveal unexpected matches, mutual crushes, and flirtatious connections with 100% consent.',
    'singles',
    4,
    8,
    10,
    '💘',
    'Spicy Dating'
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
    'Social Chaos'
  ),
  (
    'how_well_know_me',
    'How Well Do You Know Me?',
    'how-well-know-me',
    'Partners test their knowledge of each other in simultaneous answer reveals. High scores or hilarious chaos guaranteed!',
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

-- 20. Seed Data: Questions for Core Games

-- Game 1: The Red Flag Trial
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('red_flag_trial', 'dating', 'They still follow and regularly like their ex''s gym selfies.', 'Claiming "we are just cordial friends and mature adults".', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 2),
  ('red_flag_trial', 'habits', 'They don''t tip the restaurant waitstaff because service was "just okay".', 'Leaves exact change with zero tip on a \$120 date.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 1),
  ('red_flag_trial', 'communication', 'Takes 18 hours to reply to a text but their Instagram active dot is green all day.', 'Then replies with "sorry so busy today!!"', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 2),
  ('red_flag_trial', 'lifestyle', 'On date three, they ask to look through your camera roll "just for fun".', 'Says they just love seeing vacation pictures.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 3),
  ('red_flag_trial', 'social', 'They have zero close friends of the same gender and claim "all girls/guys are drama".', 'States they only get along with the opposite sex.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 3),
  ('red_flag_trial', 'finance', 'Suggests splitting the \$14 boba tea bill down to the exact penny.', 'Calculates tax and boba pearl add-on fee.', '["Red Flag 🚩", "Green Flag 🟢", "Depends 🤔"]'::jsonb, 25, 1);

-- Game 2: Crush Detector
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('crush_detector', 'first_impression', 'Who in this room gave off the strongest "main character" energy the moment they joined?', 'Select secretly from active lobby players.', '[]'::jsonb, 30, 1),
  ('crush_detector', 'dating', 'If you were trapped in an elevator for 4 hours with drinks and music, who would you want it to be with?', 'Select one player secretly.', '[]'::jsonb, 30, 2),
  ('crush_detector', 'adventure', 'Who in this room would you trust to plan a secret spontaneous weekend road trip?', 'Pick your co-pilot.', '[]'::jsonb, 30, 2),
  ('crush_detector', 'romance', 'Who would you definitely say YES to if they slid into your DMs tonight?', 'Secret crush selection.', '[]'::jsonb, 30, 3);

-- Game 3: The Blind Confession
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('blind_confession', 'dating_fails', 'What is the most ridiculous lie you have ever told to escape a terrible first date?', 'Be totally honest - submissions are anonymous until voting finishes!', '[]'::jsonb, 45, 2),
  ('blind_confession', 'secret_habits', 'What is your most embarrassing guilty pleasure that would shock your friends?', 'The wilder, the higher the votes.', '[]'::jsonb, 45, 2),
  ('blind_confession', 'pet_peeves', 'What is the pettiest reason you immediately lost interest in someone you liked?', 'Don''t hold back.', '[]'::jsonb, 45, 1),
  ('blind_confession', 'chaos', 'What is the boldest or most cringe thing you did while drunk texting?', 'Confess your sins anonymously.', '[]'::jsonb, 45, 3);

-- Game 4: How Well Do You Know Me?
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('how_well_know_me', 'favorites', 'What is your partner''s absolute comfort food when they have had a miserable day?', 'Both write your answer simultaneously.', '[]'::jsonb, 30, 1),
  ('how_well_know_me', 'habits', 'What is one tiny habit of yours that secretly drives your partner crazy?', 'Let''s see if you are self-aware!', '[]'::jsonb, 30, 2),
  ('how_well_know_me', 'firsts', 'Where was the exact location of your first kiss or official first date?', 'Do your memories match?', '[]'::jsonb, 30, 1),
  ('how_well_know_me', 'dreams', 'If your partner won \$1,000,000 tomorrow, what is the very FIRST thing they would buy?', 'Predict their indulgence.', '[]'::jsonb, 30, 2);

-- Game 5: Couple Chaos
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('couple_chaos', 'speed_round', 'Who is the bigger drama queen when they catch a mild cold?', 'Couples vote on themselves, Singles vote on which couple is guilty!', '["Partner 1", "Partner 2", "Both Equal"]'::jsonb, 20, 2),
  ('couple_chaos', 'prediction', 'In a zombie apocalypse, would the couple survive together or sacrifice each other within 48 hours?', 'Couples vs Singles debate round.', '["Survive as Soulmates 🛡️", "Sacrifice for Survival 🧟", "Argue over directions and get caught 💀"]'::jsonb, 25, 2),
  ('couple_chaos', 'battle', 'Who takes longer to get ready before going out for dinner?', 'Speed answer round.', '["Partner 1", "Partner 2", "Neither"]'::jsonb, 20, 1);

-- Game 6: Partner Telepathy
INSERT INTO public.game_questions (game_id, category, prompt, scenario_details, options, suggested_timer_sec, intensity_level)
VALUES
  ('partner_telepathy', 'telepathy', 'Name a fast-food chain. Both write one word without looking at each other!', 'Identical words = 100 points!', '[]'::jsonb, 20, 1),
  ('partner_telepathy', 'telepathy', 'Name a romantic vacation destination country.', 'Match your minds!', '[]'::jsonb, 20, 1),
  ('partner_telepathy', 'telepathy', 'Pick an emoji that represents your current relationship vibe.', 'Lock in the identical emoji!', '["❤️", "🔥", "😂", "✨", "💀", "🍕"]'::jsonb, 20, 2),
  ('partner_telepathy', 'telepathy', 'Pick a Netflix genre for Friday night binge-watching.', 'Will you agree or disagree?', '["Horror / Thriller", "Rom-Com", "True Crime Documentary", "Sci-Fi / Action"]'::jsonb, 20, 1);
