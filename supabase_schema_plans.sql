create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  exercises jsonb,
  created_at timestamptz default now()
);

alter table workout_plans enable row level security;

create policy "Users can manage their own plans" on workout_plans
  for all using (auth.uid() = user_id);
