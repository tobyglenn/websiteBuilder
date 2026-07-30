/**
 * Open a hub session for a proven Speediance account.
 *
 * Identity here is deliberately not email/password Supabase Auth. A hosted auth
 * page, a confirmation email or a redirect through <ref>.supabase.co all put a
 * credential step on a domain that is not the site the visitor is looking at,
 * and that is the exact shape Safe Browsing flags as a deceptive site. So the
 * browser only ever talks to this site's own origin: it logs in to Speediance
 * directly, hands this function the resulting short-lived provider token, and
 * gets back a single-use token_hash it exchanges for a session in place.
 *
 * No email is ever sent. The synthetic address below exists only because
 * auth.users requires one; nobody reads it and nothing is delivered to it.
 *
 * A Speediance password never reaches this function.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// An allowlist, not a caller-supplied host — same reasoning as sync-completions.
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

/**
 * GoTrue has no get-user-by-email, but its admin list endpoint filters on one.
 *
 * Needed because the auth user can outlive its link row: if the upsert below
 * ever fails after the user is created, the address -- derived from the salted
 * hash, so never re-derivable as anything else -- is taken forever, and the
 * account becomes a dead end nobody can connect again.
 */
const findUserIdByEmail = async (email: string): Promise<string | undefined> => {
  const base = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) return undefined;
  const response = await fetch(
    `${base}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!response.ok) return undefined;
  const payload = await response.json().catch(() => null);
  const match = (payload?.users ?? []).find(
    (user: { email?: string; id?: string }) => user.email === email,
  );
  return match?.id;
};

const cleanDisplayName = (value: unknown): string => {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  // profiles.display_name is checked for 1..60 characters.
  return text ? text.slice(0, 60) : "Athlete";
};

/**
 * Prove the caller holds a working token for the account they claim.
 *
 * Without this the App_user_id is just a number in a request body, and anyone
 * could open a session as anyone whose id they knew. A one-day report is the
 * cheapest call that exercises exactly the token/id pairing sync uses later.
 */
const providerTokenIsValid = async (
  host: string,
  appUserId: string,
  providerToken: string,
): Promise<boolean | null> => {
  const today = new Date().toISOString().slice(0, 10);
  const query = new URLSearchParams({ startDate: today, endDate: today });
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
          App_user_id: appUserId,
          Token: providerToken,
        },
      },
    );
    if (response.status === 401 || response.status === 403) return false;
    if (!response.ok) return null; // provider trouble, not a bad token
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload.code === "number" && payload.code !== 0) {
      // Speediance answers 200 with a non-zero code for a rejected token.
      return false;
    }
    return true;
  } catch {
    return null;
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

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
    display_name: displayName,
    device_type: deviceType = 1,
    unit = 1,
  } = body as Record<string, string | number>;

  if (!providerToken || !appUserId) {
    return json({ error: "Sign in to Speediance first" }, 400);
  }
  const host = HOSTS[String(region)];
  if (!host) return json({ error: "Unknown Speediance region" }, 422);

  const valid = await providerTokenIsValid(host, String(appUserId), String(providerToken));
  if (valid === false) {
    return json({ error: "Speediance rejected that session. Connect again." }, 401);
  }
  if (valid === null) {
    return json({ error: "Speediance is temporarily unreachable" }, 502);
  }

  let hash: string;
  try {
    hash = await providerHash(String(appUserId));
  } catch {
    return json({ error: "The hub is misconfigured" }, 500);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Returning visitor: the link row is the only thing that maps a provider
  // account back to a hub profile, since the hash is all we keep.
  const { data: link } = await admin
    .from("speediance_links")
    .select("user_id")
    .eq("provider_user_hash", hash)
    .maybeSingle();

  const name = cleanDisplayName(displayName);
  // Derived from the salted hash, so it leaks nothing about the real account.
  const email = `${hash.slice(0, 32)}@speediance.hub.invalid`;
  let userId = link?.user_id as string | undefined;

  if (!userId) {
    const { data: created } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: name },
    });
    userId = created?.user?.id ?? (await findUserIdByEmail(email));
    if (!userId) {
      return json({ error: "Could not open a hub account" }, 500);
    }
  }

  // Keep the link row fresh; on_auth_user_created already made the profile.
  const { error: linkError } = await admin.from("speediance_links").upsert(
    {
      user_id: userId,
      provider_user_hash: hash,
      region: String(region),
      device_type: Number(deviceType),
      unit: Number(unit),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (linkError) return json({ error: "Could not link that Speediance account" }, 500);

  // A name change on the Speediance side should follow through to the board.
  await admin.from("profiles").update({ display_name: name }).eq("id", userId);

  // generateLink mints the credential without delivering it anywhere: no mail
  // is sent, and the browser exchanges this for a session against our own API.
  const { data: linkData, error: otpError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (otpError || !tokenHash) {
    return json({ error: "Could not open a hub session" }, 500);
  }

  return json({ token_hash: tokenHash, user_id: userId, display_name: name });
});
