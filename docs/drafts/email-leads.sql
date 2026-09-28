-- Draft only: not deployed or used by the website newsletter form.
-- Email leads capture for newsletter and lead magnets (e.g. 242 -> 188 lbs transformation blueprint)
create table if not exists public.email_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(btrim(email)) between 3 and 255),
  lead_magnet text,
  form_location text not null default 'website',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.email_leads enable row level security;

-- Allow anon and authenticated users to insert leads
create policy "Allow anonymous insertion of email leads"
  on public.email_leads
  for insert
  to anon, authenticated
  with check (true);
