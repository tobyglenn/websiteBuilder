# Workout Hub on Supabase — draft

Moves the leaderboard off the DGX so the public site has a backend without any
machine here being reachable from the internet. Nothing in this directory has
been applied anywhere; no Supabase project has been created.

## What moves and what doesn't

| Piece | Where it lives after |
| --- | --- |
| Speediance login, template fetch, install, share links | Browser, unchanged (`src/lib/speediance.js`) |
| Speediance password | Browser only — never sent to Supabase |
| Workouts, installs, completions, leaderboard | Supabase Postgres |
| Hub identity / sessions | Supabase Auth (replaces the bearer tokens in `sessions`) |
| Completion import | `sync-completions` Edge Function |
| FastAPI + SQLite backend on DGX | Stays running until the hosted path is proven, then retires |

The Fernet `CredentialVault` disappears entirely — there is nothing left to
encrypt once passwords never leave the browser.

## Files

- `migrations/20260730000000_workout_hub.sql` — tables, RLS, the fingerprint
  trigger, `claim_or_publish_workout()`, and the `workout_leaderboard` view.
- `functions/sync-completions/index.ts` — the one piece of server code.
- `export_sqlite.py` — dumps the current DGX database as INSERTs.

## The integrity argument, in one paragraph

`completions` has a `select` policy and no write policy, and `insert, update,
delete` are revoked from `anon` and `authenticated` outright. The service role
key exists only inside the Edge Function, which fetches the training records
from Speediance itself using a provider token the caller supplies. So a row in
`completions` is evidence that Speediance reported that session. A visitor can
publish a workout and claim a leaderboard, but cannot state their own numbers.

Two supporting details: the provider host is chosen from an allowlist rather
than taken from the request body (otherwise the function is an open proxy
carrying its own service role key), and the caller's identity comes from their
JWT rather than the body.

## Rollout

1. `supabase init`, then create the project and `supabase link --project-ref …`.
2. `supabase db push` to apply the migration.
3. Set secrets — `PROVIDER_HASH_SALT` is any long random string, generated once
   and never rotated casually (rotating it orphans every existing link row):
   ```bash
   supabase secrets set PROVIDER_HASH_SALT="$(openssl rand -hex 32)"
   supabase secrets set HUB_ALLOWED_ORIGIN="https://tobyonfitnesstech.com"
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
   pre-populated by the platform; do not set them yourself.
4. `supabase functions deploy sync-completions`.
5. Create your auth account, then seed:
   ```bash
   ssh dgx 'python3 export_sqlite.py <your-auth-uuid>' > seed.sql
   psql "$SUPABASE_DB_URL" -f seed.sql
   ```
6. Point the frontend at it: `PUBLIC_SUPABASE_URL` and
   `PUBLIC_SUPABASE_ANON_KEY` replace `PUBLIC_WORKOUT_HUB_API_URL`. The anon key
   is meant to be public — it ships in the bundle, and RLS is what protects the
   data.

## Free tier, verified 2026-07-30

500 MB database, 5 GB egress, 50,000 monthly active users, 500,000 Edge Function
invocations, 2 active projects. This workload is nowhere near any of those.

**The one that matters: free projects pause after 1 week of inactivity.** A
low-traffic leaderboard can genuinely go a week without a request, and a paused
project needs a manual unpause from the dashboard — the first visitor back would
hit a dead API. Mitigation that respects the no-exposed-machines rule, since it
is outbound only:

```cron
17 6 * * 1 curl -fsS -m 20 -o /dev/null \
  -H "apikey: $SUPABASE_ANON_KEY" \
  "https://<project-ref>.supabase.co/rest/v1/workouts?select=id&limit=1"
```

**Open question I could not close:** the pricing page says nothing either way
about commercial use on the free plan. Vercel's Hobby tier states the
restriction explicitly, which is what ruled it out; Supabase's silence is not
the same as permission. Worth reading the terms of service before the site
carries anything commercial. I am not comfortable asserting it either way.

## Behaviour changes worth knowing

- **Claiming gets correct under concurrency.** The Python version reads every
  public workout, fingerprints them in Python, then writes — two simultaneous
  claims can both miss and create duplicates. The partial unique index on
  `fingerprint` makes that impossible, and the race path in
  `claim_or_publish_workout()` resolves to the winner's row.
- **Fingerprints are recomputed, not carried over.** The SQL hash does not match
  the Python hash byte for byte; it only has to be self-consistent.
- **Sign-in becomes two steps.** Supabase Auth for hub identity, Speediance
  login for provider access. They are separate accounts, which is why
  `speediance_links` exists. This is more honest than the current design, where
  a Speediance password doubles as a hub credential.
- `total_volume_lbs` keeps its name and its kg→lb conversion on import.

## What has actually been tested

Run against a throwaway `postgres:16` container on the DGX, using
`prelude_test_only.sql` to stub `auth.users`, `auth.uid()` and the three
Supabase roles. The container was removed afterwards.

- Migration applies cleanly from an empty database.
- `test_claim.sql` — 14 assertions, all passing: the reordered/re-cased/heavier
  duplicate joins the same entry, only one workout row is added, the second
  member gets an install row, claiming twice stays idempotent, and a different
  name, a different set count and a different exercise each create a new entry.
  Also covers the leaderboard view: one row per athlete, their best effort,
  attempts counted.
- `test_rls.sql` — 5 assertions, all passing: a signed-in client is refused when
  it tries to insert a completion, anonymous visitors can still read the
  leaderboard, one member cannot read another's `speediance_links` but can read
  their own, and a member cannot publish a workout owned by someone else.
- `functions/sync-completions/index.ts` passes `deno check` with no type errors.

Two real bugs were found this way and fixed:

1. `claim_or_publish_workout()`'s OUT parameter `workout_id` shadowed the column
   in `on conflict (user_id, workout_id)` — Postgres refused the function body
   as ambiguous. The unique constraint is now named and targeted by name.
2. The `grant execute` on that function sat above its definition, so a clean
   apply failed. Grants now follow what they grant on.

Not tested: the Edge Function's runtime behaviour. It typechecks, but no call
has been made against Speediance or a real project, so the record-matching and
import path is unproven at runtime. `supabase functions serve` with a real
provider token is the way to close that.

## Not yet done

- No frontend wiring — `SpeedianceWorkoutHub.jsx` still talks to the FastAPI
  routes. That is the next chunk of work and it is not small: `api()` becomes
  the supabase-js client, and connect grows a Supabase sign-in step.
- No Supabase project exists. Nothing here has been applied to anything hosted.
