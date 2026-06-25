import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Film,
  ListChecks,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Volume2,
  Youtube,
} from 'lucide-react';
import onePeterData from '../data/onePeterKjv.json';
import { STRINGS } from '../data/onePeterStrings.js';

const STORE_KEY = 'one-peter-memory-trainer-v2';
const voiceProfiles = [
  {
    id: 'ironvane-narrator',
    label: 'IronVane Narrator',
    voice: 'en-GB-RyanNeural',
    rate: '-12%',
    pitch: '-8Hz',
    note: 'Crossfire canonical narrator',
  },
  {
    id: 'liminal-narrator',
    label: 'Liminal Narrator',
    voice: 'en-GB-SoniaNeural',
    rate: '+2%',
    pitch: '-2Hz',
    note: 'Liminal warm literary narrator',
  },
  {
    id: 'aldric-command',
    label: 'Aldric Command',
    voice: 'en-US-BrianNeural',
    rate: '-4%',
    pitch: '-5Hz',
    note: 'Lord Aldric Vane gravitas',
  },
];

// Structural ids only — display labels resolve from the i18n catalog at render time.
const modes = [
  { id: 'read', icon: BookOpen },
  { id: 'film', icon: Film },
  { id: 'echo', icon: Mic2 },
  { id: 'hide', icon: EyeOff },
  { id: 'recite', icon: Shield },
  { id: 'route', icon: ListChecks },
];

const learningSectionIds = ['read', 'film', 'echo', 'hide', 'recite'];
const reviewCheckpoints = [
  { id: 'sameDay', offset: 0 },
  { id: 'day1', offset: 1 },
  { id: 'day3', offset: 3 },
  { id: 'day7', offset: 7 },
  { id: 'day14', offset: 14 },
];

// [keyword pattern (matches English KJV text), cue key into the i18n catalog]
const cueLexicon = [
  ['strangers|scattered|pontus|galatia|cappadocia|asia|bithynia', 'scatteredMap'],
  ['foreknowledge|father|spirit|obedience|blood|peace', 'triadOrder'],
  ['blessed|mercy|begotten|hope|resurrection', 'livingHope'],
  ['inheritance|incorruptible|undefiled|reserved|heaven', 'reservedInheritance'],
  ['kept|power|faith|salvation|last time', 'guardedSalvation'],
  ['trial|temptations|gold|fire', 'testedGold'],
  ['prophets|searched|angels', 'searchingWitnesses'],
  ['gird|sober|obedient|holy', 'readyMind'],
  ['redeemed|blood|lamb|spot', 'preciousLamb'],
  ['grass|flower|withereth|endureth', 'enduringWord'],
  ['stone|priesthood|corner|zion', 'livingStone'],
  ['chosen|generation|royal|light', 'royalPeople'],
  ['submit|king|governors|honour', 'orderedHonor'],
  ['stripes|shepherd|bishop', 'hisSteps'],
  ['wives|husbands|conversation|spirit', 'orderedHome'],
  ['tongue|peace|eyes|ears', 'guardedSpeech'],
  ['answer|hope|meekness|fear', 'readyAnswer'],
  ['baptism|ark|right hand', 'waterAndThrone'],
  ['armed|flesh|will of god', 'armedMind'],
  ['prayer|charity|hospitality|gift', 'watchAndServe'],
  ['fiery|trial|reproached|creator', 'fieryTrial'],
  ['elders|flock|shepherd|crown', 'feedTheFlock'],
  ['humble|care|exalt', 'humbleAndCast'],
  ['sober|vigilant|adversary|resist', 'soberWatch'],
  ['grace|peace|babylon|marcus', 'graceAndPeace'],
];

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function normalizeWord(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9']/g, '');
}

function isBlanked(level, core, counter) {
  const clean = core.toLowerCase();
  if (level === 0) return core.length >= 5 && counter % 4 === 1;
  if (level === 1) return core.length >= 7 || /^(hope|faith|grace|holy|christ|god|lord|spirit|jesus|peace|mercy|glory|word|soul|love)$/i.test(clean);
  if (level === 2) return core.length >= 4;
  return core.length >= 2;
}

function buildBlanks(verses, level) {
  const blocks = [];
  let counter = 0;
  verses.forEach((verse, vi) => {
    const tokens = [];
    const chunks = verse.text.split(/(\s+)/);
    chunks.forEach((chunk, ci) => {
      if (chunk === '' || /^\s+$/.test(chunk)) {
        tokens.push({ kind: 'space', value: chunk });
        return;
      }
      const lead = (chunk.match(/^[^A-Za-z0-9]*/) || [''])[0];
      const trail = (chunk.match(/[^A-Za-z0-9]*$/) || [''])[0];
      const core = chunk.slice(lead.length, chunk.length - trail.length);
      if (core.length >= 2) {
        counter += 1;
        if (isBlanked(level, core, counter)) {
          tokens.push({ kind: 'blank', lead, core, trail, hint: level === 2, key: `${vi}-${ci}` });
          return;
        }
      }
      tokens.push({ kind: 'text', value: chunk });
    });
    blocks.push({ id: verse.id, reference: verse.reference, tokens });
  });
  return blocks;
}

export default function OnePeterMemoryTrainer({ lang = 'en' }) {
  const t = STRINGS[lang] || STRINGS.en;
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState(onePeterData.units[0].id);
  const [mode, setMode] = useState('read');
  const [progress, setProgress] = useState({});
  const [unitProgress, setUnitProgress] = useState({});
  const [chapterProgress, setChapterProgress] = useState({});
  const [reviewChapter, setReviewChapter] = useState(null);
  const [reviewTab, setReviewTab] = useState('hide');
  const [activeVerseIndex, setActiveVerseIndex] = useState(0);
  const [reciteScope, setReciteScope] = useState('unit');
  const [attempt, setAttempt] = useState('');
  const [lastScore, setLastScore] = useState(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState(voiceProfiles[0].id);
  const [audioMessage, setAudioMessage] = useState('');
  const [audioState, setAudioState] = useState({ kind: null, src: '', playing: false, currentTime: 0, duration: 0 });
  const [echoRate, setEchoRate] = useState(0.82);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY));
      if (stored?.progress) setProgress(stored.progress);
      if (stored?.unitProgress) setUnitProgress(stored.unitProgress);
      if (stored?.chapterProgress) setChapterProgress(stored.chapterProgress);
      if (stored?.selectedVoiceId && voiceProfiles.some((profile) => profile.id === stored.selectedVoiceId)) {
        setSelectedVoiceId(stored.selectedVoiceId);
      }
      if (stored?.selectedUnitId) {
        const storedUnit = onePeterData.units.find((unit) => unit.id === stored.selectedUnitId);
        if (storedUnit) {
          setSelectedUnitId(storedUnit.id);
          setSelectedChapter(storedUnit.chapter);
        }
      }
    } catch {
      setProgress({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ progress, unitProgress, chapterProgress, selectedUnitId, selectedVoiceId }));
  }, [progress, unitProgress, chapterProgress, selectedUnitId, selectedVoiceId]);

  useEffect(() => {
    setChapterProgress((current) => {
      let changed = false;
      const next = { ...current };
      for (const { chapter } of onePeterData.chapters) {
        if (isChapterLearned(chapter, unitProgress) && !next[chapter]?.learnedOn) {
          next[chapter] = { ...(next[chapter] || {}), learnedOn: todayKey() };
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [unitProgress]);

  const verseById = useMemo(() => new Map(onePeterData.verses.map((verse) => [verse.id, verse])), []);
  const selectedUnit = onePeterData.units.find((unit) => unit.id === selectedUnitId) || onePeterData.units[0];
  const unitVerses = selectedUnit.verseIds.map((id) => verseById.get(id));
  const chapterUnits = onePeterData.units.filter((unit) => unit.chapter === selectedChapter);
  const chapterVerses = onePeterData.verses.filter((verse) => verse.chapter === selectedUnit.chapter);
  const phrases = getPhrases(unitVerses);
  const activeVerse = unitVerses[Math.min(activeVerseIndex, unitVerses.length - 1)];
  const dueChapters = getDueChapters(unitProgress, chapterProgress);
  const stats = getStats(unitProgress, chapterProgress);
  const selectedVoice = voiceProfiles.find((voice) => voice.id === selectedVoiceId) || voiceProfiles[0];
  const selectedLearning = getUnitLearning(selectedUnit, unitProgress);
  const reviewChapterData = reviewChapter != null ? getChapterReview(reviewChapter, unitProgress, chapterProgress) : null;
  const reviewVerses = reviewChapter != null ? versesOfChapter(reviewChapter) : [];

  const selectUnit = (unit) => {
    stopAudio();
    setSelectedUnitId(unit.id);
    setSelectedChapter(unit.chapter);
    resetDrills();
  };

  const resetDrills = () => {
    setActiveVerseIndex(0);
    setAttempt('');
    setLastScore(null);
  };

  const markVerses = (verses, score) => {
    setProgress((current) => {
      const next = { ...current };
      for (const verse of verses) {
        const previous = next[verse.id] || {};
        const attempts = (previous.attempts || 0) + 1;
        const best = Math.max(previous.best || 0, score);
        const streak = score >= 0.92 ? (previous.streak || 0) + 1 : 0;
        const interval = nextInterval(previous.interval || 0, score);
        next[verse.id] = {
          attempts,
          best,
          streak,
          interval,
          mastered: streak >= 3 || best >= 0.985,
          due: addDays(new Date(), interval).toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        };
      }
      return next;
    });
  };

  const markUnitSection = (unitId, sectionId, completed = true) => {
    setUnitProgress((current) => {
      const previous = current[unitId] || {};
      return {
        ...current,
        [unitId]: {
          ...previous,
          startedOn: previous.startedOn || todayKey(),
          sections: {
            ...(previous.sections || {}),
            [sectionId]: completed,
          },
        },
      };
    });
  };

  const scoreAttempt = () => {
    const targetVerses = reciteScope === 'chapter' ? chapterVerses : unitVerses;
    const target = targetVerses.map((verse) => verse.text).join(' ');
    const score = compareText(target, attempt);
    setLastScore(score);
    markVerses(targetVerses, score.score);
    if (reciteScope === 'unit' && score.score >= 0.92) {
      markUnitSection(selectedUnit.id, 'recite');
    }
  };

  const completeHide = () => {
    markUnitSection(selectedUnit.id, 'hide');
    markVerses(unitVerses, 1);
  };

  const enterReview = (chapter) => {
    stopAudio();
    setReviewChapter(chapter);
    setSelectedChapter(chapter);
    const firstUnit = onePeterData.units.find((unit) => unit.chapter === chapter);
    if (firstUnit) setSelectedUnitId(firstUnit.id);
    setReviewTab('hide');
    setAttempt('');
    setLastScore(null);
  };

  const exitReview = () => {
    setReviewChapter(null);
    setAttempt('');
    setLastScore(null);
    setMode('route');
  };

  const markChapterReviewPart = (chapter, part) => {
    setChapterProgress((prev) => {
      const record = prev[chapter] || {};
      const current = { ...(record.current || {}), [part]: true };
      if (current.hide && current.recite) {
        const review = getChapterReview(chapter, unitProgress, prev);
        if (review.nextDue) {
          return {
            ...prev,
            [chapter]: { ...record, reviews: { ...(record.reviews || {}), [review.nextDue.id]: todayKey() }, current: {} },
          };
        }
      }
      return { ...prev, [chapter]: { ...record, current } };
    });
  };

  const scoreReview = () => {
    const targetVerses = versesOfChapter(reviewChapter);
    const target = targetVerses.map((verse) => verse.text).join(' ');
    const score = compareText(target, attempt);
    setLastScore(score);
    markVerses(targetVerses, score.score);
    if (score.score >= 0.92) markChapterReviewPart(reviewChapter, 'recite');
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioState({ kind: null, src: '', playing: false, currentTime: 0, duration: 0 });
  };

  const playAudio = (src, playbackRate = 1, onEnded = null, kind = 'unit') => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioMessage('');
    const audio = new Audio(src);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    setAudioState({ kind, src, playing: false, currentTime: 0, duration: 0 });
    audio.onloadedmetadata = () => {
      if (audioRef.current !== audio) return;
      setAudioState((current) => current.src === src ? { ...current, duration: audio.duration || 0 } : current);
    };
    audio.ontimeupdate = () => {
      if (audioRef.current !== audio) return;
      setAudioState((current) => current.src === src ? { ...current, currentTime: audio.currentTime || 0, duration: audio.duration || current.duration || 0 } : current);
    };
    audio.onplay = () => {
      if (audioRef.current !== audio) return;
      setAudioState((current) => current.src === src ? { ...current, playing: true } : current);
    };
    audio.onpause = () => {
      if (audioRef.current !== audio) return;
      setAudioState((current) => current.src === src ? { ...current, playing: false } : current);
    };
    audio.onerror = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setAudioState({ kind: null, src: '', playing: false, currentTime: 0, duration: 0 });
      setAudioMessage(t.audioNotReady);
    };
    audio.onended = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setAudioState((current) => current.src === src ? { ...current, playing: false, currentTime: current.duration || audio.duration || current.currentTime } : current);
      if (onEnded) onEnded();
    };
    setAudioState((current) => current.src === src ? { ...current, playing: true } : current);
    audio.play().catch(() => {
      setAudioMessage(t.audioCantStart);
    });
  };

  const toggleAudio = (src, kind, playbackRate = 1, onEnded = null) => {
    if (audioRef.current && audioState.kind === kind && audioState.src === src) {
      audioRef.current.playbackRate = playbackRate;
      if (audioState.playing) {
        audioRef.current.pause();
        setAudioState((current) => current.kind === kind && current.src === src ? { ...current, playing: false } : current);
      } else {
        setAudioState((current) => current.kind === kind && current.src === src ? { ...current, playing: true } : current);
        audioRef.current.play().catch(() => {
          setAudioMessage(t.audioCantStart);
        });
      }
      return;
    }
    playAudio(src, playbackRate, onEnded, kind);
  };

  const toggleUnitAudio = (kind, playbackRate = 1, onEnded = null) => {
    toggleAudio(unitAudioPath(selectedVoice.id, selectedUnit.id), kind, playbackRate, onEnded);
  };

  const audioPlaying = (kind) => audioState.kind === kind && audioState.playing;

  const togglePreviewAudio = () => {
    toggleAudio(previewAudioPath(selectedVoice.id), 'preview');
  };

  const playReadAudio = () => {
    toggleUnitAudio('read', 1, () => markUnitSection(selectedUnit.id, 'read'));
  };

  const toggleFilmAudio = () => {
    toggleUnitAudio('film');
  };

  const toggleHideAudio = () => {
    toggleUnitAudio('hide');
  };

  const advanceFilm = (direction) => {
    setActiveVerseIndex((current) => {
      const next = Math.min(unitVerses.length - 1, Math.max(0, current + direction));
      if (next === unitVerses.length - 1) {
        markUnitSection(selectedUnit.id, 'film');
      }
      return next;
    });
  };

  const toggleEchoAudio = () => {
    toggleUnitAudio('echo', echoRate, () => markUnitSection(selectedUnit.id, 'echo'));
  };

  const changeEchoRate = (rate) => {
    setEchoRate(rate);
    if (audioRef.current && audioState.kind === 'echo') {
      audioRef.current.playbackRate = rate;
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f4ea] text-[#18201b]">
      <section className="border-b-4 border-amber-500 bg-[#233127] px-4 py-8 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">{t.alertPrep}</p>
            <h1 className="mt-2 text-4xl font-black tracking-normal md:text-6xl">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-base text-neutral-200 md:text-lg">
              {t.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={t.stat_mastered} value={stats.mastered} />
            <Stat label={t.stat_due} value={stats.due} />
            <Stat label={t.stat_best} value={`${Math.round(stats.best * 100)}%`} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="grid grid-cols-5 gap-2">
            {onePeterData.chapters.map((chapter) => (
              <button
                key={chapter.chapter}
                type="button"
                onClick={() => {
                  const firstUnit = onePeterData.units.find((unit) => unit.chapter === chapter.chapter);
                  setSelectedChapter(chapter.chapter);
                  selectUnit(firstUnit);
                }}
                className={`aspect-square rounded-lg border text-lg font-black ${
                  selectedChapter === chapter.chapter
                    ? 'border-[#233127] bg-[#233127] text-white'
                    : 'border-stone-300 bg-white/70 text-[#18201b] hover:bg-white'
                }`}
              >
                {chapter.chapter}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-xl shadow-stone-900/10">
            {chapterUnits.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => selectUnit(unit)}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-stone-200 px-4 py-3 text-left last:border-b-0 ${
                  unit.id === selectedUnitId ? 'bg-stone-100' : 'bg-white hover:bg-stone-50'
                }`}
              >
                <span>
                  <span className="block font-black">{unit.title}</span>
                  <span className="mt-1 block text-sm text-stone-600">{unit.reference}</span>
                </span>
                <ProgressRing score={unitScore(unit, unitProgress)} />
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-xl shadow-stone-900/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black">{t.reviewQueue}</h2>
              <button
                type="button"
                onClick={() => setMode('route')}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm font-bold hover:bg-stone-100"
              >
                {t.route}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {dueChapters.slice(0, 5).map((review) => (
                <button
                  key={review.chapter}
                  type="button"
                  onClick={() => enterReview(review.chapter)}
                  className="w-full border-l-4 border-red-700 bg-red-50 px-3 py-2 text-left text-sm font-bold"
                >
                  1 Peter {review.chapter} — {t.fullChapterReview}
                  <span className="mt-1 block text-xs font-normal text-stone-600">{t[`cp_${review.nextDue.id}`]}</span>
                </button>
              ))}
              {!dueChapters.length && <p className="rounded-lg border border-dashed border-stone-300 p-3 text-sm text-stone-600">{t.noReviewsDueShort}</p>}
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-xl shadow-stone-900/10">
          <div className="flex flex-col gap-4 border-b border-stone-300 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-800">{selectedUnit.reference}</p>
              <h2 className="mt-1 text-3xl font-black tracking-normal">{selectedUnit.title}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <VoicePicker
                t={t}
                voices={voiceProfiles}
                selectedVoiceId={selectedVoiceId}
                setSelectedVoiceId={setSelectedVoiceId}
                onPreview={togglePreviewAudio}
                previewPlaying={audioPlaying('preview')}
              />
              {audioMessage && <p className="basis-full text-sm font-bold text-amber-800">{audioMessage}</p>}
            </div>
          </div>

          {reviewChapter == null && (
            <div className="flex flex-wrap gap-2 border-b border-stone-300 bg-stone-100 p-3">
              {modes.map(({ id, icon: Icon }) => {
                const done = Boolean(selectedLearning.sections[id]);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setMode(id);
                      setLastScore(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-black ${
                      mode === id
                        ? 'border-[#233127] bg-[#233127] text-white'
                        : 'border-stone-300 bg-white text-[#18201b] hover:bg-stone-50'
                    }`}
                  >
                    {done
                      ? <CheckCircle2 size={16} className={mode === id ? 'text-emerald-300' : 'text-teal-700'} />
                      : <Icon size={16} />}
                    {t[`mode_${id}`]}
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-5">
            {reviewChapter != null ? (
              <ChapterReviewView
                t={t}
                chapter={reviewChapter}
                verses={reviewVerses}
                review={reviewChapterData}
                reviewTab={reviewTab}
                setReviewTab={setReviewTab}
                onExit={exitReview}
                attempt={attempt}
                setAttempt={setAttempt}
                lastScore={lastScore}
                onScoreRecite={scoreReview}
                onClearRecite={() => { setAttempt(''); setLastScore(null); }}
                onHideComplete={() => markChapterReviewPart(reviewChapter, 'hide')}
              />
            ) : (
              <>
                {mode === 'route' && (
                  <RoutePanel
                    t={t}
                    chapter={selectedUnit.chapter}
                    learning={selectedLearning}
                    review={getChapterReview(selectedUnit.chapter, unitProgress, chapterProgress)}
                    dueChapters={dueChapters}
                    chapterLearned={isChapterLearned(selectedUnit.chapter, unitProgress)}
                    onEnterReview={enterReview}
                  />
                )}
                {mode === 'read' && (
                  <ReadPanel
                    t={t}
                    verses={unitVerses}
                    completed={selectedLearning.sections.read}
                    audioMessage={audioMessage}
                    onPlayAudio={playReadAudio}
                    playing={audioPlaying('read')}
                  />
                )}
                {mode === 'film' && (
                  <FilmPanel
                    t={t}
                    verse={activeVerse}
                    unit={selectedUnit}
                    completed={selectedLearning.sections.film}
                    progress={(activeVerseIndex + 1) / unitVerses.length}
                    onPrev={() => advanceFilm(-1)}
                    onNext={() => advanceFilm(1)}
                    onSpeak={toggleFilmAudio}
                    playing={audioPlaying('film')}
                  />
                )}
                {mode === 'echo' && (
                  <EchoPanel
                    t={t}
                    phrases={phrases}
                    completed={selectedLearning.sections.echo}
                    audioState={audioState}
                    activeIndex={getAudioPhraseIndex(phrases.length, audioState, 'echo')}
                    progress={getAudioProgress(audioState, 'echo')}
                    rate={echoRate}
                    onTogglePlay={toggleEchoAudio}
                    onRateChange={changeEchoRate}
                  />
                )}
                {mode === 'hide' && (
                  <HidePanel
                    key={selectedUnit.id}
                    t={t}
                    verses={unitVerses}
                    completed={selectedLearning.sections.hide}
                    onComplete={completeHide}
                  />
                )}
                {mode === 'recite' && (
                  <RecitePanel
                    t={t}
                    attempt={attempt}
                    setAttempt={setAttempt}
                    scope={reciteScope}
                    setScope={setReciteScope}
                    label={reciteScope === 'chapter' ? `1 Peter ${selectedUnit.chapter}` : selectedUnit.reference}
                    score={lastScore}
                    onScore={scoreAttempt}
                    onClear={() => {
                      setAttempt('');
                      setLastScore(null);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-w-[86px] rounded-lg border border-white/20 bg-white/10 p-3">
      <strong className="block text-2xl leading-none">{value}</strong>
      <span className="mt-1 block text-xs text-neutral-200">{label}</span>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-bold hover:bg-stone-100"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function VoicePicker({ t, voices, selectedVoiceId, setSelectedVoiceId, onPreview, previewPlaying }) {
  const PreviewIcon = previewPlaying ? Pause : Play;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-stone-300 bg-stone-50 px-2 py-2">
      <label className="inline-flex items-center gap-2 text-sm font-black text-stone-700">
        <Volume2 size={16} />
        {t.voice}
      </label>
      <select
        value={selectedVoiceId}
        onChange={(event) => setSelectedVoiceId(event.target.value)}
        className="min-h-9 max-w-[220px] rounded-md border border-stone-300 bg-white px-2 text-sm font-bold text-[#18201b]"
        aria-label={t.voiceAria}
      >
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.label} - {voice.voice}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex min-h-9 items-center gap-1 rounded-md border border-stone-300 bg-white px-2 text-sm font-bold hover:bg-stone-100"
      >
        <PreviewIcon size={14} />
        {previewPlaying ? t.pause : t.preview}
      </button>
    </div>
  );
}

function ChecklistPill({ label, completed, muted = false }) {
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-black ${
      completed
        ? 'border-teal-800 bg-teal-800 text-white'
        : muted
          ? 'border-stone-200 bg-white text-stone-400'
          : 'border-stone-300 bg-white text-[#18201b]'
    }`}>
      <CheckCircle2 size={16} />
      {label}
    </span>
  );
}

function RoutePanel({ t, chapter, learning, review, dueChapters, chapterLearned, onEnterReview }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <div className="flex flex-col gap-2 border-b border-stone-300 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-normal">1 Peter {chapter} {t.routeSuffix}</h3>
            <p className="mt-1 text-sm leading-5 text-stone-600">{t.chapterReviewNote}</p>
          </div>
          <strong className="text-4xl text-red-800">{Math.round(review.score * 100)}%</strong>
        </div>
        {chapterLearned ? (
          <button
            type="button"
            onClick={() => onEnterReview(chapter)}
            className={`mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-3 font-black ${review.nextDue ? 'border-red-800 bg-red-50 text-red-900 hover:bg-red-100' : 'border-stone-300 bg-white hover:bg-stone-100'}`}
          >
            <Shield size={16} />
            {t.chapterReviewTitle}{review.nextDue ? ` · ${t[`cp_${review.nextDue.id}`]}` : ''}
          </button>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-stone-300 bg-white p-3 text-sm text-stone-600">{t.reviewLocked}</p>
        )}
      </section>
      <aside className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <h3 className="font-black">{t.timedReviews}</h3>
        <p className="mt-1 text-sm leading-5 text-stone-600">{t.chapterReviewNote}</p>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {review.reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border p-3 text-left ${
                r.completed
                  ? 'border-teal-800 bg-teal-800 text-white'
                : r.available
                    ? 'border-red-800 bg-red-50 text-[#18201b]'
                    : 'border-stone-300 bg-white text-stone-400'
              }`}
            >
              <b className="block">{t[`cp_${r.id}`]}</b>
              <span className="mt-1 block text-xs">{r.completed ? t.completed : r.dueDate ? fillTemplate(t.dueDate, { date: r.dueDate }) : '—'}</span>
            </div>
          ))}
        </div>
      </aside>
      <section className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <h3 className="font-black">{t.reviewQueue}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {dueChapters.map((r) => (
            <button
              key={r.chapter}
              type="button"
              onClick={() => onEnterReview(r.chapter)}
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-left hover:bg-red-100"
            >
              <b className="block">1 Peter {r.chapter} — {t.fullChapterReview}</b>
              <span className="mt-1 block text-sm text-stone-600">{t[`cp_${r.nextDue.id}`]}</span>
            </button>
          ))}
          {!dueChapters.length && <p className="rounded-lg border border-dashed border-stone-300 bg-white p-3 text-sm text-stone-600">{t.noReviewsDueToday}</p>}
        </div>
      </section>
    </div>
  );
}

function ChapterReviewView({ t, chapter, verses, review, reviewTab, setReviewTab, onExit, attempt, setAttempt, lastScore, onScoreRecite, onClearRecite, onHideComplete }) {
  const hideDone = Boolean(review?.current?.hide);
  const reciteDone = Boolean(review?.current?.recite);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border-2 border-amber-500/60 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-amber-700">{fillTemplate(t.reviewBanner, { chapter: `1 Peter ${chapter}` })}</p>
          <p className="mt-1 text-sm text-stone-600">{t.chapterReviewNote}</p>
        </div>
        <button type="button" onClick={onExit} className="self-start rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-bold hover:bg-stone-100">{t.exitReview}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['hide', 'recite'].map((id) => {
          const done = id === 'hide' ? hideDone : reciteDone;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setReviewTab(id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-black ${
                reviewTab === id ? 'border-[#233127] bg-[#233127] text-white' : 'border-stone-300 bg-white text-[#18201b] hover:bg-stone-50'
              }`}
            >
              {done
                ? <CheckCircle2 size={16} className={reviewTab === id ? 'text-emerald-300' : 'text-teal-700'} />
                : (id === 'hide' ? <EyeOff size={16} /> : <Shield size={16} />)}
              {t[`mode_${id}`]} · {t.wholeChapter}
            </button>
          );
        })}
      </div>
      {reviewTab === 'hide' && (
        <HidePanel key={`review-${chapter}`} t={t} verses={verses} completed={hideDone} onComplete={onHideComplete} />
      )}
      {reviewTab === 'recite' && (
        <RecitePanel
          t={t}
          attempt={attempt}
          setAttempt={setAttempt}
          scope="chapter"
          setScope={() => {}}
          label={`1 Peter ${chapter}`}
          score={lastScore}
          onScore={onScoreRecite}
          onClear={onClearRecite}
          lockScope
        />
      )}
    </div>
  );
}

function StatusDot({ completed }) {
  return (
    <span className={`mt-1 grid h-6 w-6 place-items-center rounded-full border ${
      completed ? 'border-teal-800 bg-teal-800 text-white' : 'border-stone-300 bg-stone-100 text-stone-400'
    }`}>
      <CheckCircle2 size={16} />
    </span>
  );
}

function ReadPanel({ t, verses, onPlayAudio, completed, audioMessage, playing }) {
  const PlayIcon = playing ? Pause : Play;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-black">{t.listenAndRead}</h3>
            <p className="mt-1 text-sm text-stone-600">{t.readNote}</p>
          </div>
          <ActionButton icon={PlayIcon} label={playing ? t.pause : completed ? t.playAgain : t.playKjv} onClick={onPlayAudio} />
        </div>
        {completed && <p className="mt-3 rounded-md bg-teal-800 px-3 py-2 text-sm font-black text-white">{t.readChecked}</p>}
        {audioMessage && <p className="mt-3 text-sm font-bold text-amber-800">{audioMessage}</p>}
      </div>
      {verses.map((verse) => (
        <article key={verse.id} className="grid gap-3 rounded-lg border border-stone-300 bg-stone-50 p-4 md:grid-cols-[90px_1fr]">
          <div className="font-black text-red-800">{verse.reference}</div>
          <p className="font-serif text-xl leading-8 text-[#18201b]">{verse.text}</p>
        </article>
      ))}
    </div>
  );
}

function FilmPanel({ t, verse, unit, completed, progress, onPrev, onNext, onSpeak, playing }) {
  const cues = getCues(verse, t);
  const PlayIcon = playing ? Pause : Play;
  return (
    <div className="grid overflow-hidden rounded-lg border border-stone-300 bg-[#233127] lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative min-h-[480px] bg-[linear-gradient(135deg,#236b68,#233127_55%,#7f352d)] p-6 text-white md:p-8">
        <div className="absolute inset-5 rounded-lg border border-white/30" />
        <div className="relative flex h-full flex-col justify-end">
          <span className="w-fit rounded bg-amber-300 px-3 py-2 text-sm font-black text-[#233127]">{verse.reference}</span>
          <h3 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-normal md:text-7xl">{cues[0]?.label || unit.title}</h3>
          <p className="mt-4 max-w-4xl font-serif text-xl leading-8 text-stone-100">{verse.text}</p>
        </div>
      </section>
      <aside className="space-y-4 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-black">{t.visualAnchors}</h3>
          <Youtube className="text-red-700" size={22} />
        </div>
        <div className="space-y-3">
          {cues.map((cue) => (
            <div key={cue.label} className="grid grid-cols-[52px_1fr] items-center gap-3 rounded-lg border border-stone-300 bg-stone-50 p-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-800 font-black text-white">{cue.label.slice(0, 1)}</div>
              <div>
                <b className="block">{cue.label}</b>
                <span className="text-sm text-stone-600">{cue.note}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-gradient-to-r from-teal-700 to-amber-500" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ActionButton icon={ChevronLeft} label={t.prev} onClick={onPrev} />
          <ActionButton icon={PlayIcon} label={playing ? t.pause : t.play} onClick={onSpeak} />
          <ActionButton icon={ChevronRight} label={t.next} onClick={onNext} />
        </div>
        {completed && <p className="rounded-md bg-teal-800 px-3 py-2 text-sm font-black text-white">{t.filmChecked}</p>}
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-600">
          {t.youtubeSlot}
        </div>
      </aside>
    </div>
  );
}

function EchoPanel({ t, phrases, completed, audioState, activeIndex, progress, rate, onTogglePlay, onRateChange }) {
  const isPlaying = audioState.kind === 'echo' && audioState.playing;
  const ToggleIcon = isPlaying ? Pause : Play;
  const cadenceSteps = [t.cadence_listen, t.cadence_repeat, t.cadence_cover, t.cadence_repeatAgain];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <section className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ActionButton icon={ToggleIcon} label={isPlaying ? t.pause : t.play} onClick={onTogglePlay} />
          <span className="rounded-md bg-white px-3 py-2 text-sm font-black text-stone-700">
            {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
          </span>
        </div>
        <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-lg border border-stone-300 bg-white p-4">
          {phrases.map((phrase, index) => (
            <p
              key={`${phrase}-${index}`}
              className={`rounded-md px-3 py-2 font-serif text-xl leading-8 transition-colors ${
                index === activeIndex
                  ? 'bg-amber-200 text-[#18201b]'
                  : index < activeIndex
                    ? 'bg-stone-100 text-stone-500'
                    : 'text-[#18201b]'
              }`}
            >
              {phrase}
            </p>
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-gradient-to-r from-teal-700 to-amber-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </section>
      <aside className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <h3 className="font-black">{t.cadence}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {cadenceSteps.map((label) => <span key={label} className="rounded-full bg-[#5d5579] px-3 py-1 text-xs font-black text-white">{label}</span>)}
        </div>
        <div className="mt-4 grid gap-2">
          <button className={`rounded-md border px-3 py-2 font-bold ${rate === 0.72 ? 'border-[#233127] bg-[#233127] text-white' : 'border-stone-300 bg-white'}`} onClick={() => onRateChange(0.72)}>{t.slow}</button>
          <button className={`rounded-md border px-3 py-2 font-bold ${rate === 0.82 ? 'border-[#233127] bg-[#233127] text-white' : 'border-stone-300 bg-white'}`} onClick={() => onRateChange(0.82)}>{t.steady}</button>
        </div>
        {completed && <p className="mt-4 rounded-md bg-teal-800 px-3 py-2 text-sm font-black text-white">{t.echoChecked}</p>}
      </aside>
    </div>
  );
}

function HidePanel({ t, verses, completed, onComplete }) {
  const [level, setLevel] = useState(0);
  const [answers, setAnswers] = useState({});
  const firedRef = useRef(false);
  const blocks = useMemo(() => buildBlanks(verses, level), [verses, level]);
  const blanks = useMemo(() => blocks.flatMap((block) => block.tokens.filter((token) => token.kind === 'blank')), [blocks]);

  useEffect(() => {
    firedRef.current = false;
    setAnswers({});
  }, [level, verses]);

  const isCorrect = (token) => normalizeWord(answers[token.key] || '') === normalizeWord(token.core);
  const correctCount = blanks.filter(isCorrect).length;
  const total = blanks.length;
  const allDone = total > 0 && correctCount === total;

  useEffect(() => {
    if (allDone && !firedRef.current) {
      firedRef.current = true;
      onComplete();
    }
  }, [allDone, onComplete]);

  const finished = completed || allDone;
  const levels = [t.hide_gaps, t.hide_keys, t.hide_letters, t.hide_blank];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-black">{t.blanksTitle}</h3>
            <p className="mt-1 text-sm text-stone-600">{t.blanksInstructions}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white px-3 py-2 text-sm font-black text-stone-700">
              {fillTemplate(t.blanksRemaining, { remaining: total - correctCount, total })}
            </span>
            <ActionButton icon={RotateCcw} label={t.reset} onClick={() => { firedRef.current = false; setAnswers({}); }} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {levels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setLevel(index)}
              className={`rounded-md border px-3 py-2 text-sm font-black ${level === index ? 'border-[#233127] bg-[#233127] text-white' : 'border-stone-300 bg-white'}`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto rounded-lg bg-amber-100 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-600">{t.memoryLoad}</span>
            <strong className="ml-2 text-lg">{level + 1}/4</strong>
          </span>
        </div>
        {finished && <p className="mt-3 rounded-md bg-teal-800 px-3 py-2 text-sm font-black text-white">{t.blanksComplete}</p>}
      </div>
      <div className="space-y-3">
        {blocks.map((block) => (
          <article key={block.id} className="grid gap-3 rounded-lg border border-stone-300 bg-stone-50 p-4 md:grid-cols-[90px_1fr]">
            <div className="font-black text-red-800">{block.reference}</div>
            <p className="font-serif text-xl leading-10 text-[#18201b]">
              {block.tokens.map((token, index) => {
                if (token.kind === 'blank') {
                  const ok = isCorrect(token);
                  const filled = (answers[token.key] || '').length > 0;
                  return (
                    <span key={token.key}>
                      {token.lead}
                      <input
                        type="text"
                        value={answers[token.key] || ''}
                        onChange={(event) => setAnswers((current) => ({ ...current, [token.key]: event.target.value }))}
                        spellCheck="false"
                        autoComplete="off"
                        readOnly={ok}
                        aria-label="missing word"
                        placeholder={token.hint ? token.core.slice(0, 1) : ''}
                        style={{ width: `${Math.max(token.core.length, 3) + 1}ch` }}
                        className={`mx-0.5 rounded border-b-2 bg-white/70 px-1 text-center font-serif text-lg outline-none placeholder:text-stone-400 ${
                          ok
                            ? 'border-teal-700 bg-teal-50 text-teal-900'
                            : filled
                              ? 'border-red-700 text-red-800'
                              : 'border-stone-400 focus:border-teal-700'
                        }`}
                      />
                      {token.trail}
                    </span>
                  );
                }
                return <span key={index}>{token.value}</span>;
              })}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function RecitePanel({ t, attempt, setAttempt, scope, setScope, label, score, onScore, onClear, lockScope = false }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <section className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {!lockScope && (
            <select value={scope} onChange={(event) => setScope(event.target.value)} className="rounded-md border border-stone-300 bg-white px-3 py-2">
              <option value="unit">{t.currentUnit}</option>
              <option value="chapter">{t.wholeChapter}</option>
            </select>
          )}
          <ActionButton icon={CheckCircle2} label={t.score} onClick={onScore} />
          <ActionButton icon={RotateCcw} label={t.clear} onClick={onClear} />
        </div>
        <textarea
          value={attempt}
          onChange={(event) => setAttempt(event.target.value)}
          spellCheck="false"
          placeholder={label}
          className="min-h-72 w-full resize-y rounded-lg border border-stone-300 bg-white p-4 leading-7 outline-none focus:border-teal-700"
        />
      </section>
      <aside className="rounded-lg border border-stone-300 bg-stone-50 p-4">
        <h3 className="font-black">{label}</h3>
        {score ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-amber-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <span>{t.recall}</span>
                <strong className="text-4xl">{Math.round(score.score * 100)}%</strong>
              </div>
              <p className="mt-3">{fillTemplate(t.wordsAligned, { matches: score.matches, targetLength: score.targetLength })}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {score.missing.slice(0, 12).map((word) => <span key={word} className="rounded-full bg-[#5d5579] px-3 py-1 text-xs font-black text-white">{word}</span>)}
              {!score.missing.length && <span className="rounded-full bg-teal-800 px-3 py-1 text-xs font-black text-white">{t.cleanPass}</span>}
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-4 text-stone-600">{t.noScoreYet}</p>
        )}
      </aside>
    </div>
  );
}

function ProgressRing({ score }) {
  const pct = Math.round(score * 100);
  return (
    <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: `conic-gradient(#236b68 ${pct}%, #e7decb 0)` }}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-black">{pct}</span>
    </span>
  );
}

function getAudioProgress(audioState, kind) {
  if (audioState.kind !== kind || !audioState.duration) return 0;
  return Math.min(1, Math.max(0, audioState.currentTime / audioState.duration));
}

function getAudioPhraseIndex(phraseCount, audioState, kind) {
  if (!phraseCount || audioState.kind !== kind || !audioState.duration) return 0;
  const progress = getAudioProgress(audioState, kind);
  return Math.min(phraseCount - 1, Math.floor(progress * phraseCount));
}

function formatTime(value) {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getPhrases(verses) {
  const text = verses.map((verse) => `${verse.reference}. ${verse.text}`).join(' ');
  const rough = text.split(/(?<=[,.;:?!])\s+/);
  const phrases = [];
  for (const part of rough) {
    const words = part.trim().split(/\s+/);
    if (words.length <= 14) {
      phrases.push(part.trim());
    } else {
      for (let index = 0; index < words.length; index += 10) {
        phrases.push(words.slice(index, index + 10).join(' '));
      }
    }
  }
  return phrases.filter(Boolean);
}

function getCues(verse, t) {
  const text = verse.text.toLowerCase();
  const found = cueLexicon
    .filter(([pattern]) => new RegExp(pattern).test(text))
    .slice(0, 3)
    .map(([, key]) => ({ label: t[`cue_${key}_label`], note: t[`cue_${key}_note`] }));
  if (found.length) return found;

  return verse.text
    .split(/\s+/)
    .filter((word) => word.replace(/[^A-Za-z]/g, '').length > 6)
    .slice(0, 3)
    .map((word) => {
      const clean = word.replace(/[^A-Za-z]/g, '');
      return { label: clean, note: t.keywordAnchor };
    });
}

function maskText(text, level) {
  if (level === 0) return escapeHtml(text);
  if (level === 4) return text.split('\n\n').map(() => '<span class="inline-block min-w-[18ch] border-b-2 border-red-800 text-transparent">blank</span>').join('<br><br>');

  let wordIndex = 0;
  return text.split(/(\b[A-Za-z']+\b)/).map((token) => {
    if (!/^[A-Za-z']+$/.test(token)) return escapeHtml(token);
    wordIndex += 1;
    const clean = token.replace(/[^A-Za-z]/g, '');
    const shouldMask =
      (level === 1 && wordIndex % 4 === 0) ||
      (level === 2 && (clean.length >= 7 || /hope|faith|grace|holy|christ|god|lord|spirit/i.test(clean))) ||
      level === 3;
    if (!shouldMask) return escapeHtml(token);
    if (level === 3) return `<span class="font-black text-red-800">${escapeHtml(token[0])}</span>${'_'.repeat(Math.max(1, token.length - 1))}`;
    return `<span class="mx-0.5 inline-block min-w-[4.5ch] border-b-2 border-red-800 text-transparent">${escapeHtml(token)}</span>`;
  }).join('');
}

function compareText(target, attempt) {
  const targetWords = normalizeWords(target);
  const attemptWords = normalizeWords(attempt);
  const matches = lcsLength(targetWords, attemptWords);
  const attemptSet = new Set(attemptWords);
  const missing = targetWords.filter((word) => !attemptSet.has(word));
  return {
    score: targetWords.length ? matches / targetWords.length : 0,
    matches,
    targetLength: targetWords.length,
    attemptLength: attemptWords.length,
    missing: [...new Set(missing)],
  };
}

function normalizeWords(text) {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function lcsLength(a, b) {
  const previous = new Array(b.length + 1).fill(0);
  const current = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    previous.splice(0, previous.length, ...current);
    current.fill(0);
  }
  return previous[b.length];
}

function unitsOfChapter(chapter) {
  return onePeterData.units.filter((unit) => unit.chapter === chapter);
}

function versesOfChapter(chapter) {
  return onePeterData.verses.filter((verse) => verse.chapter === chapter);
}

function isChapterLearned(chapter, unitProgress) {
  const units = unitsOfChapter(chapter);
  return units.length > 0 && units.every((unit) => getUnitLearning(unit, unitProgress).learned);
}

function getChapterReview(chapter, unitProgress, chapterProgress) {
  const record = chapterProgress[chapter] || {};
  const learnedOn = record.learnedOn || null;
  const today = todayKey();
  const reviews = reviewCheckpoints.map((checkpoint) => {
    const dueDate = learnedOn ? addDaysKey(learnedOn, checkpoint.offset) : null;
    return {
      ...checkpoint,
      dueDate,
      completed: Boolean(record.reviews?.[checkpoint.id]),
      available: Boolean(learnedOn && dueDate <= today && !record.reviews?.[checkpoint.id]),
    };
  });
  const nextDue = reviews.find((review) => review.available) || null;
  const completedCount = reviews.filter((review) => review.completed).length;
  return {
    chapter,
    learnedOn,
    reviews,
    nextDue,
    completedCount,
    total: reviewCheckpoints.length,
    current: record.current || {},
    score: completedCount / reviewCheckpoints.length,
  };
}

function getDueChapters(unitProgress, chapterProgress) {
  return onePeterData.chapters
    .map(({ chapter }) => getChapterReview(chapter, unitProgress, chapterProgress))
    .filter((review) => review.nextDue);
}

function getStats(unitProgress, chapterProgress) {
  const reviews = onePeterData.chapters.map(({ chapter }) => getChapterReview(chapter, unitProgress, chapterProgress));
  return {
    mastered: reviews.filter((review) => review.completedCount >= reviewCheckpoints.length).length,
    due: reviews.filter((review) => review.nextDue).length,
    best: reviews.reduce((best, review) => Math.max(best, review.score), 0),
  };
}

function unitScore(unit, unitProgress) {
  return getUnitLearning(unit, unitProgress).score;
}

function unitAudioPath(voiceId, unitId) {
  return `/audio/one-peter-memory/${voiceId}/units/${unitId}.mp3`;
}

function previewAudioPath(voiceId) {
  return `/audio/one-peter-memory/${voiceId}/preview.mp3`;
}

function nextInterval(previous, score) {
  if (score >= 0.96) return previous >= 7 ? 14 : Math.max(1, previous * 2 || 1);
  if (score >= 0.84) return Math.max(1, previous || 1);
  return 0;
}

function getUnitLearning(unit, unitProgress) {
  const record = unitProgress[unit.id] || {};
  const sections = learningSectionIds.reduce((items, id) => ({
    ...items,
    [id]: Boolean(record.sections?.[id]),
  }), {});
  const done = learningSectionIds.filter((id) => sections[id]).length;
  return {
    sections,
    done,
    total: learningSectionIds.length,
    score: done / learningSectionIds.length,
    learned: done === learningSectionIds.length,
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addDaysKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
