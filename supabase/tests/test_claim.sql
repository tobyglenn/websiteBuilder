-- Port of test_claim.py: two members sharing one routine land on one leaderboard.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

-- The signup trigger should have made both profiles.
select 'profiles created' as check,
       count(*) = 2 as pass, '(expect t)' as expect
from public.profiles;

create temporary table baseline as select count(*) as n from public.workouts;

select set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);

create temporary table claim_a as
select * from public.claim_or_publish_workout(
  'Back Barbell',
  '[{"id":235,"title":"Lat Pulldown","sets":[{"reps":10,"weight":50},{"reps":8,"weight":60}]},
    {"id":168,"title":"Row","sets":[{"reps":12,"weight":40}]}]'::jsonb,
  ''
);

select 'A matched_existing' as check, matched_existing = false as pass, '(expect t)' as expect
from claim_a;

-- Same routine: exercises reordered, heavier loads, sloppier name.
select set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);

create temporary table claim_b as
select * from public.claim_or_publish_workout(
  '  back   BARBELL ',
  '[{"id":168,"title":"Row","sets":[{"reps":12,"weight":95}]},
    {"id":235,"title":"Lat Pulldown","sets":[{"reps":10,"weight":120},{"reps":8,"weight":130}]}]'::jsonb,
  'my version'
);

select 'B matched_existing' as check, matched_existing = true as pass, '(expect t)' as expect
from claim_b;

select 'same workout id' as check,
       (select workout_id from claim_a) = (select workout_id from claim_b) as pass,
       '(expect t)' as expect;

select 'workouts added' as check,
       (select count(*) from public.workouts) - (select n from baseline) = 1 as pass,
       '(expect t)' as expect;

select 'B joined' as check, count(*) = 1 as pass, '(expect t)' as expect
from public.workout_installs
where user_id = '22222222-2222-2222-2222-222222222222'
  and workout_id = (select workout_id from claim_a);

-- Idempotency: claiming twice must not add a second install row.
select public.claim_or_publish_workout(
  '  back   BARBELL ',
  '[{"id":168,"title":"Row","sets":[{"reps":12,"weight":95}]},
    {"id":235,"title":"Lat Pulldown","sets":[{"reps":10,"weight":120},{"reps":8,"weight":130}]}]'::jsonb,
  'my version'
);

select 'B install rows' as check, count(*) = 1 as pass, '(expect t)' as expect
from public.workout_installs
where user_id = '22222222-2222-2222-2222-222222222222'
  and workout_id = (select workout_id from claim_a);

-- A genuinely different routine must not be folded in.
select 'different name is new' as check, matched_existing = false as pass, '(expect t)' as expect
from public.claim_or_publish_workout(
  'Chest Handles',
  '[{"id":235,"title":"Lat Pulldown","sets":[{"reps":10,"weight":50},{"reps":8,"weight":60}]},
    {"id":168,"title":"Row","sets":[{"reps":12,"weight":40}]}]'::jsonb,
  ''
);

select 'fewer sets is new' as check, matched_existing = false as pass, '(expect t)' as expect
from public.claim_or_publish_workout(
  'Back Barbell',
  '[{"id":235,"title":"Lat Pulldown","sets":[{"reps":10,"weight":50}]},
    {"id":168,"title":"Row","sets":[{"reps":12,"weight":40}]}]'::jsonb,
  ''
);

select 'different exercise is new' as check, matched_existing = false as pass, '(expect t)' as expect
from public.claim_or_publish_workout(
  'Back Barbell',
  '[{"id":999,"title":"Pull Up","sets":[{"reps":10,"weight":50},{"reps":8,"weight":60}]},
    {"id":168,"title":"Row","sets":[{"reps":12,"weight":40}]}]'::jsonb,
  ''
);

-- Unauthenticated callers are refused outright.
select set_config('test.uid', '', false);
do $$
begin
  perform public.claim_or_publish_workout('Anon Attempt', '[{"id":1,"sets":[{"reps":1}]}]'::jsonb, '');
  raise exception 'FAIL: anonymous claim was allowed';
exception when sqlstate '28000' then
  raise notice 'anon claim rejected  t (expect t)';
end;
$$;

-- The leaderboard view ranks best-effort-per-athlete.
select set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
insert into public.completions (user_id, workout_id, provider_record_id, completed_at, total_volume_lbs, duration_seconds)
values
  ('11111111-1111-1111-1111-111111111111', (select workout_id from claim_a), 'r1', now() - interval '3 days', 5000, 1800),
  ('11111111-1111-1111-1111-111111111111', (select workout_id from claim_a), 'r2', now() - interval '2 days', 9000, 1900),
  ('22222222-2222-2222-2222-222222222222', (select workout_id from claim_a), 'r3', now() - interval '1 days', 7000, 1700);

select 'leaderboard rows' as check, count(*) = 2 as pass, '(expect t — one per athlete)' as expect
from public.workout_leaderboard where workout_id = (select workout_id from claim_a);

select 'rank 1 volume' as check, total_volume_lbs = 9000 as pass, '(expect t — best effort)' as expect
from public.workout_leaderboard
where workout_id = (select workout_id from claim_a) and rank = 1;

select 'rank 1 attempts' as check, attempts = 2 as pass, '(expect t)' as expect
from public.workout_leaderboard
where workout_id = (select workout_id from claim_a) and rank = 1;
