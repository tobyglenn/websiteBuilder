/**
 * The hub's transport, over Supabase instead of the FastAPI backend.
 *
 * Everything except completions runs straight from the browser against
 * PostgREST, and RLS is the security boundary — the anon key below is public by
 * design and ships in the bundle. Only two things need server code: importing
 * completions (or the leaderboard would be self-reported) and opening a session.
 *
 * Nothing here ever redirects to <ref>.supabase.co. The hub session is minted by
 * the hub-connect function and exchanged in place, so a visitor only ever sees
 * this site's own origin during sign-in.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";

export const HUB_ONLINE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// The component renders once on the server at build time, where there is no
// window and no storage to bind to, so the client is created lazily.
let client = null;
const db = () => {
  if (!HUB_ONLINE || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // sessionStorage, not localStorage: closing the tab signs you out, which
        // is what the Connect panel has always promised.
        storage: window.sessionStorage,
        storageKey: "speediance-workout-hub-session",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
};

/** PostgREST reports RLS refusals as ordinary errors; make them readable. */
const fail = (error, fallback) => {
  if (!error) return;
  if (error.code === "28000" || /Authentication required/i.test(error.message || "")) {
    throw new Error(
      "Your leaderboard session has expired. Disconnect, then connect again to refresh it.",
    );
  }
  throw new Error(error.message || fallback);
};

export const isSignedIn = async () => {
  const supabase = db();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data?.session);
};

export const getMe = async () => {
  const supabase = db();
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
};

/**
 * The public catalogue, with the two derived fields the old API served:
 * who published it, and the best volume anyone has logged against it.
 */
export const listWorkouts = async () => {
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, description, exercises, weight_unit, owner_user_id, created_at, profiles(display_name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: true });
  fail(error, "Could not load the workout catalogue");

  const rows = data || [];
  const { data: tops } = await supabase
    .from("workout_leaderboard")
    .select("workout_id, total_volume_lbs")
    .eq("rank", 1);
  const bestByWorkout = new Map(
    (tops || []).map((row) => [row.workout_id, Number(row.total_volume_lbs)]),
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    exercises: row.exercises,
    weight_unit: row.weight_unit,
    creator_name: row.profiles?.display_name || null,
    top_volume_lbs: bestByWorkout.get(row.id) || 0,
  }));
};

export const getLeaderboard = async (workoutId) => {
  const supabase = db();
  if (!supabase || !workoutId) return [];
  const { data, error } = await supabase
    .from("workout_leaderboard")
    .select("rank, display_name, total_volume_lbs, duration_seconds, completed_at, verified, attempts")
    .eq("workout_id", workoutId)
    .order("rank", { ascending: true });
  if (error) return [];
  return data || [];
};

/** A single workout's full structure, shaped as the export format. */
export const exportWorkout = async (workoutId) => {
  const supabase = db();
  if (!supabase) throw new Error("The hub is not configured.");
  const { data, error } = await supabase
    .from("workouts")
    .select("name, description, exercises, weight_unit, profiles(display_name)")
    .eq("id", workoutId)
    .maybeSingle();
  fail(error, "Could not export that workout");
  if (!data) throw new Error("That workout is no longer in the catalogue.");
  return {
    format: "tobyonfitnesstech.speediance-workout.v1",
    name: data.name,
    description: data.description || "",
    source_code: null,
    source_link: null,
    creator: data.profiles?.display_name || null,
    weight_unit: data.weight_unit,
    exercises: data.exercises || [],
  };
};

/**
 * Join a leaderboard, publishing the routine first if nobody has yet. The
 * matching is done in Postgres so two simultaneous claims cannot both create a
 * near-duplicate entry.
 */
export const claimWorkout = async (payload) => {
  const supabase = db();
  if (!supabase) throw new Error("The hub is not configured.");
  const { data, error } = await supabase.rpc("claim_or_publish_workout", {
    p_name: payload.name,
    p_exercises: payload.exercises || [],
    p_description: payload.description || "",
    p_weight_unit: payload.weight_unit ?? 1,
    p_provider_template_id: payload.provider_template_id || null,
    p_provider_template_code: payload.source_code || null,
  });
  fail(error, "Could not join that leaderboard");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("The hub did not return a leaderboard entry.");
  return { id: row.workout_id, matched_existing: row.matched_existing };
};

/** Publishing an imported file is the same operation as claiming. */
export const publishWorkout = async (payload) => {
  const result = await claimWorkout(payload);
  return { id: result.id, name: payload.name, matched_existing: result.matched_existing };
};

/**
 * Open a hub session from a proven Speediance login. The provider token goes to
 * the function, which verifies it against Speediance before minting anything;
 * the password never leaves the browser.
 */
export const connect = async ({ providerSession, region, unit = 1, deviceType = 1 }) => {
  const supabase = db();
  if (!supabase) throw new Error("The hub is not configured.");

  const { data, error } = await supabase.functions.invoke("hub-connect", {
    body: {
      provider_token: providerSession.token,
      app_user_id: providerSession.appUserId,
      region: region || "Global",
      display_name: providerSession.displayName,
      device_type: deviceType,
      unit,
    },
  });
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message || "The hub refused the session.");
  }
  if (!data?.token_hash) throw new Error("The hub did not return a session.");

  // Exchanged against our own API host — no hosted auth page, no redirect.
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: "magiclink",
  });
  if (verifyError) throw new Error(verifyError.message || "Could not open a hub session.");

  return { id: data.user_id, display_name: data.display_name };
};

/**
 * End the hub session but keep the link row. Used when the provider token
 * expires: the account is still linked, only the browser's copy went stale.
 */
export const signOut = async () => {
  const supabase = db();
  if (!supabase) return;
  await supabase.auth.signOut();
};

/** Drop the link row as well as the session, so the account is fully released. */
export const disconnect = async () => {
  const supabase = db();
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const userId = data?.session?.user?.id;
  if (userId) {
    await supabase.from("speediance_links").delete().eq("user_id", userId);
  }
  await supabase.auth.signOut();
};

export const syncCompletions = async ({
  providerSession,
  region,
  unit = 1,
  startDate,
  endDate,
}) => {
  const supabase = db();
  if (!supabase) throw new Error("The hub is not configured.");
  const { data, error } = await supabase.functions.invoke("sync-completions", {
    body: {
      provider_token: providerSession.token,
      app_user_id: providerSession.appUserId,
      region: region || "Global",
      unit,
      start_date: startDate,
      end_date: endDate,
    },
  });
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message || "Sync failed.");
  }
  return data;
};
