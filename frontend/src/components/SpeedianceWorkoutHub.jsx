import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, Check, ChevronRight, CloudDownload, Database,
  Dumbbell, FileJson, Link2, LoaderCircle, LockKeyhole, Medal, RefreshCw, Search,
  ShieldCheck, Trophy, Unplug, UserRoundCheck, Users,
} from 'lucide-react';
import { downloadWorkout, formatVolume, normalizeWorkoutImport, sortLeaderboard } from '../lib/workoutHub.js';

const API_BASE = import.meta.env.PUBLIC_WORKOUT_HUB_API_URL || 'http://127.0.0.1:8787/api/workout-hub';
const SESSION_KEY = 'speediance-workout-hub-session';

const tabs = [
  { id: 'library', label: 'Workout Library', icon: Dumbbell },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'share', label: 'Share Workout', icon: ArrowUpFromLine },
  { id: 'account', label: 'Connect', icon: Link2 },
];

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export default function SpeedianceWorkoutHub() {
  const [activeTab, setActiveTab] = useState('library');
  const [workouts, setWorkouts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [imported, setImported] = useState(null);
  const [connectForm, setConnectForm] = useState({ display_name: '', email: '', password: '', region: 'Global', device_type: 1 });

  const api = async (path, options = {}, useToken = true) => {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    if (useToken && token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const detail = Array.isArray(payload.detail)
        ? payload.detail.map((item) => item.msg).join(' ')
        : payload.detail;
      throw new Error(detail || `Request failed (${response.status})`);
    }
    if (response.status === 204) return null;
    return response.json();
  };

  const loadWorkouts = async () => {
    const data = await api('/workouts', {}, false);
    setWorkouts(data);
    setSelectedId((current) => current || data[0]?.id || null);
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SESSION_KEY) || '';
    setToken(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetch(`${API_BASE}/workouts`).then(async (response) => {
          if (!response.ok) throw new Error('Workout Hub backend is not running.');
          return response.json();
        });
        if (!cancelled) {
          setWorkouts(data);
          setSelectedId(data[0]?.id || null);
        }
      } catch (err) {
        if (!cancelled) setError(`${err.message} Start the local Workout Hub API on port 8787.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }
    api('/me').then(setMe).catch(() => {
      window.sessionStorage.removeItem(SESSION_KEY);
      setToken('');
      setMe(null);
    });
  }, [token]);

  useEffect(() => {
    if (!selectedId || activeTab !== 'leaderboard') return;
    api(`/workouts/${selectedId}/leaderboard`, {}, false)
      .then((data) => setLeaderboard(sortLeaderboard(data)))
      .catch((err) => setError(err.message));
  }, [selectedId, activeTab]);

  const selected = workouts.find((workout) => workout.id === selectedId) || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return workouts;
    return workouts.filter((workout) => `${workout.name} ${workout.description} ${workout.creator_name}`.toLowerCase().includes(needle));
  }, [query, workouts]);

  const run = async (name, task) => {
    setBusy(name);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  };

  const connect = (event) => {
    event.preventDefault();
    run('connect', async () => {
      const result = await api('/connect', { method: 'POST', body: JSON.stringify(connectForm) }, false);
      window.sessionStorage.setItem(SESSION_KEY, result.session_token);
      setConnectForm((current) => ({ ...current, password: '' }));
      setToken(result.session_token);
      setMe({ id: result.user_id, display_name: result.display_name, expires_at: result.expires_at });
      setNotice('Speediance connected. Your password was discarded after login.');
      setActiveTab('library');
    });
  };

  const disconnect = () => run('disconnect', async () => {
    await api('/connection', { method: 'DELETE' });
    window.sessionStorage.removeItem(SESSION_KEY);
    setToken('');
    setMe(null);
    setNotice('Speediance connection removed from this browser and the credential vault.');
  });

  const install = (workoutId) => {
    if (!me) {
      setActiveTab('account');
      setNotice('Connect your Speediance account before installing a workout.');
      return;
    }
    run(`install-${workoutId}`, async () => {
      await api(`/workouts/${workoutId}/install`, { method: 'POST' });
      setNotice('Workout installed to your Speediance custom workout library.');
    });
  };

  const exportJson = (workoutId) => run(`export-${workoutId}`, async () => {
    const payload = await api(`/workouts/${workoutId}/export`, {}, false);
    downloadWorkout(payload);
    setNotice('Workout JSON downloaded.');
  });

  const readImport = async (event) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setImported(normalizeWorkoutImport(parsed));
    } catch (err) {
      setImported(null);
      setError(err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message);
    }
  };

  const publishImport = () => {
    if (!me) {
      setActiveTab('account');
      setNotice('Connect your Speediance account before publishing a workout.');
      return;
    }
    run('publish', async () => {
      const created = await api('/workouts', { method: 'POST', body: JSON.stringify(imported) });
      setImported(null);
      await loadWorkouts();
      setSelectedId(created.id);
      setActiveTab('library');
      setNotice('Workout published to the community library.');
    });
  };

  const sync = () => run('sync', async () => {
    const result = await api('/sync', {
      method: 'POST',
      body: JSON.stringify({ start_date: daysAgoIso(90), end_date: todayIso() }),
    });
    await loadWorkouts();
    if (selectedId) setLeaderboard(sortLeaderboard(await api(`/workouts/${selectedId}/leaderboard`, {}, false)));
    setNotice(`Sync complete: ${result.imported} new verified completion${result.imported === 1 ? '' : 's'} imported.`);
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#08090a] text-[#f7f8f8]">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(249,115,22,0.14),transparent_38%),radial-gradient(circle_at_10%_30%,rgba(113,112,255,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
            <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-orange-300">Private prototype</span>
            <span>Community workouts · Device sync · Verified leaderboards</span>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                Share the workout. Prove the result.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                Import and publish custom Speediance workouts, install them directly to a connected machine, then rank actual completed sessions by verified training volume.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 shadow-2xl shadow-black/30">
              <Stat value={workouts.length} label="Workouts" />
              <Stat value={workouts.reduce((sum, workout) => sum + Number(workout.athlete_count || 0), 0)} label="Athletes" />
              <Stat value={workouts.length ? formatVolume(Math.max(...workouts.map((workout) => Number(workout.top_volume_lbs || 0)))).replace(' lb', '') : '0'} label="Top lb" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === id ? 'bg-white/[0.09] text-white' : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {me ? <><span className="inline-flex items-center gap-2 text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" />{me.display_name} connected</span>
              <button type="button" onClick={sync} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-neutral-200 hover:bg-white/[0.07] disabled:opacity-50">
                <RefreshCw size={15} className={busy === 'sync' ? 'animate-spin' : ''} /> Sync 90 days
              </button></> : <button type="button" onClick={() => setActiveTab('account')} className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"><LockKeyhole size={15} />Connect Speediance</button>}
          </div>
        </div>

        {error && <Banner tone="error">{error}</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}

        {activeTab === 'library' && (
          <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
            <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="border-b border-white/[0.06] p-4">
                <label className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-neutral-400 focus-within:border-orange-400/50">
                  <Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workouts or creators" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600" />
                </label>
              </div>
              <div className="max-h-[680px] divide-y divide-white/[0.05] overflow-y-auto">
                {loading && <Loading label="Loading workout library" />}
                {!loading && filtered.length === 0 && <Empty icon={Database} title="No shared workouts yet" body="Connect an account and import the first custom workout JSON." />}
                {filtered.map((workout) => (
                  <button key={workout.id} type="button" onClick={() => setSelectedId(workout.id)} className={`w-full p-4 text-left transition ${selectedId === workout.id ? 'bg-orange-500/[0.09]' : 'hover:bg-white/[0.035]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-medium text-white">{workout.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-500">{workout.description || 'Community custom workout'}</p></div>
                      <ChevronRight size={17} className={selectedId === workout.id ? 'text-orange-400' : 'text-neutral-700'} />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500"><span>{workout.exercises.length} exercises</span><span>·</span><span>{workout.athlete_count || 0} completed</span></div>
                  </button>
                ))}
              </div>
            </section>
            <WorkoutDetail workout={selected} busy={busy} connected={Boolean(me)} onInstall={install} onExport={exportJson} onLeaderboard={(id) => { setSelectedId(id); setActiveTab('leaderboard'); }} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-400">Verified from Speediance</p><h2 className="mt-1 text-2xl font-medium">{selected?.name || 'Choose a workout'}</h2></div>
              <select value={selectedId || ''} onChange={(event) => setSelectedId(event.target.value)} className="rounded-md border border-white/[0.08] bg-[#151617] px-3 py-2 text-sm text-white outline-none">
                {workouts.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}
              </select>
            </div>
            {leaderboard.length === 0 ? <Empty icon={Trophy} title="No verified finishes yet" body="Install this workout, complete it on Speediance, then run Sync." /> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-neutral-500"><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Athlete</th><th className="px-5 py-3 text-right">Best volume</th><th className="px-5 py-3 text-right">Duration</th><th className="px-5 py-3">Completed</th><th className="px-5 py-3">Source</th></tr></thead><tbody className="divide-y divide-white/[0.05]">{leaderboard.map((entry) => <tr key={entry.user_id} className="hover:bg-white/[0.025]"><td className="px-5 py-4"><Rank rank={entry.rank} /></td><td className="px-5 py-4 font-medium text-white">{entry.display_name}</td><td className="px-5 py-4 text-right font-mono text-base font-semibold text-orange-300">{formatVolume(entry.total_volume_lbs)}</td><td className="px-5 py-4 text-right text-neutral-400">{Math.round(entry.duration_seconds / 60)} min</td><td className="px-5 py-4 text-neutral-400">{formatDate(entry.completed_at)}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300"><ShieldCheck size={13} />Device verified</span></td></tr>)}</tbody></table></div>
            )}
          </section>
        )}

        {activeTab === 'share' && (
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <FileJson size={28} className="text-orange-400" /><h2 className="mt-5 text-2xl font-medium">Import custom workout JSON</h2><p className="mt-2 leading-7 text-neutral-400">Compatible with the existing Speediance Manager export shape. Validate it here, preview every movement, then publish it to the community.</p>
              <label className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.14] bg-black/20 p-6 text-center transition hover:border-orange-400/50 hover:bg-orange-400/[0.04]"><CloudDownload size={28} className="mb-3 text-neutral-400" /><span className="font-medium text-white">Choose a workout JSON file</span><span className="mt-1 text-sm text-neutral-500">Nothing uploads until you press Publish</span><input type="file" accept="application/json,.json" onChange={readImport} className="sr-only" /></label>
              <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/[0.06] p-4 text-sm leading-6 text-blue-200"><ShieldCheck size={17} className="mb-2" />Published files include workout structure only. Speediance credentials, tokens, personal workout history, and device identifiers are never included.</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              {imported ? <><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-emerald-400">Valid workout</p><h2 className="mt-1 text-2xl font-medium">{imported.name}</h2><p className="mt-2 text-sm text-neutral-500">{imported.exercises.length} exercises · {imported.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} programmed sets</p></div><Check className="text-emerald-400" /></div><div className="mt-6 max-h-80 space-y-2 overflow-y-auto">{imported.exercises.map((exercise, index) => <div key={`${exercise.id}-${index}`} className="flex items-center justify-between rounded-md border border-white/[0.06] bg-black/20 px-3 py-3"><div><p className="text-sm font-medium text-white">{index + 1}. {exercise.title}</p><p className="mt-0.5 text-xs text-neutral-500">ID {exercise.id} · {exercise.sets.length} sets</p></div><span className="font-mono text-xs text-neutral-500">{exercise.preset === -1 ? 'Custom' : `RM${exercise.preset}`}</span></div>)}</div><button type="button" onClick={publishImport} disabled={Boolean(busy)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy === 'publish' ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUpFromLine size={17} />}Publish to library</button></> : <Empty icon={FileJson} title="No file selected" body="Your validated workout preview will appear here." />}
            </div>
          </section>
        )}

        {activeTab === 'account' && (
          <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-400">Secure account link</p><h2 className="mt-2 text-3xl font-medium tracking-tight">Connect your Speediance account</h2><p className="mt-3 max-w-2xl leading-7 text-neutral-400">Your login is sent directly to the local Workout Hub backend to obtain a Speediance session. The password is immediately discarded. Only the provider session token is encrypted at rest.</p>
              {me ? <div className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5"><div className="flex items-start gap-4"><UserRoundCheck className="mt-0.5 text-emerald-400" /><div><h3 className="font-medium text-white">Connected as {me.display_name}</h3><p className="mt-1 text-sm leading-6 text-neutral-400">You can install shared workouts and sync verified completions.</p><button type="button" onClick={disconnect} disabled={Boolean(busy)} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"><Unplug size={15} />Disconnect and delete stored provider token</button></div></div></div> : <form onSubmit={connect} className="mt-8 grid gap-4 sm:grid-cols-2"><Field label="Leaderboard display name"><input required minLength={2} maxLength={40} autoComplete="nickname" value={connectForm.display_name} onChange={(event) => setConnectForm({ ...connectForm, display_name: event.target.value })} className="hub-input" placeholder="Toby" /></Field><Field label="Speediance region"><select value={connectForm.region} onChange={(event) => setConnectForm({ ...connectForm, region: event.target.value })} className="hub-input"><option value="Global">Global</option><option value="EU">Europe</option></select></Field><Field label="Speediance email"><input required type="email" autoComplete="username" value={connectForm.email} onChange={(event) => setConnectForm({ ...connectForm, email: event.target.value })} className="hub-input" placeholder="you@example.com" /></Field><Field label="Speediance password"><input required type="password" autoComplete="current-password" value={connectForm.password} onChange={(event) => setConnectForm({ ...connectForm, password: event.target.value })} className="hub-input" placeholder="••••••••••••" /></Field><div className="sm:col-span-2"><button type="submit" disabled={Boolean(busy)} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy === 'connect' ? <LoaderCircle size={17} className="animate-spin" /> : <LockKeyhole size={17} />}Connect securely</button></div></form>}
            </div>
            <div className="space-y-3"><SecurityItem icon={LockKeyhole} title="Password never stored" body="Used once for provider login and immediately discarded." /><SecurityItem icon={Database} title="Encrypted provider token" body="Fernet encryption with a server-only master key." /><SecurityItem icon={ShieldCheck} title="Device-verified results" body="Leaderboards accept completed sessions synced from Speediance—not manual entries." /></div>
          </section>
        )}
      </div>
      <style>{`.hub-input{width:100%;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.25);border-radius:6px;padding:.72rem .8rem;color:#f7f8f8;outline:none}.hub-input:focus{border-color:rgba(249,115,22,.65);box-shadow:0 0 0 3px rgba(249,115,22,.09)}.hub-input option{background:#151617}`}</style>
    </div>
  );
}

function Stat({ value, label }) { return <div className="rounded-lg bg-black/20 p-3 text-center"><div className="text-xl font-semibold text-white">{value}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">{label}</div></div>; }
function Field({ label, children }) { return <label className="block text-sm text-neutral-300"><span className="mb-2 block font-medium">{label}</span>{children}</label>; }
function Banner({ tone, children }) { return <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-400/25 bg-red-400/[0.08] text-red-200' : 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200'}`}>{children}</div>; }
function Loading({ label }) { return <div className="flex items-center justify-center gap-3 p-12 text-sm text-neutral-500"><LoaderCircle size={18} className="animate-spin" />{label}</div>; }
function Empty({ icon: Icon, title, body }) { return <div className="flex min-h-60 flex-col items-center justify-center p-8 text-center"><div className="rounded-full border border-white/[0.08] bg-white/[0.03] p-4"><Icon size={24} className="text-neutral-500" /></div><h3 className="mt-4 font-medium text-white">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">{body}</p></div>; }
function SecurityItem({ icon: Icon, title, body }) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"><Icon size={20} className="text-orange-400" /><h3 className="mt-4 font-medium text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-neutral-500">{body}</p></div>; }
function Rank({ rank }) { const styles = rank === 1 ? 'bg-yellow-400/15 text-yellow-300' : rank === 2 ? 'bg-neutral-300/10 text-neutral-300' : rank === 3 ? 'bg-orange-500/15 text-orange-300' : 'bg-white/[0.04] text-neutral-500'; return <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm ${styles}`}>{rank <= 3 ? <Medal size={16} /> : rank}</span>; }
function WorkoutDetail({ workout, busy, connected, onInstall, onExport, onLeaderboard }) {
  if (!workout) return <section className="rounded-xl border border-white/[0.08] bg-white/[0.02]"><Empty icon={Dumbbell} title="Choose a workout" body="Select a shared workout to inspect its structure and leaderboard." /></section>;
  return <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-orange-400">Shared by {workout.creator_name}</p><h2 className="mt-2 text-3xl font-medium tracking-tight text-white">{workout.name}</h2><p className="mt-3 max-w-2xl leading-7 text-neutral-400">{workout.description || 'Community custom workout ready to export or install.'}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => onExport(workout.id)} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.07]"><ArrowDownToLine size={15} />JSON</button><button type="button" onClick={() => onInstall(workout.id)} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy === `install-${workout.id}` ? <LoaderCircle size={15} className="animate-spin" /> : <Dumbbell size={15} />}{connected ? 'Install' : 'Connect to install'}</button></div></div><div className="mt-7 grid grid-cols-3 gap-3"><Stat value={workout.exercises.length} label="Exercises" /><Stat value={workout.athlete_count || 0} label="Finished" /><Stat value={formatVolume(workout.top_volume_lbs || 0).replace(' lb', '')} label="Top lb" /></div><div className="mt-7"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">Workout structure</h3><button type="button" onClick={() => onLeaderboard(workout.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-300 hover:text-orange-200"><Users size={15} />View leaderboard</button></div><div className="space-y-2">{workout.exercises.map((exercise, index) => <div key={`${exercise.id}-${index}`} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-3"><span className="font-mono text-xs text-neutral-600">{String(index + 1).padStart(2, '0')}</span><div><p className="text-sm font-medium text-white">{exercise.title}</p><p className="mt-0.5 text-xs text-neutral-500">{exercise.sets.map((set) => `${set.reps}×${set.weight}`).join(' · ')}</p></div><span className="rounded-full border border-white/[0.07] px-2 py-1 font-mono text-[10px] text-neutral-500">{exercise.preset === -1 ? 'CUSTOM' : `RM${exercise.preset}`}</span></div>)}</div></div></section>;
}
