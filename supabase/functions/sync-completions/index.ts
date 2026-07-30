/**
 * Import verified Speediance completions for the calling user.
 *
 * This function exists for exactly one reason: trust. Every other hub operation
 * can run in the browser, because the Speediance API is CORS-open. Completions
 * cannot. If the browser were allowed to write them, the leaderboard would be
 * self-reported and would mean nothing. So this is the only code holding the
 * service role key, `completions` grants no write privilege to anon or
 * authenticated, and a row can only exist because the code below fetched the
 * record from Speediance itself.
 *
 * A Speediance password never reaches this function. The browser logs in
 * directly and passes the resulting short-lived provider token.
 *
 * Ported from WorkoutHubService.sync_completions; the record filtering rules
 * are deliberately identical.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// An allowlist, not a caller-supplied host. Taking a URL from the request body
// would turn this function into an open proxy for its own service role key.
const HOSTS: Record<string, string> = {
  Global: "api2.speediance.com",
  EU: "euapi.speediance.com",
};

const MOBILE_DEVICES = JSON.stringify({
  brand: "google",
  device: "emulator64_x86_64_arm64",
  deviceType: "sdk_gphone64_x86_64",
  os: "",
  os_version: "31",
  manufacturer: "Google",
});

const KG_TO_LB = 2.2046226218;
const MAX_RANGE_DAYS = 90;

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("HUB_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/** Stable, unforgeable identifier for a provider account. */
const providerHash = async (appUserId: string): Promise<string> => {
  const salt = Deno.env.get("PROVIDER_HASH_SALT");
  if (!salt) throw new Error("PROVIDER_HASH_SALT is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${appUserId}`),
  );
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** The provider hands completion times back under several different keys. */
const finishedAt = (record: Record<string, unknown>): string | null => {
  const raw = record.finishTime ?? record.endTime ?? record.date ?? record.startTime;
  if (raw === null || raw === undefined || raw === "") return null;
  let text = String(raw);
  if (!text.includes("T") && text.includes(" ")) text = text.replace(" ", "T");
  // Naive timestamps are treated as UTC, matching the Python importer.
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) text = `${text}Z`;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
};

const durationSeconds = (record: Record<string, unknown>): number => {
  if (record.durationMinute !== null && record.durationMinute !== undefined) {
    return Math.trunc(Number(record.durationMinute) * 60);
  }
  return Math.trunc(
    Number(record.trainingTime ?? record.duration ?? record.totalTime ?? 0),
  );
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Authentication required" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON body" }, 400);
  }

  const {
    provider_token: providerToken,
    app_user_id: appUserId,
    region = "Global",
    unit = 1,
    start_date: startDate,
    end_date: endDate,
  } = body as Record<string, string | number>;

  if (!providerToken || !appUserId) {
    return json({ error: "Connect your Speediance account before syncing" }, 400);
  }
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return json({ error: "Sync dates must be real ISO calendar dates" }, 422);
  }
  if (startDate > endDate) {
    return json({ error: "Start date must not be after end date" }, 422);
  }
  const spanDays =
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000;
  if (spanDays > MAX_RANGE_DAYS) {
    return json({ error: `Sync range cannot exceed ${MAX_RANGE_DAYS} days` }, 422);
  }
  const host = HOSTS[String(region)];
  if (!host) return json({ error: "Unknown Speediance region" }, 422);

  // Who is calling? Resolved from the caller's own JWT, never from the body.
  const asCaller = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: auth, error: authError } = await asCaller.auth.getUser();
  if (authError || !auth?.user) return json({ error: "Authentication required" }, 401);
  const userId = auth.user.id;

  // The service client is the only writer of completions.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Bind this provider account to this profile, and refuse if another profile
  // already claimed it — otherwise two hub accounts could import one history.
  let hash: string;
  try {
    hash = await providerHash(String(appUserId));
  } catch {
    return json({ error: "The sync service is misconfigured" }, 500);
  }
  const { data: existingLink } = await admin
    .from("speediance_links")
    .select("user_id")
    .eq("provider_user_hash", hash)
    .maybeSingle();
  if (existingLink && existingLink.user_id !== userId) {
    return json({ error: "That Speediance account is linked to another profile" }, 409);
  }
  await admin.from("speediance_links").upsert(
    {
      user_id: userId,
      provider_user_hash: hash,
      region: String(region),
      unit: Number(unit),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Fetch the history from Speediance with the caller's own provider token.
  const query = new URLSearchParams({ startDate, endDate });
  let payload: { code?: number; message?: string; data?: unknown };
  try {
    const response = await fetch(
      `https://${host}/api/mobile/v2/report/userTrainingDataRecord?${query}`,
      {
        headers: {
          Timestamp: String(Date.now()),
          Versioncode: "40304",
          Mobiledevices: MOBILE_DEVICES,
          "Content-Type": "application/json",
          App_type: "SOFTWARE",
          "Accept-Language": "en",
          App_user_id: String(appUserId),
          Token: String(providerToken),
        },
      },
    );
    if (response.status === 401 || response.status === 403) {
      return json({ error: "Your Speediance session expired. Connect again." }, 401);
    }
    if (!response.ok) {
      return json({ error: "Speediance is temporarily unreachable" }, 502);
    }
    payload = await response.json();
  } catch {
    return json({ error: "Speediance is temporarily unreachable" }, 502);
  }
  // The provider returns HTTP 200 with a non-zero `code` for business errors.
  if (payload.code !== 0 && payload.code !== null && payload.code !== undefined) {
    return json({ error: payload.message ?? "Speediance rejected the request" }, 502);
  }
  const records = Array.isArray(payload.data) ? payload.data as Record<string, unknown>[] : [];

  // Which routines does this athlete actually have installed?
  const { data: installs, error: installError } = await admin
    .from("workout_installs")
    .select("workout_id, provider_template_id, workouts(name)")
    .eq("user_id", userId)
    .eq("status", "installed");
  if (installError) return json({ error: "Could not read your installed workouts" }, 500);

  const installed = (installs ?? []).map((row) => ({
    workoutId: row.workout_id as string,
    templateId: row.provider_template_id as string | null,
    // deno-lint-ignore no-explicit-any
    name: String((row as any).workouts?.name ?? ""),
  }));

  const accountUnit = Number(unit);
  const rows: Record<string, unknown>[] = [];

  for (const record of records) {
    if (record.isFinish !== null && record.isFinish !== undefined && Number(record.isFinish) !== 1) {
      continue;
    }

    // Prefer the provider template id; fall back to the title for routines the
    // athlete already owned. An ambiguous match is skipped, never guessed.
    const templateId = record.templateId;
    const candidates = templateId !== null && templateId !== undefined && templateId !== ""
      ? installed.filter((item) => item.templateId && String(templateId) === item.templateId)
      : installed.filter((item) => item.name === String(record.title ?? "").trim());
    if (candidates.length !== 1) continue;

    const providerRecordId = String(record.trainingId ?? record.id ?? "");
    if (!providerRecordId) continue;

    const rawCapacity = Number(record.totalCapacity ?? 0);
    const seconds = durationSeconds(record);
    const completedAt = finishedAt(record);
    if (!completedAt || !Number.isFinite(rawCapacity) || !Number.isFinite(seconds)) continue;

    const completedDate = completedAt.slice(0, 10);
    if (
      rawCapacity < 0 || seconds < 0 || seconds > 86_400 ||
      completedDate < startDate || completedDate > endDate
    ) {
      continue;
    }

    rows.push({
      user_id: userId,
      workout_id: candidates[0].workoutId,
      provider_record_id: providerRecordId,
      completed_at: completedAt,
      total_volume_lbs: accountUnit === 0 ? rawCapacity * KG_TO_LB : rawCapacity,
      duration_seconds: seconds,
      verified: true,
      provider_summary: {
        trainingId: record.trainingId ?? null,
        templateId: record.templateId ?? null,
        title: record.title ?? null,
        isFinish: record.isFinish ?? null,
        sourceUnit: accountUnit === 0 ? "kg" : "lb",
      },
    });
  }

  let imported = 0;
  if (rows.length > 0) {
    // Re-syncing an overlapping range is expected, so duplicates are ignored
    // rather than treated as an error.
    const { data: inserted, error: insertError } = await admin
      .from("completions")
      .upsert(rows, { onConflict: "user_id,provider_record_id", ignoreDuplicates: true })
      .select("id");
    if (insertError) return json({ error: "Could not save your completions" }, 500);
    imported = inserted?.length ?? 0;
  }

  return json({ scanned: records.length, imported });
});
