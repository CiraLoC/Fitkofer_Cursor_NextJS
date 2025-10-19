-- LumaWell MVP schema
-- Run via Supabase SQL editor or CLI

-- Users handled by auth.users
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  tz text not null default 'UTC',
  goal text check (goal in ('fat_loss', 'recomp', 'glute')),
  equipment text[],
  sleep_wake jsonb,
  energy_pref jsonb,
  conditions jsonb,
  cycle_phase text,
  created_at timestamptz default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  title text,
  description text,
  level text,
  meta jsonb
);

create table if not exists program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  week_number int,
  plan jsonb
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  title text,
  focus text,
  duration_min int,
  equipment text[],
  video_url text,
  steps jsonb
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  title text,
  preset_key text,
  kcal int,
  macros jsonb,
  recipe_url text,
  grocery jsonb
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  sleep_hours numeric,
  wake_time time,
  energy int check (energy between 1 and 5),
  mood int check (mood between 1 and 5),
  notes text,
  unique (user_id, date)
);

create table if not exists energy_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  morning int,
  afternoon int,
  evening int,
  source text,
  unique (user_id, date)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  slot text check (slot in ('morning', 'afternoon', 'evening')),
  type text check (type in ('workout', 'walk', 'meal_prep', 'meal', 'micro', 'wind_down')),
  ref_id uuid,
  title text,
  duration_min int,
  intensity text,
  status text default 'planned',
  created_at timestamptz default now()
);

create table if not exists task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  event text,
  meta jsonb,
  created_at timestamptz default now()
);

create table if not exists grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  items jsonb
);

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text,
  status text,
  renews_at timestamptz,
  stripe_customer text,
  stripe_sub text
);

-- Helper tables
create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  send_at timestamptz,
  status text default 'pending'
);

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text
);

-- Indexes
create index if not exists idx_checkins_user_date on checkins (user_id, date);
create index if not exists idx_energy_windows_user_date on energy_windows (user_id, date);
create index if not exists idx_tasks_user_date on tasks (user_id, date);

-- RLS
alter table profiles enable row level security;
alter table checkins enable row level security;
alter table energy_windows enable row level security;
alter table tasks enable row level security;
alter table task_events enable row level security;
alter table grocery_lists enable row level security;
alter table subscriptions enable row level security;
alter table nudges enable row level security;

-- Profiles policies
drop policy if exists "Profiles select" on profiles;
create policy "Profiles select" on profiles
  for select using (user_id = auth.uid());

drop policy if exists "Profiles insert" on profiles;
create policy "Profiles insert" on profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "Profiles update" on profiles;
create policy "Profiles update" on profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Profiles delete" on profiles;
create policy "Profiles delete" on profiles
  for delete using (user_id = auth.uid());

-- Checkins policies
drop policy if exists "Checkins select" on checkins;
create policy "Checkins select" on checkins
  for select using (user_id = auth.uid());

drop policy if exists "Checkins insert" on checkins;
create policy "Checkins insert" on checkins
  for insert with check (user_id = auth.uid());

drop policy if exists "Checkins update" on checkins;
create policy "Checkins update" on checkins
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Checkins delete" on checkins;
create policy "Checkins delete" on checkins
  for delete using (user_id = auth.uid());

-- Energy windows policies
drop policy if exists "Energy windows select" on energy_windows;
create policy "Energy windows select" on energy_windows
  for select using (user_id = auth.uid());

drop policy if exists "Energy windows insert" on energy_windows;
create policy "Energy windows insert" on energy_windows
  for insert with check (user_id = auth.uid());

drop policy if exists "Energy windows update" on energy_windows;
create policy "Energy windows update" on energy_windows
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Energy windows delete" on energy_windows;
create policy "Energy windows delete" on energy_windows
  for delete using (user_id = auth.uid());

-- Tasks policies
drop policy if exists "Tasks select" on tasks;
create policy "Tasks select" on tasks
  for select using (user_id = auth.uid());

drop policy if exists "Tasks insert" on tasks;
create policy "Tasks insert" on tasks
  for insert with check (user_id = auth.uid());

drop policy if exists "Tasks update" on tasks;
create policy "Tasks update" on tasks
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Tasks delete" on tasks;
create policy "Tasks delete" on tasks
  for delete using (user_id = auth.uid());

-- Task events policies
drop policy if exists "Task events select" on task_events;
create policy "Task events select" on task_events
  for select using (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );

drop policy if exists "Task events insert" on task_events;
create policy "Task events insert" on task_events
  for insert with check (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- Grocery lists policies
drop policy if exists "Grocery lists select" on grocery_lists;
create policy "Grocery lists select" on grocery_lists
  for select using (user_id = auth.uid());

drop policy if exists "Grocery lists insert" on grocery_lists;
create policy "Grocery lists insert" on grocery_lists
  for insert with check (user_id = auth.uid());

drop policy if exists "Grocery lists update" on grocery_lists;
create policy "Grocery lists update" on grocery_lists
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Grocery lists delete" on grocery_lists;
create policy "Grocery lists delete" on grocery_lists
  for delete using (user_id = auth.uid());

-- Subscriptions policies
drop policy if exists "Subscriptions select" on subscriptions;
create policy "Subscriptions select" on subscriptions
  for select using (user_id = auth.uid());

-- Nudges policies
drop policy if exists "Nudges select" on nudges;
create policy "Nudges select" on nudges
  for select using (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );

drop policy if exists "Nudges insert" on nudges;
create policy "Nudges insert" on nudges
  for insert with check (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );

drop policy if exists "Nudges update" on nudges;
create policy "Nudges update" on nudges
  for update using (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );

drop policy if exists "Nudges delete" on nudges;
create policy "Nudges delete" on nudges
  for delete using (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );
