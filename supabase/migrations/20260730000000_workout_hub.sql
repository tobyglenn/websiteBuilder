-- Speediance Workout Hub — Postgres schema, ported from backend/workout_hub.
--
-- The trust model is the whole point of this file. Everything the hub does
-- except one thing can happen in the visitor's browser, because the Speediance
-- API is CORS-open. The exception is `completions`: if a browser could write
-- them the leaderboard would be self-reported. So `completions` grants no write
-- privilege to anon or authenticated at all, and the only writer is the
-- sync-completions Edge Function holding the service role key.
--
-- Identity is Supabase Auth. A Speediance password is never sent here and never
-- stored here; the browser logs in to Speediance directly and hands the sync
-- function a short-lived provider token instead.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  created_at timestamptz not null default now()
);

-- A leaderboard row needs a name, so every auth user gets a profile up front
-- rather than on first publish.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'athlete'), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Speediance account link
--
-- No credentials live here. The hash exists so one Speediance account cannot be
-- claimed by two hub profiles; it is computed inside the Edge Function from a
-- salt the client never sees, so it cannot be forged from the browser.
-- ---------------------------------------------------------------------------

create table public.speediance_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  provider_user_hash text not null unique,
  region text not null default 'Global' check (region in ('Global', 'EU')),
  device_type smallint not null default 1,
  unit smallint not null default 1 check (unit in (0, 1)),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Workouts
-- ---------------------------------------------------------------------------

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '',
  exercises jsonb not null,
  weight_unit smallint not null default 1 check (weight_unit in (0, 1)),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Identify a program by name and exercise make-up, ignoring loads: two people
-- running the same routine at different weights belong on the same leaderboard.
-- Exercise order is ignored too — only which exercises appear, and how many sets
-- each carries, decide identity.
--
-- This does not reproduce the Python hash byte for byte and does not need to.
-- It only has to be internally consistent, and the migration recomputes every
-- fingerprint on the way in.
create function public.workout_fingerprint(p_name text, p_exercises jsonb)
returns text
language sql
immutable
as $$
  select encode(
    sha256(
      convert_to(
        lower(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g'))
          || '|'
          || coalesce(
               (
                 select string_agg(signature, ',' order by signature)
                 from (
                   select (exercise ->> 'id') || ':'
                            || coalesce(jsonb_array_length(exercise -> 'sets'), 0)::text
                            as signature
                   from jsonb_array_elements(coalesce(p_exercises, '[]'::jsonb)) as exercise
                 ) as parts
               ),
               ''
             ),
        'UTF8'
      )
    ),
    'hex'
  );
$$;

-- A trigger rather than a generated column: generated expressions are fussy
-- about what they may call, and this keeps the rule in one obvious place.
create function public.set_workout_fingerprint()
returns trigger
language plpgsql
as $$
begin
  new.fingerprint := public.workout_fingerprint(new.name, new.exercises);
  new.updated_at := now();
  return new;
end;
$$;

create trigger workouts_fingerprint
before insert or update of name, exercises on public.workouts
for each row execute function public.set_workout_fingerprint();

-- Only public workouts are deduplicated; a private copy is nobody else's
-- business. This partial index is what makes claiming a leaderboard an upsert
-- instead of a scan, and what makes it correct when two people claim at once.
create unique index workouts_public_fingerprint_key
  on public.workouts (fingerprint)
  where visibility = 'public';

create index workouts_owner_idx on public.workouts (owner_user_id);

-- ---------------------------------------------------------------------------
-- Installs
-- ---------------------------------------------------------------------------

create table public.workout_installs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  -- Null when the caller already owned the routine on their own account: sync
  -- then falls back to matching the record by name.
  provider_template_id text,
  provider_template_code text,
  status text not null default 'installed' check (status in ('installed', 'pending', 'removed')),
  installed_at timestamptz not null default now(),
  -- Named, because claim_or_publish_workout() targets it by name: its OUT
  -- parameter is also called workout_id, and a column list in ON CONFLICT would
  -- be ambiguous against it.
  constraint workout_installs_user_workout_key unique (user_id, workout_id)
);

create index workout_installs_user_idx on public.workout_installs (user_id) where status = 'installed';

-- ---------------------------------------------------------------------------
-- Completions — service role writes only
--
-- total_volume_lbs keeps the existing column's units: the provider reports in
-- the account's own unit, and the sync function converts kg accounts on import.
-- ---------------------------------------------------------------------------

create table public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  provider_record_id text not null,
  completed_at timestamptz not null,
  total_volume_lbs double precision not null
    check (total_volume_lbs >= 0 and total_volume_lbs < 10000000),
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  verified boolean not null default true,
  provider_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  -- Re-syncing an overlapping date range must not double count.
  unique (user_id, provider_record_id)
);

create index completions_board_idx
  on public.completions (workout_id, total_volume_lbs desc, completed_at asc)
  where verified;

-- ---------------------------------------------------------------------------
-- Row level security
--
-- The anon key is public by design; these policies are the entire security
-- boundary. Every table below is enabled, without exception.
-- ---------------------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.speediance_links   enable row level security;
alter table public.workouts           enable row level security;
alter table public.workout_installs   enable row level security;
alter table public.completions        enable row level security;

-- Profiles: display names are the leaderboard, so they are readable.
create policy "profiles are publicly readable"
  on public.profiles for select to anon, authenticated using (true);

create policy "a profile is editable by its owner"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Links: private to their owner. Nobody else needs to know an account exists.
create policy "a link is readable by its owner"
  on public.speediance_links for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "a link is writable by its owner"
  on public.speediance_links for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "a link is updatable by its owner"
  on public.speediance_links for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "a link is removable by its owner"
  on public.speediance_links for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Workouts: the catalogue is the point, so public rows are world-readable.
create policy "public workouts are readable by anyone"
  on public.workouts for select to anon, authenticated
  using (visibility = 'public' or (select auth.uid()) = owner_user_id);

create policy "a workout is published by its owner"
  on public.workouts for insert to authenticated
  with check ((select auth.uid()) = owner_user_id);

create policy "a workout is editable by its owner"
  on public.workouts for update to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

create policy "a workout is removable by its owner"
  on public.workouts for delete to authenticated
  using ((select auth.uid()) = owner_user_id);

-- Installs: private. Which routines someone runs is not public information.
create policy "an install is readable by its owner"
  on public.workout_installs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "an install is created by its owner"
  on public.workout_installs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "an install is removable by its owner"
  on public.workout_installs for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Completions: readable when verified, and writable by nobody. There is
-- deliberately no insert, update or delete policy here — the service role used
-- by the sync function bypasses RLS, and that is the only path in.
create policy "verified completions are readable by anyone"
  on public.completions for select to anon, authenticated using (verified);

-- ---------------------------------------------------------------------------
-- Grants
--
-- Tables created through SQL rather than the dashboard do not pick up the
-- default privileges, so each role is granted exactly what it needs. RLS still
-- decides which rows; this decides which verbs.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.workouts, public.completions
  to anon, authenticated;

grant update on public.profiles to authenticated;
grant insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.speediance_links to authenticated;
grant select, insert, delete on public.workout_installs to authenticated;

-- Belt and braces behind RLS: no client role holds a write verb on completions,
-- so even a policy mistake cannot let a browser state its own numbers.
revoke insert, update, delete on public.completions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Claiming a leaderboard
--
-- Replaces WorkoutHubService.claim_or_publish_workout. Joining an existing
-- entry rather than creating a near-duplicate is matched on name and exercises,
-- never on the Speediance share code, because each account gets a different
-- code for the same routine.
-- ---------------------------------------------------------------------------

create function public.claim_or_publish_workout(
  p_name text,
  p_exercises jsonb,
  p_description text default '',
  p_weight_unit smallint default 1,
  p_provider_template_id text default null,
  p_provider_template_code text default null
)
returns table (workout_id uuid, matched_existing boolean)
language plpgsql
as $$
declare
  v_uid uuid := (select auth.uid());
  v_fingerprint text;
  v_id uuid;
  v_matched boolean := true;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if jsonb_typeof(p_exercises) is distinct from 'array'
     or jsonb_array_length(p_exercises) = 0 then
    raise exception 'A workout needs at least one exercise' using errcode = '22023';
  end if;

  v_fingerprint := public.workout_fingerprint(p_name, p_exercises);

  select w.id into v_id
    from public.workouts w
   where w.fingerprint = v_fingerprint and w.visibility = 'public'
   limit 1;

  if v_id is null then
    insert into public.workouts (owner_user_id, name, description, exercises, weight_unit)
    values (v_uid, p_name, coalesce(p_description, ''), p_exercises, coalesce(p_weight_unit, 1::smallint))
    on conflict (fingerprint) where visibility = 'public' do nothing
    returning id into v_id;

    v_matched := false;

    -- Lost a race with a concurrent claim: the other writer's row is canonical.
    if v_id is null then
      select w.id into v_id
        from public.workouts w
       where w.fingerprint = v_fingerprint and w.visibility = 'public'
       limit 1;
      v_matched := true;
    end if;
  end if;

  insert into public.workout_installs (
    user_id, workout_id, provider_template_id, provider_template_code
  )
  values (v_uid, v_id, p_provider_template_id, p_provider_template_code)
  on conflict on constraint workout_installs_user_workout_key do nothing;

  return query select v_id, v_matched;
end;
$$;

grant execute on function
  public.claim_or_publish_workout(text, jsonb, text, smallint, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard
--
-- One row per athlete per workout — their best effort — ranked by volume, with
-- ties broken by who got there first. Mirrors WorkoutHubService.get_leaderboard.
-- ---------------------------------------------------------------------------

create view public.workout_leaderboard as
with best as (
  select
    c.workout_id,
    c.user_id,
    c.total_volume_lbs,
    c.duration_seconds,
    c.completed_at,
    c.verified,
    count(*) over (partition by c.workout_id, c.user_id) as attempts,
    row_number() over (
      partition by c.workout_id, c.user_id
      order by c.total_volume_lbs desc, c.completed_at asc
    ) as effort_rank
  from public.completions c
  where c.verified
)
select
  best.workout_id,
  row_number() over (
    partition by best.workout_id
    order by best.total_volume_lbs desc, best.completed_at asc
  ) as rank,
  p.display_name,
  best.total_volume_lbs,
  best.duration_seconds,
  best.completed_at,
  best.verified,
  best.attempts
from best
join public.profiles p on p.id = best.user_id
where best.effort_rank = 1;

-- Read the view as the caller, so the policies above still apply through it.
alter view public.workout_leaderboard set (security_invoker = on);

grant select on public.workout_leaderboard to anon, authenticated;
