-- Run this entire SQL in your Supabase SQL Editor

-- Enable RLS
alter table if exists workout_logs disable row level security;
alter table if exists exercises disable row level security;
alter table if exists bodyweights disable row level security;
alter table if exists session_notes disable row level security;

-- Drop tables if rebuilding
drop table if exists workout_logs;
drop table if exists exercises;
drop table if exists bodyweights;
drop table if exists session_notes;

-- Workout logs (one row per set)
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  exercise text not null,
  set_number integer,
  set_type text,
  weight_kg numeric,
  reps integer,
  volume numeric,
  muscle_group text,
  notes text,
  created_at timestamptz default now()
);

-- Custom exercises per user
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  muscle_group text,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Bodyweight entries
create table bodyweights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight_kg numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- Session notes (one per user per date)
create table session_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  note text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable Row Level Security (users can only see their own data)
alter table workout_logs enable row level security;
alter table exercises enable row level security;
alter table bodyweights enable row level security;
alter table session_notes enable row level security;

-- Policies
create policy "Users can manage their own logs" on workout_logs
  for all using (auth.uid() = user_id);

create policy "Users can manage their own exercises" on exercises
  for all using (auth.uid() = user_id);

create policy "Users can manage their own bodyweights" on bodyweights
  for all using (auth.uid() = user_id);

create policy "Users can manage their own session notes" on session_notes
  for all using (auth.uid() = user_id);
