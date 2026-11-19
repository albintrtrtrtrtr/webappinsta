export type GameCategory = 'singles' | 'couples' | 'party' | 'chaos';
export type LobbyStatus = 'waiting' | 'starting' | 'in_game' | 'finished';
export type RoomMode = 'couples_vs_couples' | 'couples_vs_singles' | 'partner_challenge';
export type GameSessionStatus = 'in_progress' | 'calculating' | 'results' | 'completed';
export type RoundPhase = 'answering' | 'voting' | 'reveal' | 'scoring';
export type EmojiReaction = '😂' | '❤️' | '🔥' | '👀' | '💀' | '😭' | '👏';

export interface Profile {
  id: string;
  username: string;
  gender?: string | null;
  avatar: string;
  bio?: string | null;
  age_verified: boolean;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestSession {
  id: string;
  device_id?: string;
  nickname: string;
  gender?: string | null;
  avatar: string;
  interests: string[];
  match_preference: string;
  created_at?: string;
  last_active_at?: string;
}

export interface GameCatalogItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: GameCategory;
  min_players: number;
  max_players: number;
  estimated_minutes: number;
  icon: string;
  badge?: string | null;
  is_active: boolean;
  rules?: string[];
}

export interface GameQuestion {
  id: string;
  game_id: string;
  category: string;
  prompt: string;
  scenario_details?: string | null;
  options: string[];
  suggested_timer_sec: number;
  intensity_level: number;
  author: string;
}

export interface Lobby {
  id: string;
  code?: string | null;
  title: string;
  status: LobbyStatus;
  game_id?: string | null;
  min_players: number;
  max_players: number;
  current_players_count: number;
  host_id?: string | null;
  auto_start_timer_sec?: number | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LobbyPlayer {
  id: string;
  lobby_id: string;
  player_id: string;
  nickname: string;
  avatar: string;
  interests: string[];
  is_ready: boolean;
  is_host: boolean;
  status: 'active' | 'afk' | 'disconnected';
  joined_at: string;
  last_heartbeat: string;
}

export interface PrivateRoom {
  id: string;
  room_code: string;
  title: string;
  mode: RoomMode;
  status: 'waiting' | 'in_game' | 'completed';
  game_id?: string | null;
  host_player_id: string;
  max_couples: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  room_id: string;
  team_name: string;
  team_type: 'couple' | 'singles_squad';
  avatar: string;
  created_at: string;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  team_id?: string | null;
  player_id: string;
  nickname: string;
  avatar: string;
  role: 'partner_1' | 'partner_2' | 'single_contender' | 'spectator';
  partner_player_id?: string | null;
  is_host: boolean;
  is_ready: boolean;
  joined_at: string;
}

export interface GameSession {
  id: string;
  lobby_id?: string | null;
  room_id?: string | null;
  game_id: string;
  mode: 'singles' | 'couples';
  status: GameSessionStatus;
  total_rounds: number;
  current_round: number;
  active_question_id?: string | null;
  timer_ends_at?: string | null;
  active_surprise_event?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameRound {
  id: string;
  session_id: string;
  round_number: number;
  question_id?: string | null;
  round_type: string;
  phase: RoundPhase;
  timer_duration_sec: number;
  ends_at?: string | null;
  created_at: string;
}

export interface GameAnswer {
  id: string;
  session_id: string;
  round_id: string;
  player_id: string;
  answer_text?: string | null;
  selected_option?: string | null;
  target_player_id?: string | null;
  is_bluff: boolean;
  is_anonymous: boolean;
  submitted_at: string;
}

export interface GameVote {
  id: string;
  session_id: string;
  round_id: string;
  voter_player_id: string;
  target_answer_id: string;
  vote_type: string;
  points_awarded: number;
  created_at: string;
}

export interface PlayerReaction {
  id: string;
  session_id: string;
  player_id: string;
  player_name: string;
  emoji: EmojiReaction;
  target_id?: string | null;
  created_at: string;
}

export interface StoryResult {
  id: string;
  template_type: 'compatibility_report' | 'chaos_award' | 'couple_report' | 'leaderboard_legend';
  player_id: string;
  player_name: string;
  player_avatar: string;
  partner_name?: string | null;
  partner_avatar?: string | null;
  score: number;
  superlative: string;
  metrics: Record<string, any>;
  share_token: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: number;
  badge: string;
  category: 'singles' | 'couples';
  winStreak: number;
}
