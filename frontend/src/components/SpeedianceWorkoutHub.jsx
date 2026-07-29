import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  ChevronRight,
  CloudDownload,
  Copy,
  Database,
  Dumbbell,
  ExternalLink,
  FileJson,
  Folder,
  FolderOpen,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Medal,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unplug,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  downloadWorkout,
  formatVolume,
  normalizeWorkoutImport,
  sortLeaderboard,
} from "../lib/workoutHub.js";
import samWorkouts from "../data/samWorkouts.json";

// The hub backend is optional. With no PUBLIC_WORKOUT_HUB_API_URL set at build
// time the page runs as a static catalogue: it makes no network calls at all,
// so a public build never reports a failed connection to a backend that is not
// deployed. Account connect additionally requires PUBLIC_WORKOUT_HUB_CONNECT.
const API_BASE = import.meta.env.PUBLIC_WORKOUT_HUB_API_URL || "";
const HUB_ONLINE = API_BASE !== "";
const CONNECT_ENABLED =
  HUB_ONLINE && import.meta.env.PUBLIC_WORKOUT_HUB_CONNECT === "true";
const SESSION_KEY = "speediance-workout-hub-session";


const defaultTobyWorkouts = [
  {
    id: "06e4426a-7814-4511-a18a-835153eb5cbc",
    name: "Warrior 2",
    creator_name: "Toby",
    description: "High volume full body strength routine focused on woodchops, rows, press, and flyes.",
    provider_template_code: "68ca84868f086c639f98d40f",
    link: "https://web2.speediance.com/redirectApp?code=68ca84868f086c639f98d40f&language=en&version=40004",
    code: "68ca84868f086c639f98d40f",
    athlete_count: 2,
    top_volume_lbs: 22060,
    exercises: [
      { id: 372737573519361, title: "Standing High-to-Low Woodchops", preset: 3, sets: [{ reps: 13, weight: 15.0 }] },
      { id: 337, title: "Standing Barbell Triceps Push Down", preset: 3, sets: [{ reps: 13, weight: 15.0 }] },
      { id: 3026, title: "Kneeling Dual-Handle High to Low Chest Fly", preset: 3, sets: [{ reps: 13, weight: 15.0 }] },
      { id: 168, title: "Kneeling Dual-Handle Underhand Lat Pulldown", preset: 3, sets: [{ reps: 13, weight: 15.0 }] },
      { id: 420214528147457, title: "Half Kneeling Single-Arm Row", preset: 3, sets: [{ reps: 13, weight: 20.0 }] },
      { id: 390525763518465, title: "Standing Single-Arm Low-to-High Chest Press", preset: 3, sets: [{ reps: 13, weight: 20.0 }] },
      { id: 372788699987969, title: "Pallof Press", preset: 3, sets: [{ reps: 13, weight: 20.0 }] },
      { id: 533, title: "Standing Alternating Chest Press", preset: 3, sets: [{ reps: 13, weight: 20.0 }] }
    ]
  },
  {
    id: "toby-warrior-1",
    name: "Warrior 1",
    creator_name: "Toby",
    description: "Core conditioning and upper body hypertrophy split.",
    provider_template_code: "68b6d5cc8f08c917c22418db",
    link: "https://web2.speediance.com/redirectApp?code=68b6d5cc8f08c917c22418db&language=en&version=40004",
    code: "68b6d5cc8f08c917c22418db",
    athlete_count: 1,
    top_volume_lbs: 18500,
    exercises: [
      { id: 189, title: "Dual Handle Alternating Bench Press", preset: 3, sets: [{ reps: 13, weight: 20.0 }] },
      { id: 6, title: "Supine Dual-Handle Chest Fly", preset: 3, sets: [{ reps: 13, weight: 20.0 }] },
      { id: 10, title: "Seated Dual-Handle Front Raise", preset: 3, sets: [{ reps: 13, weight: 20.0 }] },
      { id: 93, title: "Seated Dual-Handle Lateral Raise", preset: 3, sets: [{ reps: 13, weight: 20.0 }] }
    ]
  },
  {
    id: "toby-chest-handles",
    name: "Chest handles",
    creator_name: "Toby",
    description: "Targeted chest flyes, presses, and core stability.",
    provider_template_code: "6908f1348f085f13ae4b7769",
    link: "https://web2.speediance.com/redirectApp?code=6908f1348f085f13ae4b7769&language=en&version=40004",
    code: "6908f1348f085f13ae4b7769",
    athlete_count: 1,
    top_volume_lbs: 16200,
    exercises: [
      { id: 6, title: "Supine Dual-Handle Chest Fly", preset: 3, sets: [{ reps: 12, weight: 25.0 }] },
      { id: 533, title: "Standing Alternating Chest Press", preset: 3, sets: [{ reps: 12, weight: 25.0 }] }
    ]
  },
  {
    id: "toby-arms-barbell",
    name: "Arms Barbell",
    creator_name: "Toby",
    description: "Barbell arm isolation workout for biceps curls and triceps extension.",
    provider_template_code: "69063cb28f085f13ae4b3b02",
    link: "https://web2.speediance.com/redirectApp?code=69063cb28f085f13ae4b3b02&language=en&version=40004",
    code: "69063cb28f085f13ae4b3b02",
    athlete_count: 1,
    top_volume_lbs: 14800,
    exercises: [
      { id: 416431106293761, title: "Seated Single-Arm Biceps Curl", preset: 3, sets: [{ reps: 12, weight: 20.0 }] },
      { id: 337, title: "Standing Barbell Triceps Push Down", preset: 3, sets: [{ reps: 12, weight: 20.0 }] }
    ]
  },
  {
    id: "toby-back-barbell",
    name: "Back Barbell",
    creator_name: "Toby",
    description: "Back thickness and lat pulldowns using Speediance smart cable resistance.",
    provider_template_code: "691fadec8f081ab0e81190d7",
    link: "https://web2.speediance.com/redirectApp?code=691fadec8f081ab0e81190d7&language=en&version=40004",
    code: "691fadec8f081ab0e81190d7",
    athlete_count: 1,
    top_volume_lbs: 17100,
    exercises: [
      { id: 168, title: "Kneeling Dual-Handle Underhand Lat Pulldown", preset: 3, sets: [{ reps: 12, weight: 25.0 }] },
      { id: 420214528147457, title: "Half Kneeling Single-Arm Row", preset: 3, sets: [{ reps: 12, weight: 25.0 }] }
    ]
  }
];

// A set carries weight_lb when it came from Speediance (stored in kg upstream).
// The bundled preset workouts store an RM counter instead, which has no unit.
const setLabel = (set) => {
  const reps = set.unit === "sec" ? `${set.reps}s` : `${set.reps}`;
  if (set.weight_lb != null) return `${reps} x ${set.weight_lb} lb`;
  return `${reps}x${set.weight}`;
};

const workoutVolumeLbs = (workout) => {
  if (workout.total_volume_lb != null) return Number(workout.total_volume_lb);
  return Number(workout.top_volume_lbs || 0);
};

// Speediance Manager compatible export, built entirely from bundled data.
const buildExportPayload = (workout) => ({
  format: "tobyonfitnesstech.speediance-workout.v1",
  name: workout.name,
  description: workout.description || "",
  source_code: workout.code || workout.provider_template_code || null,
  source_link: workout.link || null,
  creator: workout.creator_name || null,
  weight_unit: 0,
  exercises: (workout.exercises || []).map((exercise) => ({
    id: exercise.group_id ?? exercise.id,
    action_library_id: exercise.id,
    title: exercise.title,
    preset: exercise.preset,
    sets: (exercise.sets || []).map((set) => ({
      reps: set.reps,
      weight: set.weight,
      mode: set.mode ?? 1,
      rest: set.rest ?? 60,
      unit: set.unit || "reps",
    })),
  })),
});

const tabs = [
  { id: "library", label: "Workout Library", icon: Dumbbell },
  ...(HUB_ONLINE
    ? [
        { id: "leaderboard", label: "Leaderboard", icon: Trophy },
        { id: "share", label: "Share Workout", icon: ArrowUpFromLine },
      ]
    : []),
  ...(CONNECT_ENABLED ? [{ id: "account", label: "Connect", icon: Link2 }] : []),
];

// Sam's programs are resolved from Speediance at build time by
// backend/scripts/fetch_sam_workouts.py, so weights, sets and volumes are the
// real template values rather than a bare share code.
const samWorkoutCount = samWorkouts.length;
const samResolvedCount = samWorkouts.filter((item) => !item.unavailable).length;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export default function SpeedianceWorkoutHub() {
  const [activeTab, setActiveTab] = useState("library");
  const [workouts, setWorkouts] = useState(defaultTobyWorkouts);
  const [selectedId, setSelectedId] = useState("06e4426a-7814-4511-a18a-835153eb5cbc");
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [imported, setImported] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [accordionOpen, setAccordionOpen] = useState({ toby: true, sam: true });
  const [samSubAccordions, setSamSubAccordions] = useState({
    "Initial Batch": true,
    "90day Hypertrophy Challenge 2.0": false,
    "Upper Lower Split": false,
  });
  const [connectForm, setConnectForm] = useState({
    email: "",
    password: "",
    region: "Global",
  });

  const api = async (path, options = {}, useToken = true) => {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };
    if (useToken && token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const detail = Array.isArray(payload.detail)
        ? payload.detail.map((item) => item.msg).join(" ")
        : payload.detail;
      throw new Error(detail || `Request failed (${response.status})`);
    }
    if (response.status === 204) return null;
    return response.json();
  };

  const loadWorkouts = async () => {
    try {
      const data = await api("/workouts", {}, false);
      if (Array.isArray(data) && data.length > 0) {
        setWorkouts(data);
        setSelectedId((current) => current || data[0]?.id || null);
      }
    } catch {
      // Keep static fallback
    }
  };

  useEffect(() => {
    if (!CONNECT_ENABLED) return;
    const saved = window.sessionStorage.getItem(SESSION_KEY) || "";
    setToken(saved);
  }, []);


  useEffect(() => {
    if (!HUB_ONLINE) return undefined;
    let cancelled = false;
    const boot = async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(`${API_BASE}/workouts`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setWorkouts(data);
            setSelectedId(data[0]?.id || null);
          }
        }
      } catch {
        // Quiet fallback to embedded pre-loaded static workouts
        if (!cancelled) {
          setWorkouts(defaultTobyWorkouts);
          setSelectedId(defaultTobyWorkouts[0]?.id || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }
    let cancelled = false;
    api("/me")
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) {
          window.sessionStorage.removeItem(SESSION_KEY);
          setToken("");
          setMe(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!HUB_ONLINE || !selectedId) {
      setLeaderboard([]);
      return undefined;
    }
    let cancelled = false;
    api(`/workouts/${selectedId}/leaderboard`, {}, false)
      .then((data) => {
        if (!cancelled) setLeaderboard(sortLeaderboard(data));
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const redirectLinks = useMemo(
    () => ({
      "Warrior 2": "https://web2.speediance.com/redirectApp?code=68ca84868f086c639f98d40f&language=en&version=40004",
      "Warrior 1": "https://web2.speediance.com/redirectApp?code=68b6d5cc8f08c917c22418db&language=en&version=40004",
      "Chest handles": "https://web2.speediance.com/redirectApp?code=6908f1348f085f13ae4b7769&language=en&version=40004",
      "Arms Barbell": "https://web2.speediance.com/redirectApp?code=69063cb28f085f13ae4b3b02&language=en&version=40004",
      "Back Barbell": "https://web2.speediance.com/redirectApp?code=691fadec8f081ab0e81190d7&language=en&version=40004",
    }),
    [],
  );

  const formattedSamBatches = useMemo(() => {
    const batchesMap = {};
    samWorkouts.forEach((item) => {
      const batchName = item.batch || "General Programs";
      if (!batchesMap[batchName]) batchesMap[batchName] = [];
      batchesMap[batchName].push(item);
    });
    return Object.entries(batchesMap).map(([name, list]) => ({
      name,
      workouts: [...list].sort((a, b) => a.index - b.index),
    }));
  }, []);

  const formattedTobyWorkouts = useMemo(
    () =>
      workouts.map((w) => ({
        ...w,
        creator_name: "Toby",
        link: redirectLinks[w.name] || (w.provider_template_code ? `https://web2.speediance.com/redirectApp?code=${w.provider_template_code}&language=en&version=40004` : null),
        code: w.provider_template_code || w.code || null,
        is_sam: false,
      })),
    [workouts, redirectLinks],
  );

  const filteredToby = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return formattedTobyWorkouts;
    return formattedTobyWorkouts.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)),
    );
  }, [formattedTobyWorkouts, query]);

  const filteredSamBatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return formattedSamBatches;
    return formattedSamBatches
      .map((batch) => {
        const filteredWorkouts = batch.workouts.filter((w) =>
          [w.name, w.batch, w.code, w.description]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(q)),
        );
        return {
          ...batch,
          workouts: filteredWorkouts,
        };
      })
      .filter((batch) => batch.workouts.length > 0);
  }, [formattedSamBatches, query]);

  const allAvailableWorkouts = useMemo(() => {
    const samFlat = formattedSamBatches.flatMap((b) => b.workouts);
    return [...formattedTobyWorkouts, ...samFlat];
  }, [formattedTobyWorkouts, formattedSamBatches]);

  const selected = useMemo(
    () => allAvailableWorkouts.find((w) => w.id === selectedId) || allAvailableWorkouts[0] || null,
    [allAvailableWorkouts, selectedId],
  );

  const totalExerciseCount = useMemo(
    () =>
      allAvailableWorkouts.reduce(
        (total, workout) => total + (workout.exercises ? workout.exercises.length : 0),
        0,
      ),
    [allAvailableWorkouts],
  );

  const heaviestVolumeLbs = useMemo(
    () =>
      allAvailableWorkouts.reduce(
        (best, workout) => Math.max(best, workoutVolumeLbs(workout)),
        0,
      ),
    [allAvailableWorkouts],
  );

  // #sam-31 style fragments select a program directly, so a single workout can
  // be linked to without the visitor hunting through the accordions.
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (!fromHash) return;
    const match = allAvailableWorkouts.find((item) => item.id === fromHash);
    if (match) {
      setSelectedId(match.id);
      if (match.batch) {
        setSamSubAccordions((prev) => ({ ...prev, [match.batch]: true }));
      }
    }
    // Runs once the static catalogue is available.
  }, [allAvailableWorkouts.length]);

  useEffect(() => {
    if (!selectedId) return;
    window.history.replaceState(null, "", `#${selectedId}`);
  }, [selectedId]);

  const run = async (label, action) => {
    setBusy(label);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const connect = (event) => {
    event.preventDefault();
    run("connect", async () => {
      const payload = {
        email: connectForm.email,
        password: connectForm.password,
        region: connectForm.region || "Global",
        display_name: connectForm.email ? connectForm.email.split("@")[0] : "Toby",
        device_type: 1,
        unit: 1,
      };
      const result = await api(
        "/connect",
        { method: "POST", body: JSON.stringify(payload) },
        false,
      );
      window.sessionStorage.setItem(SESSION_KEY, result.session_token);
      setConnectForm((current) => ({ ...current, password: "" }));
      setToken(result.session_token);
      setMe({
        id: result.user_id,
        display_name: result.display_name,
        expires_at: result.expires_at,
      });
      setNotice(
        "Speediance connected. Your password was discarded after login.",
      );
      setActiveTab("library");
    });
  };

  const disconnect = () =>
    run("disconnect", async () => {
      await api("/connection", { method: "DELETE" });
      window.sessionStorage.removeItem(SESSION_KEY);
      setToken("");
      setMe(null);
      setNotice(
        "Speediance connection removed from this browser and the credential vault.",
      );
    });

  const install = (workoutId) => {
    if (!CONNECT_ENABLED) {
      setNotice(
        "Direct install is off while the hub backend is offline. Use the JSON export or open the program in the Speediance app.",
      );
      return;
    }
    if (!me) {
      setActiveTab("account");
      setNotice("Connect your Speediance account before installing a workout.");
      return;
    }
    run(`install-${workoutId}`, async () => {
      await api(`/workouts/${workoutId}/install`, { method: "POST" });
      setNotice("Workout installed to your Speediance custom workout library.");
    });
  };

  // Sam's and the bundled workouts carry their full structure client side, so
  // JSON export needs no backend. Only server-published workouts round-trip.
  const exportJson = (workoutId) =>
    run(`export-${workoutId}`, async () => {
      const local = allAvailableWorkouts.find((item) => item.id === workoutId);
      if (local && Array.isArray(local.exercises) && local.exercises.length > 0) {
        downloadWorkout(buildExportPayload(local));
        return;
      }
      if (!HUB_ONLINE) {
        throw new Error("This workout has no structure available to export.");
      }
      const payload = await api(`/workouts/${workoutId}/export`, {}, false);
      downloadWorkout(payload);
    });

  const sync = () =>
    run("sync", async () => {
      const result = await api("/sync", {
        method: "POST",
        body: JSON.stringify({
          start_date: daysAgoIso(90),
          end_date: todayIso(),
        }),
      });
      setNotice(
        `Synced ${result.imported} verified completions from your Speediance history.`,
      );
      await loadWorkouts();
      if (selectedId) {
        const updatedLeaderboard = await api(
          `/workouts/${selectedId}/leaderboard`,
          {},
          false,
        );
        setLeaderboard(sortLeaderboard(updatedLeaderboard));
      }
    });

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      const normalized = normalizeWorkoutImport(parsed);
      setImported({ payload: normalized });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read workout file",
      );
    }
  };

  const publishImport = () => {
    if (!imported) return;
    run("publish", async () => {
      const created = await api("/workouts", {
        method: "POST",
        body: JSON.stringify(imported.payload),
      });
      setNotice(`Workout "${created.name}" published to the shared hub.`);
      setImported(null);
      await loadWorkouts();
      setSelectedId(created.id);
      setActiveTab("library");
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] font-sans text-neutral-100 antialiased">
      <section className="relative border-b border-white/[0.08] bg-gradient-to-b from-orange-500/10 via-transparent to-transparent py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">
                <Database size={13} />
                Speediance Workout Hub
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Share custom workouts. Compete on real data.
              </h1>
              <p className="mt-4 text-lg text-neutral-400">
                Export community routines, install workouts to your device,
                and sync verified volume to the global leaderboard.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat value={allAvailableWorkouts.length} label="Workouts" />
              <Stat value={totalExerciseCount.toLocaleString("en-US")} label="Exercises" />
              <Stat
                value={formatVolume(heaviestVolumeLbs).replace(" lb", "")}
                label="Top volume lb"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === id ? "bg-white/[0.09] text-white" : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {me ? (
              <>
                <span className="inline-flex items-center gap-2 text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {me.display_name} connected
                </span>
                <button
                  type="button"
                  onClick={sync}
                  disabled={Boolean(busy)}
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-neutral-200 hover:bg-white/[0.07] disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={busy === "sync" ? "animate-spin" : ""}
                  />{" "}
                  Sync 90 days
                </button>
              </>
            ) : CONNECT_ENABLED ? (
              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"
              >
                <LockKeyhole size={15} />
                Connect Speediance
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-neutral-400">
                <Unplug size={14} className="text-neutral-500" />
                Account connect is off — browse, export JSON, or open in the app
              </span>
            )}
          </div>
        </div>

        {error && <Banner tone="error">{error}</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}

        {activeTab === "library" && (
          <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
            <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="border-b border-white/[0.06] p-4">
                <label className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-neutral-400 focus-within:border-orange-400/50">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search workouts, batches, or codes"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                  />
                </label>
              </div>
              <div className="max-h-[680px] overflow-y-auto divide-y divide-white/[0.05]">
                {loading && <Loading label="Loading workout library" />}

                {/* Toby Accordion Section */}
                <div className="border-b border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setAccordionOpen((prev) => ({ ...prev, toby: !prev.toby }))}
                    className="flex w-full items-center justify-between bg-white/[0.04] px-4 py-3.5 text-left font-semibold text-white hover:bg-white/[0.07] transition"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                      <UserRoundCheck size={16} className="text-orange-400" />
                      Toby ({filteredToby.length})
                    </span>
                    {accordionOpen.toby ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
                  </button>
                  {accordionOpen.toby && (
                    <div className="divide-y divide-white/[0.04]">
                      {filteredToby.map((workout) => (
                        <button
                          key={workout.id}
                          type="button"
                          onClick={() => setSelectedId(workout.id)}
                          className={`w-full p-4 text-left transition ${selectedId === workout.id ? "bg-orange-500/[0.09]" : "hover:bg-white/[0.035]"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-medium text-white">{workout.name}</h3>
                              <p className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-500">
                                {workout.description || "Community custom workout"}
                              </p>
                            </div>
                            <ChevronRight
                              size={17}
                              className={selectedId === workout.id ? "text-orange-400" : "text-neutral-700"}
                            />
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                            <span>{workout.exercises ? workout.exercises.length : 0} exercises</span>
                            <span>·</span>
                            <span>{workout.athlete_count || 0} completed</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sam Accordion Section with Nested Sub-Accordions per Batch */}
                <div className="border-b border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setAccordionOpen((prev) => ({ ...prev, sam: !prev.sam }))}
                    className="flex w-full items-center justify-between bg-white/[0.04] px-4 py-3.5 text-left font-semibold text-white hover:bg-white/[0.07] transition"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                      <Users size={16} className="text-orange-400" />
                      Sam ({samWorkoutCount})
                    </span>
                    {accordionOpen.sam ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
                  </button>
                  {accordionOpen.sam && (
                    <div className="divide-y divide-white/[0.04]">
                      {filteredSamBatches.map((batch) => {
                        const isOpen = Boolean(samSubAccordions[batch.name]);
                        return (
                          <div key={batch.name} className="bg-black/20">
                            <button
                              type="button"
                              onClick={() =>
                                setSamSubAccordions((prev) => ({
                                  ...prev,
                                  [batch.name]: !prev[batch.name],
                                }))
                              }
                              className="flex w-full items-center justify-between px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-orange-300/90 hover:bg-white/[0.03] transition"
                            >
                              <span className="flex items-center gap-2">
                                {isOpen ? <FolderOpen size={14} className="text-orange-400" /> : <Folder size={14} className="text-orange-400/70" />}
                                {batch.name} ({batch.workouts.length})
                              </span>
                              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {isOpen && (
                              <div className="divide-y divide-white/[0.03] pl-2">
                                {batch.workouts.map((workout) => (
                                  <button
                                    key={workout.id}
                                    type="button"
                                    onClick={() => setSelectedId(workout.id)}
                                    className={`w-full p-3.5 text-left transition ${selectedId === workout.id ? "bg-orange-500/[0.09]" : "hover:bg-white/[0.035]"}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <h4 className="truncate text-sm font-medium text-white">
                                          {workout.name}
                                        </h4>
                                        <p className="mt-0.5 text-xs text-neutral-500">
                                          #{workout.index} ·{" "}
                                          {workout.unavailable
                                            ? "no longer shared"
                                            : `${workout.exercises.length} exercises · ${formatVolume(workout.total_volume_lb)}`}
                                        </p>
                                      </div>
                                      <ChevronRight
                                        size={15}
                                        className={`shrink-0 ${selectedId === workout.id ? "text-orange-400" : "text-neutral-700"}`}
                                      />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
            <WorkoutDetail
              workout={selected}
              busy={busy}
              connected={Boolean(me)}
              copiedCode={copiedCode}
              onCopyCode={(code) => {
                navigator.clipboard.writeText(code);
                setCopiedCode(code);
                setTimeout(() => setCopiedCode(""), 2000);
              }}
              onInstall={install}
              onExport={exportJson}
              onLeaderboard={(id) => {
                setSelectedId(id);
                setActiveTab("leaderboard");
              }}
            />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-400">
                  Verified from Speediance
                </p>
                <h2 className="mt-1 text-2xl font-medium">
                  {selected?.name || "Choose a workout"}
                </h2>
              </div>
              <select
                value={selectedId || ""}
                onChange={(event) => setSelectedId(event.target.value)}
                className="hub-input w-auto min-w-[220px]"
              >
                {workouts.map((workout) => (
                  <option key={workout.id} value={workout.id}>
                    {workout.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <th className="p-4">Rank</th>
                    <th className="p-4">Athlete</th>
                    <th className="p-4">Verified Volume</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Finished</th>
                    <th className="p-4">Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leaderboard.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-neutral-500"
                      >
                        No verified completions recorded for this workout yet.
                      </td>
                    </tr>
                  )}
                  {leaderboard.map((entry) => (
                    <tr
                      key={`${entry.display_name}-${entry.completed_at}`}
                      className="hover:bg-white/[0.02]"
                    >
                      <td className="p-4">
                        <Rank rank={entry.rank} />
                      </td>
                      <td className="p-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          {entry.display_name}
                          {entry.verified && (
                            <ShieldCheck
                              size={15}
                              className="text-emerald-400"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-orange-300">
                        {formatVolume(entry.total_volume_lbs)}
                      </td>
                      <td className="p-4 text-neutral-400">
                        {Math.round(entry.duration_seconds / 60)} min
                      </td>
                      <td className="p-4 text-neutral-400">
                        {formatDate(entry.completed_at)}
                      </td>
                      <td className="p-4 text-neutral-400">
                        {entry.attempts || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "share" && (
          <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-400">
                Community publish
              </p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight">
                Share a Speediance custom workout
              </h2>
              <p className="mt-3 leading-7 text-neutral-400">
                Upload a JSON export from your Speediance web profile or another
                hub user.
              </p>

              <div className="mt-8">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.15] bg-black/20 p-8 text-center transition hover:border-orange-400/50 hover:bg-black/30">
                  <CloudDownload size={32} className="text-orange-400" />
                  <span className="mt-4 font-medium text-white">
                    Select a Speediance workout JSON file
                  </span>
                  <span className="mt-1 text-xs text-neutral-500">
                    Supports custom workout templates exported from Speediance.
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {imported && (
                <div className="mt-6 rounded-xl border border-orange-400/20 bg-orange-400/[0.05] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-orange-400/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-300">
                        Validated import
                      </span>
                      <h3 className="mt-2 text-lg font-medium text-white">
                        {imported.payload.name}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        {imported.payload.exercises.length} exercises ·{" "}
                        {imported.payload.weight_unit === 1 ? "lb" : "kg"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
              <h3 className="text-lg font-medium text-white">
                Workout preview
              </h3>
              {imported ? (
                <>
                  <div className="mt-4 space-y-2">
                    {imported.payload.exercises.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="rounded-lg border border-white/[0.06] bg-black/20 p-3 text-sm"
                      >
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {item.sets
                            .map((set) => `${set.reps}×${set.weight}`)
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={publishImport}
                    disabled={Boolean(busy)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
                  >
                    {busy === "publish" ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <ArrowUpFromLine size={17} />
                    )}
                    Publish to library
                  </button>
                </>
              ) : (
                <Empty
                  icon={FileJson}
                  title="No file selected"
                  body="Your validated workout preview will appear here."
                />
              )}
            </div>
          </section>
        )}

        {activeTab === "account" && (
          <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-400">
                Secure account link
              </p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight">
                Connect your Speediance account
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
                Your login is sent directly to the local Workout Hub backend to
                obtain a Speediance session. The password is immediately
                discarded. Only the provider session token is encrypted at rest.
              </p>
              {me ? (
                <div className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                  <div className="flex items-start gap-4">
                    <UserRoundCheck className="mt-0.5 text-emerald-400" />
                    <div>
                      <h3 className="font-medium text-white">
                        Connected as {me.display_name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">
                        You can install shared workouts and sync verified
                        completions.
                      </p>
                      <button
                        type="button"
                        onClick={disconnect}
                        disabled={Boolean(busy)}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                      >
                        <Unplug size={15} />
                        Disconnect and delete stored provider token
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={connect}
                  className="mt-8 grid gap-4 sm:grid-cols-2"
                >
                  <Field label="Speediance region">
                    <select
                      value={connectForm.region}
                      onChange={(event) =>
                        setConnectForm({
                          ...connectForm,
                          region: event.target.value,
                        })
                      }
                      className="hub-input"
                    >
                      <option value="Global">Global</option>
                      <option value="EU">Europe</option>
                    </select>
                  </Field>
                  <Field label="Speediance email">
                    <input
                      required
                      type="email"
                      autoComplete="username"
                      value={connectForm.email}
                      onChange={(event) =>
                        setConnectForm({
                          ...connectForm,
                          email: event.target.value,
                        })
                      }
                      className="hub-input"
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Speediance password">
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={connectForm.password}
                      onChange={(event) =>
                        setConnectForm({
                          ...connectForm,
                          password: event.target.value,
                        })
                      }
                      className="hub-input"
                      placeholder="••••••••••••"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={Boolean(busy)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
                    >
                      {busy === "connect" ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <LockKeyhole size={17} />
                      )}
                      Connect securely
                    </button>
                  </div>
                </form>
              )}
            </div>
            <div className="space-y-3">
              <SecurityItem
                icon={LockKeyhole}
                title="Password never stored"
                body="Used once for provider login and immediately discarded."
              />
              <SecurityItem
                icon={Database}
                title="Encrypted provider token"
                body="Fernet encryption with a server-only master key."
              />
              <SecurityItem
                icon={ShieldCheck}
                title="Device-verified results"
                body="Leaderboards accept completed sessions synced from Speediance—not manual entries."
              />
            </div>
          </section>
        )}
      </div>
      <style>{`.hub-input{width:100%;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.25);border-radius:6px;padding:.72rem .8rem;color:#f7f8f8;outline:none}.hub-input:focus{border-color:rgba(249,115,22,.65);box-shadow:0 0 0 3px rgba(249,115,22,.09)}.hub-input option{background:#151617}`}</style>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-lg bg-black/20 p-3 text-center">
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm text-neutral-300">
      <span className="mb-2 block font-medium">{label}</span>
      {children}
    </label>
  );
}

function Banner({ tone, children }) {
  return (
    <div
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${tone === "error" ? "border-red-400/25 bg-red-400/[0.08] text-red-200" : "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200"}`}
    >
      {children}
    </div>
  );
}

function Loading({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 p-12 text-sm text-neutral-500">
      <LoaderCircle size={18} className="animate-spin" />
      {label}
    </div>
  );
}

function Empty({ icon: Icon, title, body }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full border border-white/[0.08] bg-white/[0.03] p-4">
        <Icon size={24} className="text-neutral-500" />
      </div>
      <h3 className="mt-4 font-medium text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">{body}</p>
    </div>
  );
}

function SecurityItem({ icon: Icon, title, body }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <Icon size={20} className="text-orange-400" />
      <h3 className="mt-4 font-medium text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-neutral-500">{body}</p>
    </div>
  );
}

function Rank({ rank }) {
  const styles =
    rank === 1
      ? "bg-yellow-400/15 text-yellow-300"
      : rank === 2
        ? "bg-neutral-300/10 text-neutral-300"
        : rank === 3
          ? "bg-orange-500/15 text-orange-300"
          : "bg-white/[0.04] text-neutral-500";
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm ${styles}`}
    >
      {rank <= 3 ? <Medal size={16} /> : rank}
    </span>
  );
}

function WorkoutDetail({
  workout,
  busy,
  connected,
  copiedCode,
  onCopyCode,
  onInstall,
  onExport,
  onLeaderboard,
}) {
  if (!workout)
    return (
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <Empty
          icon={Dumbbell}
          title="Choose a workout"
          body="Select a shared workout to inspect its structure and leaderboard."
        />
      </section>
    );

  const hasStructure = Boolean(workout.exercises && workout.exercises.length > 0);

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-400">
              Shared by {workout.creator_name}
            </span>
            {workout.batch && (
              <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-medium text-orange-300">
                {workout.batch}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-3xl font-medium tracking-tight text-white">
            {workout.name}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
            {workout.description || "Community custom workout ready to export or install."}
          </p>

          {/* Program Code Snippet block */}
          {workout.code && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs text-neutral-500 font-medium">Program Code:</span>
              <div className="inline-flex min-w-0 items-center gap-2 rounded-md border border-white/[0.08] bg-black/40 px-3 py-1.5">
                <span className="truncate font-mono text-xs font-semibold text-orange-300">
                  {workout.code}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyCode(workout.code)}
                  className="p-1 text-neutral-400 hover:text-white transition"
                  title="Copy Program Code"
                >
                  {copiedCode === workout.code ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons: wrap on their own row instead of pushing the header wide */}
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
          {workout.link && (
            <a
              href={workout.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-3.5 py-2.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 hover:text-white transition shadow-sm"
            >
              <ExternalLink size={14} />
              Open in app
            </a>
          )}
          {CONNECT_ENABLED && (
            <button
              type="button"
              onClick={() => onInstall(workout.id)}
              disabled={Boolean(busy) || !hasStructure}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition"
            >
              {busy === `install-${workout.id}` ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <CloudDownload size={14} />
              )}
              {connected ? "Install to my device" : "Connect to install"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onExport(workout.id)}
            disabled={Boolean(busy) || !hasStructure}
            className="inline-flex items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-white/[0.07] disabled:opacity-50 transition"
          >
            {busy === `export-${workout.id}` ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <FileJson size={14} />
            )}
            JSON
          </button>
        </div>
      </div>

      {hasStructure ? (
        <>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={workout.exercises.length} label="Exercises" />
            <Stat
              value={workout.exercises.reduce(
                (total, exercise) => total + (exercise.sets ? exercise.sets.length : 0),
                0,
              )}
              label="Sets"
            />
            <Stat
              value={
                workout.duration_minutes
                  ? `${workout.duration_minutes} min`
                  : workout.athlete_count || 0
              }
              label={workout.duration_minutes ? "Duration" : "Finished"}
            />
            <Stat
              value={formatVolume(workoutVolumeLbs(workout)).replace(" lb", "")}
              label="Volume lb"
            />
          </div>
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
                Workout structure
              </h3>
              {HUB_ONLINE && (
                <button
                  type="button"
                  onClick={() => onLeaderboard(workout.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-300 hover:text-orange-200"
                >
                  <Users size={15} />
                  View leaderboard
                </button>
              )}
            </div>
            <div className="space-y-2">
              {workout.exercises.map((exercise, index) => (
                <div
                  key={`${exercise.id}-${index}`}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-3"
                >
                  <span className="font-mono text-xs text-neutral-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {exercise.title}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {exercise.sets.map(setLabel).join(" · ")}
                      {exercise.muscle ? ` · ${exercise.muscle}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/[0.07] px-2 py-1 font-mono text-[10px] text-neutral-500">
                    {exercise.preset === -1 ? "CUSTOM" : `RM${exercise.preset}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/30 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-orange-500/10 p-3 text-orange-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-white">
                {workout.unavailable
                  ? "This program is no longer shared"
                  : "Program redirect & mobile app sync"}
              </h4>
              <p className="mt-1 text-sm text-neutral-400 leading-relaxed">
                {workout.unavailable
                  ? "The code is kept here so the program can still be opened if the owner re-shares it:"
                  : "This routine is shared via Speediance's cloud program registry code:"}{" "}
                <span className="font-mono font-semibold text-orange-300">{workout.code}</span>.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={workout.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition"
                >
                  <ExternalLink size={14} />
                  Open in Speediance App
                </a>
                <button
                  type="button"
                  onClick={() => onCopyCode(workout.code)}
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/[0.08] transition"
                >
                  {copiedCode === workout.code ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  Copy Code ({workout.code})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
