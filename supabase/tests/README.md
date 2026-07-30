# Workout Hub on Supabase

Moves the leaderboard off the DGX so the public site has a backend without any
machine here being reachable from the internet.

## What moves and what doesn't

| Piece | Where it lives after |
| --- | --- |
| Speediance login, template fetch, install, share links | Browser, unchanged (`src/lib/speediance.js`) |
| Speediance password | Browser only — never sent to Supabase |
| Workouts, installs, completions, leaderboard | Supabase Postgres |
| Hub identity / sessions | Supabase Auth, but minted by `hub-connect` — see below |
| Completion import | `sync-completions` Edge Function |
| FastAPI + SQLite backend on DGX | Stays running until the hosted path is proven, then retires |

The Fernet `CredentialVault` disappears entirely — there is nothing left to
encrypt once passwords never leave the browser.

## Why sign-in looks unusual

There is no email/password form, no confirmation mail, and no redirect to
`<ref>.supabase.co`. That is deliberate: a credential step served from a domain
that is not the site the visitor is looking at is the shape Google Safe Browsing
flags as a deceptive site, and we have been on the wrong end of that
interstitial before on another project.

So the browser logs in to Speediance directly, hands `hub-connect` the resulting
short-lived provider token, and gets back a single-use `token_hash` that
`supabase.auth.verifyOtp` exchanges for a session in place. `generateLink` mints
that credential without delivering it anywhere — no mail is sent, and the
synthetic `@speediance.hub.invalid` address exists only because `auth.users`
requires one.

`hub-connect` verifies the provider token against Speediance before minting
anything. Without that check the `App_user_id` would just be a number in a
request body and anyone could open a session as anyone whose id they knew.

**The residual risk is not Supabase's.** The page asks for a *Speediance*
password on *tobyonfitnesstech.com*, and "credential form for a brand on a
domain that isn't that brand" is itself a phishing signature. What keeps it safe
is not dressing the form in Speediance's branding, saying plainly that the
credential goes straight to them, and keeping the site verified in Google Search
Console so a false positive is visible and can be sent for review.

## Files

- `migrations/20260730000000_workout_hub.sql` — tables, RLS, the fingerprint
  trigger, `claim_or_publish_workout()`, and the `workout_leaderboard` view.
- `functions/hub-connect/index.ts` — proves a Speediance login and opens a hub
  session.
- `functions/sync-completions/index.ts` — the only writer of `completions`.
- `tests/export_sqlite.py` — dumps the current DGX database as INSERTs.

## The integrity argument, in one paragraph

`completions` has a `select` policy and no write policy, and `insert, update,
delete` are revoked from `anon` and `authenticated` outright. The service role
key exists only inside the Edge Functions, and `sync-completions` fetches the
training records from Speediance itself using a provider token the caller
supplies. So a row in `completions` is evidence that Speediance reported that
session. A visitor can publish a workout and claim a leaderboard, but cannot
state their own numbers.

Two supporting details: the provider host is chosen from an allowlist rather
than taken from the request body (otherwise the function is an open proxy
carrying its own service role key), and the caller's identity comes from their
JWT rather than the body.

Both functions set `verify_jwt = false`, because `hub-connect` must be reachable
before a session exists and both do their own, stricter check on entry.

## Local development

The whole stack runs on the DGX under Docker, so it can be exercised before any
hosted project exists:

```bash
cd ~/.openclaw/workspace/websiteBuilder
~/bin/supabase start          # applies migrations, serves functions with hot reload
```

Services bind `0.0.0.0`, so a browser elsewhere on the LAN reaches the API at
`http://192.168.1.6:54321`. Secrets come from `supabase/.env` (gitignored) via
the `[edge_runtime.secrets]` block in `config.toml`.

**`supabase db reset` is broken in CLI 2.110.0** on this machine — it exits with
"Could not find the supabase-go binary required to bootstrap the local
database". Use `supabase stop && supabase start` for a clean re-apply.

Build the frontend against it:

```bash
cd frontend
PUBLIC_SUPABASE_URL=http://192.168.1.6:54321 \
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... \
PUBLIC_WORKOUT_HUB_CONNECT=true \
npx astro build
```

## Rollout to a hosted project

1. Create the project and `supabase link --project-ref …`.
2. `supabase db push` to apply the migration.
3. Set secrets — `PROVIDER_HASH_SALT` is any long random string, generated once
   and never rotated casually (rotating it orphans every existing link row):
   ```bash
   supabase secrets set PROVIDER_HASH_SALT="$(openssl rand -hex 32)"
   supabase secrets set HUB_ALLOWED_ORIGIN="https://tobyonfitnesstech.com"
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
   pre-populated by the platform; do not set them yourself.
4. `supabase functions deploy hub-connect sync-completions`.
5. Connect once through the site to create your profile, then seed:
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

## Behaviour changes worth knowing

- **Claiming gets correct under concurrency.** The Python version reads every
  public workout, fingerprints them in Python, then writes — two simultaneous
  claims can both miss and create duplicates. The partial unique index on
  `fingerprint` makes that impossible, and the race path in
  `claim_or_publish_workout()` resolves to the winner's row.
- **Fingerprints are recomputed, not carried over.** The SQL hash does not match
  the Python hash byte for byte; it only has to be self-consistent.
- **Connecting is still one action for the visitor.** One Speediance login opens
  both the provider session and the hub session, so the two-account split does
  not surface as two forms.
- **Publishing an imported file now dedupes.** It routes through
  `claim_or_publish_workout` rather than a bare insert, so importing a file for a
  routine somebody already shared joins that leaderboard instead of forking it.
- `total_volume_lbs` keeps its name and its kg→lb conversion on import.

## What has actually been tested

Schema and policies, against a throwaway `postgres:16` container using
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

Against the local stack:

- The migration applies on a fresh `supabase start`, and all four functions
  report `search_path=public` — the Security Advisor's
  `function_search_path_mutable` warning is pre-empted rather than triaged later.
- `hub-connect` runs, reads its salt, calls Speediance and answers a deliberately
  bogus token with `401 Speediance rejected that session`.
- Over the LAN with only the publishable key: reading `workouts` and
  `workout_leaderboard` succeeds; `POST /rest/v1/completions` is refused with
  `42501 permission denied for table completions`, at the grant level, before RLS
  is consulted.
- `astro build` completes and the emitted bundle carries the API URL, the
  publishable key, both function names, the claim RPC and the leaderboard view,
  with no reference left to the old `workout-hub` routes.

Not tested: a real end-to-end connect and sync, which needs an actual Speediance
login. The record-matching and import path in `sync-completions` remains unproven
at runtime.

## Not yet done

- No Supabase project exists. Nothing here has been applied to anything hosted.
- The DGX FastAPI backend still runs and still owns the live site's data.
