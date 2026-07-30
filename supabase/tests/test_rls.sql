-- The security boundary, exercised as the roles a browser actually gets.
-- Run after test_claim.sql, which leaves two profiles and some completions.
\set ON_ERROR_STOP on

\set A '11111111-1111-1111-1111-111111111111'
\set B '22222222-2222-2222-2222-222222222222'

-- A signed-in client must not be able to invent a completion.
do $$
declare v_workout uuid;
begin
  select id into v_workout from public.workouts limit 1;
  set local role authenticated;
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', true);
  begin
    insert into public.completions (user_id, workout_id, provider_record_id, completed_at,
                                    total_volume_lbs, duration_seconds)
    values ('11111111-1111-1111-1111-111111111111', v_workout, 'forged', now(), 999999, 60);
    raise exception 'FAIL: authenticated client inserted a completion';
  exception when insufficient_privilege then
    raise notice 'forged completion blocked        t (expect t)';
  end;
end;
$$;

-- Anonymous visitors can still read the leaderboard.
set role authenticated;
select set_config('test.uid', '', true);
reset role;

do $$
declare n int;
begin
  set local role anon;
  select count(*) into n from public.workout_leaderboard;
  if n < 2 then raise exception 'FAIL: anon cannot read the leaderboard (got %)', n; end if;
  raise notice 'anon reads leaderboard           t (expect t, got % rows)', n;
end;
$$;

-- One member must not be able to read another member's Speediance link.
insert into public.speediance_links (user_id, provider_user_hash)
values ('11111111-1111-1111-1111-111111111111', 'hash-a');

do $$
declare n int;
begin
  set local role authenticated;
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', true);
  select count(*) into n from public.speediance_links;
  if n <> 0 then raise exception 'FAIL: B can see % link rows belonging to A', n; end if;
  raise notice 'links are private to their owner t (expect t)';
end;
$$;

-- ...but can read their own.
do $$
declare n int;
begin
  set local role authenticated;
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', true);
  select count(*) into n from public.speediance_links;
  if n <> 1 then raise exception 'FAIL: A sees % of their own link rows', n; end if;
  raise notice 'owner reads own link             t (expect t)';
end;
$$;

-- A member must not be able to publish a workout owned by someone else.
do $$
begin
  set local role authenticated;
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', true);
  begin
    insert into public.workouts (owner_user_id, name, exercises)
    values ('11111111-1111-1111-1111-111111111111', 'Impersonated',
            '[{"id":1,"sets":[{"reps":1}]}]'::jsonb);
    raise exception 'FAIL: B published a workout owned by A';
  exception when insufficient_privilege then
    raise notice 'ownership spoofing blocked       t (expect t)';
  end;
end;
$$;
