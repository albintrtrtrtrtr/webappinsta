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
1. In the left-hand navigation sidebar, click on the **SQL Editor** icon (`>_` code brackets).

### Step 3: Open a New Query
1. Click the **"+ New Query"** button at the top of the SQL Editor view (or visit [https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok/sql/new](https://supabase.com/dashboard/project/vgcmqzcsmndjkclbkjok/sql/new)).
2. An empty query editor will appear.
3. Name the tab `InstaGame Complete Setup`.

### Step 4: Copy and Execute `setup.sql`
1. Open the file `supabase/setup.sql` in your IDE or code editor.
2. Select the entire contents of `supabase/setup.sql` (`Ctrl+A` / `Cmd+A`) and copy it (`Ctrl+C` / `Cmd+C`).
3. Paste the SQL code into the Supabase query editor window (`Ctrl+V` / `Cmd+V`).
4. Click the green **"Run"** button in the lower-right corner (or press `Ctrl+Enter` / `Cmd+Enter`).
5. Execution takes approximately 2–4 seconds. You should see a confirmation message:
   ```text
   Success. No rows returned
   ```

---

## 3. Secure Administrator Provisioning

All hardcoded administrator credentials, static passkeys, and insecure seed records have been completely removed.

To provision your initial Superadmin account securely:

### Step 1: Obtain Your User ID
- If you have an authenticated account in **Authentication** -> **Users**, copy your user UUID.
- Or use any preferred unique administrative handle (e.g. `admin_super`).

### Step 2: Execute the One-Time Provisioning RPC
In a new query tab in the SQL Editor, execute:

```sql
SELECT public.provision_initial_admin(
  '<YOUR_USER_ID_OR_AUTH_UUID>',
  'admin@yourdomain.com'
);
```

**Security Safeguards:**
- This function works **only once**: it succeeds only when the `public.admin_users` table is completely empty (0 rows).
- Once provisioned, further calls are automatically rejected:
  `Initial administrator already provisioned. Subsequent administrators must be promoted by an existing superadmin.`
- To promote additional moderators or admins later, your superadmin calls:
  ```sql
  SELECT public.promote_user_to_admin(
    '<TARGET_USER_ID>',
    'moderator@yourdomain.com',
    'moderator',
    '<YOUR_SUPERADMIN_ID>'
  );
  ```
- Client-side inserts/updates into `admin_users` are blocked by Row Level Security policies.

---

## 4. Verification & Health Check Queries

Run the following quick query in the SQL Editor to verify the installation:

```sql
-- Verify table counts and catalogue data
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables,
  (SELECT COUNT(*) FROM public.game_catalog) AS total_games,
  (SELECT COUNT(*) FROM public.game_questions) AS total_seed_questions,
  (SELECT COUNT(*) FROM pg_publication_rel pr JOIN pg_publication p ON pr.prpubid = p.oid WHERE p.pubname = 'supabase_realtime') AS realtime_tables_count;
```

**Expected Results:**
- `total_tables`: ≥ 24
- `total_games`: 6
- `total_seed_questions`: 24
- `realtime_tables_count`: 12

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

---

## 6. Authoritative Database Functions (16 RPCs)

1. `public.upsert_player_profile` - Seamless profile creation & session heartbeat.
2. `public.create_public_lobby` - Matchmaking lounge initialization.
3. `public.join_lobby` - Capacity-safe lounge entry.
4. `public.leave_lobby` - Player departure and host auto-reelection.
5. `public.create_private_room` - Unique 4-character room code generation.
6. `public.join_private_room` - Team balancing and private room entry.
7. `public.start_game_session` - Server-authoritative game start transition.
8. `public.advance_game_round` - Phase synchronizer (answering → voting → reveal → scoring).
9. `public.submit_game_answer` - Prevents double submissions; enforces secret answer locking.
10. `public.submit_game_vote` - Rejects self-voting; records consensus votes.
11. `public.create_mutual_match` - Mutual consent match generator with duplicate pair protection.
12. `public.complete_game_session` - Finalizes game status and archives score distributions.
13. `public.create_story_share` - Generates viral 12-char token for Instagram Story Cards.
14. `public.is_admin` - Fast cached admin verification for RLS policies.
15. `public.provision_initial_admin` - One-time bootstrap function for project owner.
16. `public.promote_user_to_admin` - Superadmin-only role promotion and delegation.
