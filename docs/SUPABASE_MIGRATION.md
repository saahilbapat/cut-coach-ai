# Supabase Migration Plan

This document defines the first migration plan for moving Cut Coach AI from `localStorage` persistence to Supabase.

No application code should be changed during this setup step.

## Goals

- Use Supabase Auth for user identity.
- Store user-owned data in Supabase Postgres.
- Protect every user-owned table with Row Level Security.
- Ensure users can only access their own rows.
- Keep `OPENAI_API_KEY` server-only.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Allow `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the browser with RLS enabled.

## Tables Needed

The initial Supabase migration needs four user-owned tables:

1. `profiles`
2. `check_ins`
3. `analyses`
4. `food_memory`

All tables are scoped to Supabase Auth users.

## SQL Schema

Run this SQL in the Supabase SQL editor.

```sql
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
```

## Row Level Security

Enable RLS on every user-owned table.

```sql
alter table public.profiles enable row level security;
alter table public.check_ins enable row level security;
alter table public.analyses enable row level security;
alter table public.food_memory enable row level security;
```

### Profiles Policies

```sql
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (id = auth.uid());
```

### Check-Ins Policies

```sql
create policy "Users can read their own check-ins"
on public.check_ins
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own check-ins"
on public.check_ins
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own check-ins"
on public.check_ins
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own check-ins"
on public.check_ins
for delete
to authenticated
using (user_id = auth.uid());
```

### Analyses Policies

```sql
create policy "Users can read their own analyses"
on public.analyses
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own analyses"
on public.analyses
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own analyses"
on public.analyses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own analyses"
on public.analyses
for delete
to authenticated
using (user_id = auth.uid());
```

### Food Memory Policies

```sql
create policy "Users can read their own food memory"
on public.food_memory
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own food memory"
on public.food_memory
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own food memory"
on public.food_memory
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own food memory"
on public.food_memory
for delete
to authenticated
using (user_id = auth.uid());
```

## Environment Variables

Client-safe:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Server-only:

```bash
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional:

```bash
NEXT_PUBLIC_APP_URL=
```

Security notes:

- `OPENAI_API_KEY` must remain server-only.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client-side code.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be used client-side only because RLS restricts access.
- Do not use the service role key in React components.

## Implementation Phases

### Phase 1: Supabase Project Setup

- Create Supabase project.
- Add SQL schema.
- Enable RLS.
- Add policies.
- Add environment variables locally.

### Phase 2: Auth Setup

- Add Supabase Auth helpers.
- Create login page.
- Create auth callback route.
- Support magic-link login first.
- Confirm authenticated session loading.

### Phase 3: Read/Write Layer

- Add Supabase client helpers.
- Add query helpers for:
  - profile
  - check-ins
  - analyses
  - food memory
- Keep existing localStorage behavior untouched until helpers are verified.

### Phase 4: Migration Prompt

- Detect existing localStorage data after login.
- Show migration prompt.
- Upload localStorage data only after user approval.
- Mark migration complete locally.

### Phase 5: Supabase Primary Persistence

- Switch profile, check-ins, analyses, and food memory to Supabase reads/writes.
- Keep localStorage as temporary fallback/cache.
- Preserve duplicate-analysis prevention using `input_signature`.

### Phase 6: Cleanup

- Remove localStorage dependency only after Supabase sync is stable.
- Keep an export or backup option before removing old local data.

## Testing Checklist

### Database

- Tables exist.
- Indexes exist.
- RLS is enabled on all four tables.
- Policies exist for select, insert, update, and delete.

### Auth

- User can log in.
- User can log out.
- Session persists after refresh.
- Unauthenticated user cannot access protected data.

### RLS

- User A cannot read User B profile.
- User A cannot read User B check-ins.
- User A cannot read User B analyses.
- User A cannot read User B food memory.
- User A cannot update or delete User B rows.

### App Data

- Profile saves and reloads.
- Check-in saves and reloads.
- Check-in upserts by date.
- Analysis saves and reloads by date/signature.
- Food memory saves, edits, deletes, and reloads.

### Migration

- Existing localStorage check-ins migrate.
- Existing localStorage analyses migrate.
- Existing localStorage profile migrates.
- Existing localStorage food memory migrates.
- Duplicate rows are not created.
- User can skip migration.
- Skipped migration does not delete local data.

### Device Sync

- Log in on computer.
- Log in on phone.
- Save check-in on one device.
- Confirm the other device sees the saved check-in after refresh.
- Confirm profile and food memory sync across devices.

### Secrets

- `OPENAI_API_KEY` is not present in client bundle.
- `SUPABASE_SERVICE_ROLE_KEY` is not present in client bundle.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to browser code.

## Rollback Plan

The first rollout should preserve localStorage until Supabase is verified.

Rollback steps:

1. Keep existing localStorage data untouched during migration.
2. If Supabase integration fails, switch reads/writes back to localStorage.
3. Disable Supabase migration prompt.
4. Keep Supabase tables intact for investigation.
5. Do not delete user localStorage data automatically.
6. Fix schema, policies, or query helpers.
7. Re-enable Supabase behind a controlled rollout.

Data safety rules:

- Never clear localStorage immediately after migration.
- Mark migration complete only after successful Supabase writes.
- Prefer insert-only migration for conflicts unless the user explicitly chooses overwrite.
- Keep `analyses` keyed by `date` and `input_signature` to preserve cached AI analysis behavior.
