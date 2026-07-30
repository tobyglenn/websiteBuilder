/**
 * End-to-end exercise of the Supabase hub, driving the same calls the browser
 * makes: Speediance login -> hub-connect -> verifyOtp -> claim -> sync -> board.
 *
 * Credentials come from the environment and are never written anywhere:
 *   SPEEDIANCE_EMAIL / SPEEDIANCE_PASSWORD   (does a real login), or
 *   SPEEDIANCE_TOKEN / SPEEDIANCE_USER_ID    (skips login, uses a fresh token)
 *
 *   node e2e_hub.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const REGION = process.env.SPEEDIANCE_REGION || "Global";
const HOSTS = { Global: "api2.speediance.com", EU: "euapi.speediance.com" };
const host = HOSTS[REGION];

const MOBILE_DEVICES = JSON.stringify({
  brand: "google", device: "emulator64_x86_64_arm64", deviceType: "sdk_gphone64_x86_64",
  os: "", os_version: "31", manufacturer: "Google",
});

const step = (n, msg) => console.log(`\n[${n}] ${msg}`);
const ok = (msg) => console.log(`    ok   ${msg}`);
const bad = (msg) => { console.log(`    FAIL ${msg}`); process.exitCode = 1; };

const providerHeaders = (session) => {
  const h = {
    Timestamp: String(Date.now()), Versioncode: "40304", Mobiledevices: MOBILE_DEVICES,
    "Content-Type": "application/json", App_type: "SOFTWARE", "Accept-Language": "en",
  };
  if (session?.token) { h.Token = session.token; h.App_user_id = String(session.appUserId); }
  return h;
};

const provider = async (method, path, { session, body } = {}) => {
  const res = await fetch(`https://${host}${path}`, {
    method, headers: providerHeaders(session),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await res.json();
  if (payload && payload.code !== 0 && payload.code != null) {
    throw new Error(`Speediance: ${payload.message} (code ${payload.code})`);
  }
  return payload;
};

// ---------------------------------------------------------------------------

step(1, "Obtain a Speediance session");
let session;
if (process.env.SPEEDIANCE_TOKEN && process.env.SPEEDIANCE_USER_ID) {
  session = {
    token: process.env.SPEEDIANCE_TOKEN,
    appUserId: process.env.SPEEDIANCE_USER_ID,
    displayName: process.env.SPEEDIANCE_NAME || "Toby",
    region: REGION,
  };
  ok("using the supplied token");
} else if (process.env.SPEEDIANCE_EMAIL && process.env.SPEEDIANCE_PASSWORD) {
  const verify = await provider("POST", "/api/app/v2/login/verifyIdentity", {
    body: { type: 2, userIdentity: process.env.SPEEDIANCE_EMAIL },
  });
  if (verify.data?.isExist === false) throw new Error("No account for that email");
  const login = await provider("POST", "/api/app/v2/login/byPass", {
    body: { userIdentity: process.env.SPEEDIANCE_EMAIL, password: process.env.SPEEDIANCE_PASSWORD, type: 2 },
  });
  const d = login.data || {};
  session = {
    token: d.token, appUserId: d.userId ?? d.id, region: REGION,
    displayName: d.nickName || d.nickname || d.userName || "Toby",
  };
  if (!session.token) throw new Error("Login returned no token");
  ok(`logged in as ${session.displayName} (user ${session.appUserId})`);
} else {
  throw new Error("Set SPEEDIANCE_EMAIL+SPEEDIANCE_PASSWORD or SPEEDIANCE_TOKEN+SPEEDIANCE_USER_ID");
}

step(2, "Verify the token against the provider");
const templates = await provider(
  "GET", `/api/app/v4/customTrainingTemplate/appPage?pageNo=1&pageSize=-1&deviceTypes=1`, { session },
);
const list = Array.isArray(templates.data) ? templates.data : [];
ok(`${list.length} custom templates`);
if (list.length) console.log("    template keys:", Object.keys(list[0]).join(", "));

step(3, "Open a hub session via hub-connect (no supabase.co in this path)");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const { data: connectData, error: connectError } = await supabase.functions.invoke("hub-connect", {
  body: {
    provider_token: session.token, app_user_id: session.appUserId, region: REGION,
    display_name: session.displayName, device_type: 1, unit: Number(process.env.SPEEDIANCE_UNIT ?? 0),
  },
});
if (connectError) {
  const detail = await connectError.context?.json?.().catch(() => null);
  throw new Error(`hub-connect: ${detail?.error || connectError.message}`);
}
ok(`minted session for profile ${connectData.user_id} (${connectData.display_name})`);

const { error: otpError } = await supabase.auth.verifyOtp({
  token_hash: connectData.token_hash, type: "magiclink",
});
if (otpError) throw new Error(`verifyOtp: ${otpError.message}`);
const { data: sess } = await supabase.auth.getSession();
sess?.session ? ok("exchanged for a real session") : bad("no session after verifyOtp");

step(4, "Claim leaderboards for the account's own templates");
const claimed = [];
for (const t of list.slice(0, Number(process.env.CLAIM_LIMIT || 5))) {
  const detail = await provider(
    "GET", `/api/app/v4/customTrainingTemplate/detail?id=${t.id}`, { session },
  ).catch(() => null);
  const actions = detail?.data?.actionList || detail?.data?.actions || detail?.data?.groupList || [];
  const exercises = (Array.isArray(actions) ? actions : []).map((a) => ({
    id: a.actionLibraryId ?? a.id,
    group_id: a.groupId ?? a.group_id,
    title: a.actionName ?? a.name ?? a.title,
    sets: String(a.setsAndReps || "")
      .split(",").filter(Boolean).map((r) => ({ reps: Number(r) || 1 })),
  })).filter((e) => e.id && e.sets.length);

  if (!exercises.length) { console.log(`    skip  "${t.name}" — no readable exercise structure`); continue; }

  const { data, error } = await supabase.rpc("claim_or_publish_workout", {
    p_name: t.name, p_exercises: exercises, p_description: "",
    p_weight_unit: Number(process.env.SPEEDIANCE_UNIT ?? 0) === 0 ? 0 : 1,
    p_provider_template_id: String(t.id), p_provider_template_code: t.code || null,
  });
  if (error) { bad(`claim "${t.name}": ${error.message}`); continue; }
  const row = data?.[0];
  claimed.push({ name: t.name, id: row.workout_id });
  ok(`"${t.name}" -> ${row.matched_existing ? "joined existing" : "published new"} ${row.workout_id}`);
}

step(5, "Import completions via sync-completions (the only writer)");
const iso = (d) => d.toISOString().slice(0, 10);
const { data: syncData, error: syncError } = await supabase.functions.invoke("sync-completions", {
  body: {
    provider_token: session.token, app_user_id: session.appUserId, region: REGION,
    unit: Number(process.env.SPEEDIANCE_UNIT ?? 0),
    start_date: iso(new Date(Date.now() - 89 * 86400000)), end_date: iso(new Date()),
  },
});
if (syncError) {
  const detail = await syncError.context?.json?.().catch(() => null);
  bad(`sync: ${detail?.error || syncError.message}`);
} else {
  ok(`scanned ${syncData.scanned}, imported ${syncData.imported}`);
  if (syncData.scanned > 0 && syncData.imported === 0) {
    console.log("    NOTE: records were found but none matched an install — this is the");
    console.log("          record-matching path that has never been proven at runtime.");
  }
}

step(6, "Read the leaderboard back as an anonymous visitor");
const anon = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
for (const w of claimed) {
  const { data, error } = await anon.from("workout_leaderboard")
    .select("rank, display_name, total_volume_lbs, attempts").eq("workout_id", w.id);
  if (error) { bad(`leaderboard "${w.name}": ${error.message}`); continue; }
  console.log(`    ${w.name}: ${data.length} entr${data.length === 1 ? "y" : "ies"}` +
    (data.length ? ` — top ${Math.round(data[0].total_volume_lbs)} lb by ${data[0].display_name}` : ""));
}

step(7, "Confirm the integrity boundary still holds while signed in");
const { error: forgeError } = await supabase.from("completions").insert({
  user_id: connectData.user_id, workout_id: claimed[0]?.id,
  provider_record_id: "forged-e2e", completed_at: new Date().toISOString(),
  total_volume_lbs: 999999, duration_seconds: 60,
});
forgeError ? ok(`forged completion refused: ${forgeError.message}`) : bad("a signed-in client wrote a completion");

console.log("\ndone");
