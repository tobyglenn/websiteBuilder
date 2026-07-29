/**
 * Direct browser client for the Speediance mobile API.
 *
 * Both regional hosts are CORS-open (verified 2026-07-29: `access-control-allow-
 * origin`, `-methods` and `-headers` all `*` on preflight, on GET and on
 * authenticated POST), so the visitor's browser talks to Speediance itself.
 * There is no server in this path: a password typed into the Connect form goes
 * to Speediance and nowhere else, and tobyonfitnesstech.com is a static site
 * that never sees it.
 *
 * backend/workout_hub/speediance_gateway.py stays the source of truth for the
 * request contract; this mirrors the subset the page needs.
 */

const HOSTS = {
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

const hostFor = (region) => HOSTS[region] || HOSTS.Global;

export class SpeedianceError extends Error {
  constructor(message) {
    super(message);
    this.name = "SpeedianceError";
  }
}

// Host and User-Agent are forbidden header names in a browser and get dropped.
// The provider ignores the User-Agent, so only the app headers below matter.
const providerHeaders = (session) => {
  const headers = {
    Timestamp: String(Date.now()),
    Versioncode: "40304",
    Mobiledevices: MOBILE_DEVICES,
    "Content-Type": "application/json",
    App_type: "SOFTWARE",
    "Accept-Language": "en",
  };
  if (session && session.token) {
    headers.Token = session.token;
    headers.App_user_id = String(session.appUserId || "");
  }
  return headers;
};

const request = async (region, method, path, { session, body } = {}) => {
  let response;
  try {
    response = await fetch(`https://${hostFor(region)}${path}`, {
      method,
      headers: providerHeaders(session),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new SpeedianceError(
      "Could not reach Speediance from this browser. Check your connection and try again.",
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new SpeedianceError(
      "Your Speediance session expired. Connect your account again.",
    );
  }
  if (!response.ok) {
    throw new SpeedianceError(`Speediance rejected the request (${response.status}).`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new SpeedianceError("Speediance returned an unreadable response.");
  }
  // The provider returns HTTP 200 with a non-zero `code` for business errors.
  if (payload && payload.code !== 0 && payload.code != null) {
    throw new SpeedianceError(payload.message || "Speediance rejected the request.");
  }
  return payload || {};
};

/**
 * Exchange an email and password for a provider session. Resolves to a session
 * object; the password is not retained by anything here.
 */
export const login = async ({ email, password, region = "Global" }) => {
  const verify = await request(region, "POST", "/api/app/v2/login/verifyIdentity", {
    body: { type: 2, userIdentity: email },
  });
  const identity = verify.data || {};
  if (identity.isExist === false) {
    throw new SpeedianceError("No Speediance account exists for that email address.");
  }
  if (identity.hasPwd === false) {
    throw new SpeedianceError(
      "That Speediance account has no password set — sign in with the app first.",
    );
  }

  let payload;
  try {
    payload = await request(region, "POST", "/api/app/v2/login/byPass", {
      body: { userIdentity: email, password, type: 2 },
    });
  } catch (error) {
    // Wrong-password responses come back as a provider business error; do not
    // leak the raw provider wording for a credential failure.
    throw new SpeedianceError("Invalid Speediance email or password.");
  }

  const data = payload.data || {};
  if (!data.token || !data.appUserId) {
    throw new SpeedianceError("Invalid Speediance email or password.");
  }
  return {
    token: String(data.token),
    appUserId: String(data.appUserId),
    region,
    deviceType: 1,
    displayName:
      data.nickName || data.nickname || data.userName || email.split("@")[0],
  };
};

/** Resolve a shared program code into its full upstream template detail. */
export const fetchTemplateByCode = async ({ session, code }) => {
  const payload = await request(
    session.region,
    "GET",
    `/api/app/v3/customTrainingTemplate/detailByCode?code=${encodeURIComponent(code)}`,
    { session },
  );
  const detail = payload.data;
  if (!detail || !Array.isArray(detail.actionLibraryList) || detail.actionLibraryList.length === 0) {
    throw new SpeedianceError(
      "This program is no longer shared on Speediance, so it cannot be installed.",
    );
  }
  return detail;
};

export const listUserTemplates = async ({ session }) => {
  const payload = await request(
    session.region,
    "GET",
    `/api/app/v4/customTrainingTemplate/appPage?pageNo=1&pageSize=-1&deviceTypes=${session.deviceType || 1}`,
    { session },
  );
  return Array.isArray(payload.data) ? payload.data : [];
};

// The per-set values the provider packs into comma separated strings. Passing
// the resolved template's own fields straight back through is what makes an
// install faithful: no reps, load or rest value is recomputed here.
const ACTION_FIELDS = [
  "setsAndReps",
  "breakTime",
  "breakTime2",
  "sportMode",
  "leftRight",
  "selectCompletionMethod",
  "completionMethod",
  "countType",
  "weights",
  "counterweight",
  "counterweight2",
  "level",
];

const toInstallAction = (action) => {
  const groupId = Number(action.groupId ?? action.group_id);
  const actionLibraryId = Number(action.actionLibraryId ?? action.action_library_id ?? action.id);
  if (!groupId || !actionLibraryId) {
    throw new SpeedianceError(
      "Speediance returned an exercise this page cannot install. Open the program in the app instead.",
    );
  }
  const mapped = {
    groupId,
    actionLibraryId,
    templatePresetId: Number(action.templatePresetId ?? -1),
    capacity: Number(action.capacity || 0),
  };
  ACTION_FIELDS.forEach((field) => {
    mapped[field] = action[field] == null ? "" : String(action[field]);
  });
  return mapped;
};

/**
 * Copy a shared program into the signed-in account's custom workout library.
 *
 * The program is resolved from its share code and re-posted as the visitor's
 * own template, so the installed copy carries the original's exact sets.
 */
export const installTemplate = async ({ session, code, name }) => {
  const detail = await fetchTemplateByCode({ session, code });
  const actions = [...detail.actionLibraryList]
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
    .map(toInstallAction);
  const templateName = name || detail.name || "Shared workout";
  const deviceType = Number(detail.deviceType ?? session.deviceType ?? 1);

  await request(session.region, "POST", "/api/app/v2/customTrainingTemplate", {
    session,
    body: {
      name: templateName,
      actionLibraryList: actions,
      totalCapacity: Number(
        detail.totalCapacity ??
          actions.reduce((total, action) => total + action.capacity, 0),
      ),
      deviceType,
      bgColor: 0,
    },
  });

  // Confirm the template really landed rather than trusting the write.
  const matches = (await listUserTemplates({ session })).filter(
    (template) => String(template.name || "") === templateName,
  );
  if (matches.length === 0) {
    throw new SpeedianceError(
      "Speediance accepted the workout but it is not showing in your library yet. Check the app.",
    );
  }
  const latest = matches.reduce(
    (best, template) => (Number(template.id || 0) > Number(best.id || 0) ? template : best),
    matches[0],
  );
  return { templateId: latest.id, templateCode: latest.code, name: templateName };
};
