create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  age integer,
  height text default '',
  sex text default '',
  current_weight numeric,
  goal_weight numeric,
  goal_pace text default 'Moderate Cut',
  activity_level text default '',
  preferred_protein_goal text default '',
  dietary_preferences text default '',
  favorite_restaurants text default '',
  common_grocery_stores text default '',
  favorite_foods text default '',
  cut_concerns text[] not null default '{}',
  cut_concern_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight text default '',
  steps text default '',
  workout text default '',
  workout_type text default '',
  workout_duration text default '',
  cardio_type text default '',
  cardio_duration text default '',
  lunch text default '',
  dinner text default '',
  snacks text default '',
  alcohol text default '',
  water text default '',
  hunger text default '',
  energy text default '',
  mood text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_id uuid references public.check_ins(id) on delete cascade,
  date date not null,
  input_signature text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, input_signature)
);

create table if not exists public.food_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  category text not null default 'other',
  description text default '',
  estimated_calories text,
  estimated_protein text,
  estimated_carbs text,
  estimated_fat text,
  confidence text,
  source text not null default 'manual',
  times_seen integer not null default 0,
  last_seen date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists check_ins_user_date_idx
  on public.check_ins (user_id, date desc);

create index if not exists analyses_user_date_idx
  on public.analyses (user_id, date desc);

create index if not exists food_memory_user_seen_idx
  on public.food_memory (user_id, times_seen desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_check_ins_updated_at on public.check_ins;
create trigger set_check_ins_updated_at
before update on public.check_ins
for each row
execute function public.set_updated_at();

drop trigger if exists set_analyses_updated_at on public.analyses;
create trigger set_analyses_updated_at
before update on public.analyses
for each row
execute function public.set_updated_at();

drop trigger if exists set_food_memory_updated_at on public.food_memory;
create trigger set_food_memory_updated_at
before update on public.food_memory
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.check_ins enable row level security;
alter table public.analyses enable row level security;
alter table public.food_memory enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (id = auth.uid());

drop policy if exists "Users can read their own check-ins" on public.check_ins;
create policy "Users can read their own check-ins"
on public.check_ins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own check-ins" on public.check_ins;
create policy "Users can insert their own check-ins"
on public.check_ins
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own check-ins" on public.check_ins;
create policy "Users can update their own check-ins"
on public.check_ins
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own check-ins" on public.check_ins;
create policy "Users can delete their own check-ins"
on public.check_ins
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read their own analyses" on public.analyses;
create policy "Users can read their own analyses"
on public.analyses
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own analyses" on public.analyses;
create policy "Users can insert their own analyses"
on public.analyses
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own analyses" on public.analyses;
create policy "Users can update their own analyses"
on public.analyses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own analyses" on public.analyses;
create policy "Users can delete their own analyses"
on public.analyses
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read their own food memory" on public.food_memory;
create policy "Users can read their own food memory"
on public.food_memory
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own food memory" on public.food_memory;
create policy "Users can insert their own food memory"
on public.food_memory
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own food memory" on public.food_memory;
create policy "Users can update their own food memory"
on public.food_memory
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own food memory" on public.food_memory;
create policy "Users can delete their own food memory"
on public.food_memory
for delete
to authenticated
using (user_id = auth.uid());
