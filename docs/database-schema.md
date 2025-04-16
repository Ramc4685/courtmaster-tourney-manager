# CourtMaster Database Schema

This document provides a reference for the CourtMaster database schema, including table structures, relationships, and SQL setup.

## Table Overview

The database consists of the following main tables:
- `profiles` - User profiles and player information
- `tournaments` - Tournament details and settings
- `divisions` - Tournament divisions/brackets
- `teams` - Team information and management
- `courts` - Court availability and management
- `registrations` - Tournament registrations
- `matches` - Match scheduling and results
- `notifications` - User notifications
- `tournament_messages` - Tournament communications
- `team_members` - Team membership tracking
- `player_history` - Player performance history

## Custom Types

```sql
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'player', 'scorekeeper');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE division_type AS ENUM ('skill', 'age', 'gender');
```

## Core Tables

### Profiles Table
```sql
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    full_name text,
    display_name text,
    avatar_url text,
    phone text,
    role user_role DEFAULT 'player',
    player_stats jsonb DEFAULT '{
        "matches_played": 0,
        "matches_won": 0,
        "tournaments_played": 0,
        "tournaments_won": 0,
        "rating": 1000,
        "ranking": null
    }'::jsonb,
    preferences jsonb DEFAULT '{
        "notifications": {
            "email": true,
            "push": true,
            "tournament_updates": true,
            "match_reminders": true
        },
        "privacy": {
            "show_profile": true,
            "show_stats": true,
            "show_history": true
        },
        "display": {
            "theme": "light",
            "language": "en"
        }
    }'::jsonb,
    player_details jsonb DEFAULT '{
        "birthdate": null,
        "gender": null,
        "skill_level": "beginner",
        "preferred_play_times": [],
        "preferred_locations": [],
        "equipment": [],
        "achievements": []
    }'::jsonb,
    social_links jsonb DEFAULT '{
        "facebook": null,
        "twitter": null,
        "instagram": null,
        "website": null
    }'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Tournaments Table
```sql
CREATE TABLE public.tournaments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    registration_deadline timestamptz,
    venue text,
    status tournament_status DEFAULT 'draft',
    organizer_id uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Divisions Table
```sql
CREATE TABLE public.divisions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name text NOT NULL,
    type division_type NOT NULL,
    min_age int,
    max_age int,
    skill_level text,
    gender text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Teams Table
```sql
CREATE TABLE public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    captain_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_team_name_per_tournament UNIQUE (tournament_id, name)
);
```

## Support Tables

### Courts Table
```sql
CREATE TABLE public.courts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES public.tournaments(id) NOT NULL,
    name text NOT NULL,
    status text CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE')) NOT NULL DEFAULT 'AVAILABLE',
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_court_name_per_tournament UNIQUE (tournament_id, name)
);
```

### Registrations Table
```sql
CREATE TABLE public.registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES public.tournaments(id) NOT NULL,
    division_id uuid REFERENCES public.divisions(id) NOT NULL,
    player_id uuid REFERENCES public.profiles(id) NOT NULL,
    partner_id uuid REFERENCES public.profiles(id),
    team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    status text CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WAITLIST', 'CHECKED_IN', 'WITHDRAWN')) NOT NULL DEFAULT 'PENDING',
    metadata jsonb,
    notes text,
    priority int DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
```

### Matches Table
```sql
CREATE TABLE public.matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES public.tournaments(id) NOT NULL,
    division_id uuid REFERENCES public.divisions(id),
    round_number int NOT NULL,
    match_number int NOT NULL,
    player1_id uuid REFERENCES public.profiles(id),
    player2_id uuid REFERENCES public.profiles(id),
    team1_id uuid REFERENCES public.teams(id),
    team2_id uuid REFERENCES public.teams(id),
    status text CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) NOT NULL DEFAULT 'SCHEDULED',
    scores jsonb,
    winner_id uuid REFERENCES public.profiles(id),
    winner_team_id uuid REFERENCES public.teams(id),
    scheduled_time timestamptz,
    start_time timestamptz,
    end_time timestamptz,
    court_id uuid REFERENCES public.courts(id),
    notes text,
    verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
```

## Communication Tables

### Notifications Table
```sql
CREATE TABLE public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
```

### Tournament Messages Table
```sql
CREATE TABLE public.tournament_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES public.tournaments(id) NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) NOT NULL,
    content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
    created_at timestamptz DEFAULT now() NOT NULL
);
```

## Team Management Tables

### Team Members Table
```sql
CREATE TABLE public.team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_per_team UNIQUE (team_id, user_id)
);
```

### Player History Table
```sql
CREATE TABLE public.player_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
    division_id uuid REFERENCES public.divisions(id) ON DELETE CASCADE,
    partner_id uuid REFERENCES public.profiles(id),
    placement int,
    points_earned int,
    matches_played int,
    matches_won int,
    created_at timestamptz DEFAULT now()
);
```

## Security Policies

The database uses Row Level Security (RLS) to control access to data. Key policies include:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
-- ... (enabled for all tables)

-- Example policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Tournaments are viewable by everyone"
    ON public.tournaments FOR SELECT
    USING (true);

CREATE POLICY "Organizers can create tournaments"
    ON public.tournaments FOR INSERT
    WITH CHECK (auth.uid() = organizer_id);
```

## Database Reset

To reset the database and recreate all tables, you can find the complete SQL script in the `supabase/migrations` directory. The migrations are applied in order:

1. `0001_initial_schema.sql` - Base schema
2. `0002_profile_enhancements.sql` - Profile related enhancements
3. `0003_team_management.sql` - Team management features

## Indexes

The database includes several indexes for performance optimization:

```sql
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX idx_registrations_tournament_id ON public.registrations(tournament_id);
-- ... (and many more for optimal query performance)
```

## Triggers

Several triggers maintain data integrity and handle updates:

```sql
-- Update timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update player stats
CREATE TRIGGER update_player_stats_on_match_complete
    AFTER UPDATE OF status ON public.matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_player_stats();

-- Real-time notifications
CREATE TRIGGER notify_match_changes
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION notify_match_update();
```

## Demo Users

To create demo users for testing, you can use the following SQL:

```sql
-- First create the auth.users entries (required since profiles reference auth.users)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo@example.com', now(), now(), now()),
    ('00000000-0000-0000-0000-000000000002', 'demo-admin@example.com', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Then create the demo player profile
INSERT INTO public.profiles (
    id,
    full_name,
    display_name,
    role,
    player_stats,
    preferences,
    player_details,
    social_links,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',  -- matches auth.users id
    'Demo Player',
    'Demo',
    'player',
    '{
        "matches_played": 0,
        "matches_won": 0,
        "tournaments_played": 0,
        "tournaments_won": 0,
        "rating": 1000,
        "ranking": null
    }'::jsonb,
    '{
        "notifications": {
            "email": true,
            "push": true,
            "tournament_updates": true,
            "match_reminders": true
        },
        "privacy": {
            "show_profile": true,
            "show_stats": true,
            "show_history": true
        },
        "display": {
            "theme": "light",
            "language": "en"
        }
    }'::jsonb,
    '{
        "birthdate": null,
        "gender": null,
        "skill_level": "INTERMEDIATE",
        "preferred_play_times": [],
        "preferred_locations": [],
        "equipment": [],
        "achievements": []
    }'::jsonb,
    '{
        "facebook": null,
        "twitter": null,
        "instagram": null,
        "website": null
    }'::jsonb,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    player_stats = EXCLUDED.player_stats,
    preferences = EXCLUDED.preferences,
    player_details = EXCLUDED.player_details,
    updated_at = now();

-- Create the demo admin profile
INSERT INTO public.profiles (
    id,
    full_name,
    display_name,
    role,
    player_stats,
    preferences,
    player_details,
    social_links,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000002',  -- matches auth.users id
    'Demo Admin',
    'Demo Admin',
    'admin',
    '{
        "matches_played": 0,
        "matches_won": 0,
        "tournaments_played": 0,
        "tournaments_won": 0,
        "rating": 1200,
        "ranking": null
    }'::jsonb,
    '{
        "notifications": {
            "email": true,
            "push": true,
            "tournament_updates": true,
            "match_reminders": true
        },
        "privacy": {
            "show_profile": true,
            "show_stats": true,
            "show_history": true
        },
        "display": {
            "theme": "light",
            "language": "en"
        }
    }'::jsonb,
    '{
        "birthdate": null,
        "gender": null,
        "skill_level": "ADVANCED",
        "preferred_play_times": [],
        "preferred_locations": [],
        "equipment": [],
        "achievements": []
    }'::jsonb,
    '{
        "facebook": null,
        "twitter": null,
        "instagram": null,
        "website": null
    }'::jsonb,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    player_stats = EXCLUDED.player_stats,
    preferences = EXCLUDED.preferences,
    player_details = EXCLUDED.player_details,
    updated_at = now();
```

This SQL will:
1. Create demo users in the auth.users table (required since profiles reference auth.users)
2. Create a demo player profile with INTERMEDIATE skill level
3. Create a demo admin profile with ADVANCED skill level
4. Use UPSERT (INSERT ... ON CONFLICT) to handle cases where the users might already exist

The demo users will have the following credentials:
- Demo Player: ID: '00000000-0000-0000-0000-000000000001', email: 'demo@example.com'
- Demo Admin: ID: '00000000-0000-0000-0000-000000000002', email: 'demo-admin@example.com' 