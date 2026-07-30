-- Local stubs for the Supabase-provided pieces, so the migration can be run
-- against a stock Postgres. Not part of the deployment.
create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- Stands in for the JWT claim; tests set it with set_config('test.uid', ...).
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;

-- Roles are cluster-wide, so a re-run against a fresh database still finds them.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I', r);
    end if;
  end loop;
end;
$$;
