# Supabase Database Setup & Manual Execution Guide

This document provides step-by-step instructions for executing the complete PostgreSQL database setup for the **InstaGame** real-time multiplayer social party and dating platform.

---

## 1. Project Information

- **Supabase Project URL**: `https://vgcmqzcsmndjkclbkjok.supabase.co`
- **Project Reference**: `vgcmqzcsmndjkclbkjok`
- **Dashboard Direct Link**: [https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok](https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok)
- **SQL Editor Direct Link**: [https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok/sql/new](https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok/sql/new)

---

## 2. Step-by-Step Manual Execution in Supabase Dashboard

### Step 1: Open the Supabase Dashboard
1. Open your browser and navigate to:
   ```text
   https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok
   ```
2. Sign in to your Supabase account if prompted.

### Step 2: Navigate to the SQL Editor
1. In the left-hand navigation sidebar, look for the **SQL Editor** icon (`>_` code brackets).
2. Click on **SQL Editor**.

### Step 3: Open a New Query
1. Click the **"+ New Query"** button at the top of the SQL Editor view (or use the direct URL: [https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok/sql/new](https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok/sql/new)).
2. An empty query editor will appear.
3. Optionally rename the tab to `InstaGame Complete Setup`.

### Step 4: Copy and Execute `setup.sql`
1. Open the file `supabase/setup.sql` in your IDE or code editor.
2. Select the entire contents of `supabase/setup.sql` (`Ctrl+A` / `Cmd+A`) and copy it (`Ctrl+C` / `Cmd+C`).
3. Paste the SQL code into the Supabase query editor window (`Ctrl+V` / `Cmd+V`).
4. Click the green **"Run"** button in the lower-right corner (or press `Ctrl+Enter` / `Cmd+Enter`).
5. Wait for the query to execute. You should see a confirmation message:
   ```text
   Success. No rows returned
   ```
   *(or a list of affected rows)*.

---

## 3. How to Verify the Database Setup

### A. Verify Tables (24 Tables)
1. In the left-hand navigation sidebar, click on **Table Editor** (spreadsheet table icon).
2. Check that the `public` schema contains all **24 tables**:
   - `profiles`
   - `guest_sessions`
   - `player_preferences`
   - `game_catalog`
   - `game_events`
   - `game_questions`
   - `lobbies`
   - `lobby_players`
   - `private_rooms`
   - `teams`
   - `room_players`
   - `team_scores`
   - `game_sessions`
   - `game_rounds`
   - `game_answers`
   - `game_votes`
   - `player_reactions`
   - `matches`
   - `chat_messages`
   - `story_results`
   - `referrals`
   - `reports`
   - `blocked_users`
   - `admin_users`

3. Click on `game_catalog` and verify that the 6 core games are populated:
   - `red_flag_trial` (The Red Flag Trial)
   - `crush_detector` (Crush Detector)
   - `blind_confession` (The Blind Confession)
   - `how_well_know_me` (How Well Do You Know Me?)
   - `couple_chaos` (Couple Chaos)
   - `partner_telepathy` (Partner Telepathy)

### B. Verify Realtime Configuration
1. Go to **Database** -> **Replication** (or **Project Settings** -> **API** -> **Realtime**).
2. Check the `supabase_realtime` publication.
3. Verify that the following 12 tables have replication enabled:
   - `lobbies`
   - `lobby_players`
   - `private_rooms`
   - `room_players`
   - `teams`
   - `team_scores`
   - `game_sessions`
   - `game_rounds`
   - `game_answers`
   - `game_votes`
   - `player_reactions`
   - `chat_messages`

### C. Verify Database Functions (RPC)
1. In the left-hand navigation sidebar, click on **Database** -> **Functions**.
2. Confirm the presence of the 13 secure authoritative RPC functions:
   - `upsert_player_profile`
   - `create_public_lobby`
   - `join_lobby`
   - `leave_lobby`
   - `create_private_room`
   - `join_private_room`
   - `pair_room_partners`
   - `start_game_session`
   - `submit_game_answer`
   - `record_game_vote`
   - `advance_game_round`
   - `create_mutual_match`
   - `record_story_result`

---

## 4. Troubleshooting & FAQ

### Issue 1: "relation ... already exists"
- **Cause**: Some tables were previously created.
- **Solution**: The script uses `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT` clauses so it is non-destructive and safe to rerun.

### Issue 2: "publication 'supabase_realtime' does not exist"
- **Cause**: Supabase Realtime publication wasn't initialized yet.
- **Solution**: The script includes a safe conditional block:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END $$;
  ```
  This creates the publication automatically if missing.

### Issue 3: "permission denied for schema public"
- **Cause**: Executed under an unprivileged role.
- **Solution**: Ensure you are running the script in the **Supabase Dashboard SQL Editor** while signed in as the project owner / administrator (runs under the privileged `postgres` superuser role).

---

## 5. Summary of Schema Architecture

| Category | Components | Purpose |
| :--- | :--- | :--- |
| **Identity & Safety** | `profiles`, `guest_sessions`, `player_preferences`, `reports`, `blocked_users`, `admin_users` | Frictionless guest onboarding, 18+ age gating, user blocking, and reporting moderation. |
| **Catalog & Drops** | `game_catalog`, `game_events`, `game_questions` | Dynamic game definitions, themed drops, 2x score multipliers, and multi-tier spicy questions. |
| **Singles Matchmaking** | `lobbies`, `lobby_players` | Real-time 4–8 player lounges, heartbeat tracking, ready states, and auto-start timers. |
| **Couples Arena** | `private_rooms`, `teams`, `room_players`, `team_scores` | 4-digit room codes, partner pairing, duo vs duo, and couples vs singles squad battles. |
| **Live Game Engine** | `game_sessions`, `game_rounds`, `game_answers`, `game_votes` | Authoritative server rounds, timers, secret answer locking, privacy masking, and consensus scoring. |
| **Social Chaos** | `player_reactions`, `chat_messages` | Live floating reactions (😂 ❤️ 🔥 👀 💀 😭 👏) and waiting room banter. |
| **Virality & Sharing** | `matches`, `story_results`, `referrals` | Consent-based crush unlocks, 1080x1920 Instagram Story Cards, and trackable referral codes. |
