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
  Play,
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
import {
  SpeedianceError,
  fetchTemplateByCode,
  installTemplate,
  listUserTemplates,
  login as speedianceLogin,
  shareLinkForCode,
} from "../lib/speediance.js";
import * as hub from "../lib/hubClient.js";

// The hub backend is optional. With no PUBLIC_SUPABASE_URL set at build time
// the page runs as a static catalogue: it makes no network calls at all, so a
// public build never reports a failed connection to a backend that is not
// deployed. The leaderboard and workout sharing need that backend.
const HUB_ONLINE = hub.HUB_ONLINE;
// Account connect deliberately does *not* depend on the backend: the browser
// talks to Speediance directly (see lib/speediance.js), so direct install works
// on the plain static build.
const CONNECT_ENABLED = import.meta.env.PUBLIC_WORKOUT_HUB_CONNECT === "true";
// The provider session lives in sessionStorage only: it is gone when the tab
// closes, and it is never sent anywhere except Speediance.
const PROVIDER_SESSION_KEY = "speediance-provider-session";


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
      { id: 452824662016001, title: "Kneeling Dual-Handle Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 23.0 }] },
      { id: 459578511523841, title: "Standing High-to-Low Woodchops", preset: 3, muscle: "Abs", sets: [{ reps: 13, weight: 17.0 }, { reps: 13, weight: 17.0 }] },
      { id: 450646793650177, title: "Standing Barbell Triceps Push Down", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 25.0 }] },
      { id: 452636801236993, title: "Kneeling Dual-Handle High to Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 452824542478337, title: "Kneeling Dual-Handle Underhand Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 18.0 }] },
      { id: 623, title: "HandsWU-1", preset: -1, muscle: "Pecs", sets: [{ reps: 13, weight: 8.0 }] },
      { id: 452824662016001, title: "Kneeling Dual-Handle Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 30.0 }] },
      { id: 459578511523841, title: "Standing High-to-Low Woodchops", preset: 3, muscle: "Abs", sets: [{ reps: 13, weight: 22.0 }, { reps: 13, weight: 22.0 }] },
      { id: 450646793650177, title: "Standing Barbell Triceps Push Down", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 32.0 }] },
      { id: 452636801236993, title: "Kneeling Dual-Handle High to Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 14.0 }] },
      { id: 452824542478337, title: "Kneeling Dual-Handle Underhand Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 23.0 }, { reps: 13, weight: 23.0 }] },
      { id: 623, title: "HandsWU-1", preset: -1, muscle: "Pecs", sets: [{ reps: 13, weight: 18.0 }] },
      { id: 452700353331201, title: "Half Kneeling Single-Arm Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 28.0 }, { reps: 13, weight: 28.0 }] },
      { id: 453005229293569, title: "Standing Single-Arm Low-to-High Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 22.0 }, { reps: 16, weight: 22.0 }] },
      { id: 452821428207617, title: "Pallof Press", preset: 3, muscle: "Abs", sets: [{ reps: 13, weight: 14.0 }, { reps: 13, weight: 14.0 }] },
      { id: 452638336352257, title: "Standing Alternating Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }, { reps: 13, weight: 12.0 }] },
      { id: 452700353331201, title: "Half Kneeling Single-Arm Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 36.0 }, { reps: 13, weight: 36.0 }] },
      { id: 453005229293569, title: "Standing Single-Arm Low-to-High Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 29.0 }, { reps: 13, weight: 29.0 }] },
      { id: 452821428207617, title: "Pallof Press", preset: 3, muscle: "Abs", sets: [{ reps: 13, weight: 17.0 }, { reps: 13, weight: 17.0 }] },
      { id: 452638336352257, title: "Standing Alternating Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }, { reps: 13, weight: 15.0 }] },
      { id: 452157283237889, title: "Dual Handle Alternating Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 21.0 }] },
      { id: 452157557964801, title: "Supine Dual-Handle Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 450505493839873, title: "Seated Dual-Handle Front Raise", preset: 3, muscle: "Front Delts", sets: [{ reps: 13, weight: 8.0 }] },
      { id: 450644878950401, title: "Seated Dual-Handle Lateral Raise", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 8.0 }] },
      { id: 451925997584385, title: "Seated Single-Arm Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 13.0 }, { reps: 13, weight: 13.0 }] },
      { id: 450505338650625, title: "Seated Dual-Handle Shoulder Press", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 452635377270785, title: "Dual-Handle Calf Raise", preset: 3, muscle: "Calves", sets: [{ reps: 13, weight: 21.0 }] },
      { id: 452157283237889, title: "Dual Handle Alternating Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 26.0 }] },
      { id: 452157557964801, title: "Supine Dual-Handle Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 13.0 }] },
      { id: 450505493839873, title: "Seated Dual-Handle Front Raise", preset: 3, muscle: "Front Delts", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 450644878950401, title: "Seated Dual-Handle Lateral Raise", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 451925997584385, title: "Seated Single-Arm Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 17.0 }, { reps: 13, weight: 17.0 }] },
      { id: 450505338650625, title: "Seated Dual-Handle Shoulder Press", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 13.0 }] },
      { id: 452635377270785, title: "Dual-Handle Calf Raise", preset: 3, muscle: "Calves", sets: [{ reps: 13, weight: 27.0 }] }
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
      { id: 452823615537153, title: "Kneeling Single-Arm Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 30.0 }, { reps: 13, weight: 30.0 }] },
      { id: 452634936868865, title: "Standing Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 450650325254145, title: "Standing Dual-Handle High Cable Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 452824662016001, title: "Kneeling Dual-Handle Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 23.0 }] },
      { id: 452633710034945, title: "Standing Single-Arm High-to-Low Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 26.0 }, { reps: 13, weight: 26.0 }] },
      { id: 450642427379713, title: "Supine Dual-Handle Reverse Fly", preset: 3, muscle: "Rear Delts", sets: [{ reps: 13, weight: 9.5 }] },
      { id: 450643111051265, title: "Seated Dual-Handle Wide Row", preset: 3, muscle: "Rear Delts", sets: [{ reps: 13, weight: 21.0 }] },
      { id: 452639665946625, title: "Seated Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 452823615537153, title: "Kneeling Single-Arm Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 38.0 }, { reps: 13, weight: 38.0 }] },
      { id: 452634936868865, title: "Standing Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 450650325254145, title: "Standing Dual-Handle High Cable Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452824662016001, title: "Kneeling Dual-Handle Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 30.0 }] },
      { id: 452633710034945, title: "Standing Single-Arm High-to-Low Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 33.0 }, { reps: 13, weight: 33.0 }] },
      { id: 450642427379713, title: "Supine Dual-Handle Reverse Fly", preset: 3, muscle: "Rear Delts", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 450643111051265, title: "Seated Dual-Handle Wide Row", preset: 3, muscle: "Rear Delts", sets: [{ reps: 13, weight: 27.0 }] },
      { id: 452639665946625, title: "Seated Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 452157830594561, title: "Dual-Handle Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 20.0 }] },
      { id: 450505338650625, title: "Seated Dual-Handle Shoulder Press", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 451926521872385, title: "Seated Double-Handle Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 450644751024129, title: "Seated Dual-Handle Arnold Press", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452819404455937, title: "Bird Dog Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 27.0 }, { reps: 13, weight: 27.0 }] },
      { id: 450650702741505, title: "Standing Dual-Handle Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 13.0 }] },
      { id: 452634647461889, title: "Standing Dual-Handle Low-to-High Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452157830594561, title: "Dual-Handle Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 26.0 }] },
      { id: 450505338650625, title: "Seated Dual-Handle Shoulder Press", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 13.0 }] },
      { id: 451926521872385, title: "Seated Double-Handle Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 450644751024129, title: "Seated Dual-Handle Arnold Press", preset: 3, muscle: "Side Delts", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 452819404455937, title: "Bird Dog Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 35.0 }, { reps: 13, weight: 35.0 }] },
      { id: 450650702741505, title: "Standing Dual-Handle Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 13.0 }] },
      { id: 452634647461889, title: "Standing Dual-Handle Low-to-High Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] }
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
      { id: 452635108835329, title: "Standing Dual-Handle High-to-Low Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 452636801236993, title: "Kneeling Dual-Handle High to Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 452636983689217, title: "Kneeling Dual-Handle High-to-Low Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 14.0 }] },
      { id: 452634936868865, title: "Standing Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452638336352257, title: "Standing Alternating Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452639665946625, title: "Seated Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 452155257389057, title: "Incline Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452634811039745, title: "Standing Dual-Handle Low-to-High Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452157706862593, title: "Supine Dual-Handle Twist Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 452157417455617, title: "Dual-Handle Reverse Grip Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 452156748464129, title: "Single-Arm Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }, { reps: 13, weight: 12.0 }] },
      { id: 452158166138881, title: "Supine Narrow-Grip Dual-Handle Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 424959556648961, title: "Incline Dual-Handle Chest Fly (Floor)", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 10.0 }] },
      { id: 452635108835329, title: "Standing Dual-Handle High-to-Low Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 13.0 }] },
      { id: 452636801236993, title: "Kneeling Dual-Handle High to Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 14.0 }] },
      { id: 452636983689217, title: "Kneeling Dual-Handle High-to-Low Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 18.0 }] },
      { id: 452639665946625, title: "Seated Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 11.0 }] },
      { id: 452634936868865, title: "Standing Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 452638336352257, title: "Standing Alternating Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 452157417455617, title: "Dual-Handle Reverse Grip Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 452155257389057, title: "Incline Dual-Handle High-to-Low Chest Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 452634811039745, title: "Standing Dual-Handle Low-to-High Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 452157706862593, title: "Supine Dual-Handle Twist Fly", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 452156748464129, title: "Single-Arm Bench Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }, { reps: 13, weight: 15.0 }] },
      { id: 452158166138881, title: "Supine Narrow-Grip Dual-Handle Chest Press", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 15.0 }] },
      { id: 424959556648961, title: "Incline Dual-Handle Chest Fly (Floor)", preset: 3, muscle: "Pecs", sets: [{ reps: 13, weight: 13.0 }] }
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
      { id: 450646793650177, title: "Standing Barbell Triceps Push Down", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 25.0 }] },
      { id: 451954231541761, title: "Incline Barbell High Cable Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 18.0 }] },
      { id: 423831154065409, title: "\u200bSupine Barbell High Cable Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 20.0 }] },
      { id: 451958266462209, title: "Supine Barbell Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 20.0 }] },
      { id: 451958436331521, title: "\u200bSupine Barbell Overhand Biceps Curl", preset: 3, muscle: "Forearms", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 450647842226177, title: "Standing Barbell Overhead Triceps Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 21.0 }] },
      { id: 450647158554625, title: "Standing Barbell Reverse-Grip Overhead Tricep Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 12.0 }] },
      { id: 441411661135873, title: "Table Top Barbell Triceps Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 450647158554625, title: "Standing Barbell Reverse-Grip Overhead Tricep Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 450646793650177, title: "Standing Barbell Triceps Push Down", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 32.0 }] },
      { id: 451954231541761, title: "Incline Barbell High Cable Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 23.0 }] },
      { id: 423831154065409, title: "\u200bSupine Barbell High Cable Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 26.0 }] },
      { id: 451958266462209, title: "Supine Barbell Biceps Curl", preset: 3, muscle: "Biceps", sets: [{ reps: 13, weight: 26.0 }] },
      { id: 451958436331521, title: "\u200bSupine Barbell Overhand Biceps Curl", preset: 3, muscle: "Forearms", sets: [{ reps: 13, weight: 21.0 }] },
      { id: 450647842226177, title: "Standing Barbell Overhead Triceps Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 28.0 }] },
      { id: 450647158554625, title: "Standing Barbell Reverse-Grip Overhead Tricep Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 16.0 }] },
      { id: 441411661135873, title: "Table Top Barbell Triceps Extension", preset: 3, muscle: "Triceps", sets: [{ reps: 13, weight: 20.0 }] }
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
      { id: 452824223711233, title: "Kneeling Barbell Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 40.0 }] },
      { id: 452823751852033, title: "Kneeling Barbell Reverse-Grip Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 41.0 }] },
      { id: 452826517995521, title: "Seated Barbell Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 43.0 }] },
      { id: 452826383777793, title: "Seated Barbell Reverse-Grip Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 41.0 }] },
      { id: 452826641727489, title: "Seated Barbell Wide Reverse-Grip Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 26.0 }] },
      { id: 452700806316033, title: "Incline Barbell Straight Arm Pushdown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 33.0 }] },
      { id: 452701609525249, title: "Seated Barbell Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 43.0 }] },
      { id: 452701466918913, title: "Seated Barbell Reverse-Grip Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 38.0 }] },
      { id: 452701756325889, title: "Seated Barbell Wide Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 46.0 }] },
      { id: 452696848990209, title: "Barbell Bent Over Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 45.0 }] },
      { id: 452824223711233, title: "Kneeling Barbell Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 51.0 }] },
      { id: 452823751852033, title: "Kneeling Barbell Reverse-Grip Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 53.0 }] },
      { id: 452826517995521, title: "Seated Barbell Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 55.0 }] },
      { id: 452826383777793, title: "Seated Barbell Reverse-Grip Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 52.0 }] },
      { id: 452696727355393, title: "Bent-Over Reverse-Grip Barbell Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 36.0 }] },
      { id: 452826641727489, title: "Seated Barbell Wide Reverse-Grip Lat Pulldown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 33.0 }] },
      { id: 452700806316033, title: "Incline Barbell Straight Arm Pushdown", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 43.0 }] },
      { id: 452701609525249, title: "Seated Barbell Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 55.0 }] },
      { id: 452701466918913, title: "Seated Barbell Reverse-Grip Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 49.0 }] },
      { id: 452701756325889, title: "Seated Barbell Wide Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 58.0 }] },
      { id: 452696848990209, title: "Barbell Bent Over Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 57.0 }] },
      { id: 452696727355393, title: "Bent-Over Reverse-Grip Barbell Row", preset: 3, muscle: "Lats", sets: [{ reps: 13, weight: 36.0 }] }
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

// A template's per-set values arrive as parallel comma separated strings, so
// reps and loads have to be zipped back together by position.
const setsFromTemplateAction = (action) => {
  const reps = String(action.setsAndReps ?? "").split(",").filter((part) => part !== "");
  const weights = String(action.weights ?? "").split(",");
  if (reps.length === 0) return [];
  return reps.map((rep, index) => {
    const set = { reps: Number(rep) || 0 };
    const weight = Number(weights[index]);
    if (Number.isFinite(weight) && weights[index] !== "") set.weight = weight;
    return set;
  });
};

// Turn a Speediance template into the same payload shape the catalogue uses, so
// one workout means the same thing to the fingerprint whichever tab it came from.
const templateToExportPayload = (template, detail) => {
  const source = detail || template;
  const actions = [...(source.actionLibraryList || [])].sort(
    (a, b) => Number(a.sort || 0) - Number(b.sort || 0),
  );
  return {
    format: "tobyonfitnesstech.speediance-workout.v1",
    name: source.name || template.name,
    description: source.description || "",
    source_code: template.code || source.code || null,
    source_link: template.code ? shareLinkForCode(template.code) : null,
    creator: null,
    weight_unit: 0,
    // Carrying the template id is what lets sync match a training record to this
    // entry exactly, instead of falling back to matching on the title.
    provider_template_id: String(template.id),
    exercises: actions.map((action) => ({
      id: action.actionLibraryId ?? action.id,
      group_id: action.groupId ?? action.group_id,
      title: action.actionName ?? action.name ?? action.title ?? "",
      preset: action.templatePresetId ?? 3,
      sets: setsFromTemplateAction(action),
    })).filter((exercise) => exercise.id && exercise.sets.length > 0),
  };
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

// Hub records carry no Speediance share code, so a workout served from the
// backend loses the code that direct install needs. Restore it from the bundled
// entry of the same name.
const bundledByName = new Map(
  defaultTobyWorkouts.map((workout) => [
    String(workout.name || "").trim().toLowerCase(),
    workout,
  ]),
);

const withProviderCode = (list) =>
  list.map((workout) => {
    if (workout.code || workout.provider_template_code) return workout;
    const match = bundledByName.get(String(workout.name || "").trim().toLowerCase());
    return match ? { ...workout, code: match.code, link: match.link } : workout;
  });

// navigator.clipboard only exists in a secure context, and the LAN preview is
// served over plain http, so fall back to the legacy selection copy.
const writeToClipboard = async (value) => {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the textarea path below.
  }
  try {
    const holder = document.createElement("textarea");
    holder.value = value;
    holder.setAttribute("readonly", "");
    holder.style.position = "fixed";
    holder.style.top = "-1000px";
    holder.style.opacity = "0";
    document.body.appendChild(holder);
    holder.select();
    holder.setSelectionRange(0, value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(holder);
    return copied;
  } catch {
    return false;
  }
};



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
  // The live Speediance session, held in memory + sessionStorage for this tab.
  const [session, setSession] = useState(null);
  // The connected account's own custom templates, read straight from Speediance.
  const [myTemplates, setMyTemplates] = useState(null);

  const loadWorkouts = async () => {
    try {
      const data = await hub.listWorkouts();
      if (Array.isArray(data) && data.length > 0) {
        setWorkouts(withProviderCode(data));
        setSelectedId((current) => current || data[0]?.id || null);
      }
    } catch {
      // Keep static fallback
    }
  };

  useEffect(() => {
    if (!CONNECT_ENABLED) return;
    if (HUB_ONLINE) {
      // A hub session outlives a reload within the same tab, so pick it back up
      // rather than making a connected visitor sign in again.
      hub.isSignedIn().then((signedIn) => setToken(signedIn ? "hub" : ""));
    }
    // Restore the provider session so a reload inside the same tab keeps the
    // account connected without asking for the password again.
    try {
      const raw = window.sessionStorage.getItem(PROVIDER_SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.token && saved.appUserId) {
          setSession(saved);
          setMe({ display_name: saved.displayName });
        }
      }
    } catch {
      window.sessionStorage.removeItem(PROVIDER_SESSION_KEY);
    }
  }, []);


  useEffect(() => {
    if (!HUB_ONLINE) return undefined;
    let cancelled = false;
    const boot = async () => {
      setLoading(true);
      try {
        const data = await hub.listWorkouts();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setWorkouts(withProviderCode(data));
          setSelectedId(data[0]?.id || null);
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

  // Hub-account identity. The provider session drives `me` when the backend is
  // offline, so this must not clear an identity it does not own.
  useEffect(() => {
    if (!HUB_ONLINE) return undefined;
    if (!token) {
      if (!session) setMe(null);
      return undefined;
    }
    let cancelled = false;
    hub
      .getMe()
      .then((data) => {
        if (!cancelled && data) setMe(data);
      })
      .catch(() => {
        if (!cancelled) {
          setToken("");
          if (!session) setMe(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, session]);

  useEffect(() => {
    if (!HUB_ONLINE || !selectedId) {
      setLeaderboard([]);
      return undefined;
    }
    let cancelled = false;
    hub
      .getLeaderboard(selectedId)
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

  const tabs = useMemo(
    () => [
      { id: "library", label: "Workout Library", icon: Dumbbell },
      ...(HUB_ONLINE
        ? [
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "share", label: "Share Workout", icon: ArrowUpFromLine },
          ]
        : []),
      ...(CONNECT_ENABLED
        ? [
            {
              id: me ? "__disconnect" : "account",
              label: me ? "Disconnect" : "Connect",
              icon: me ? Unplug : Link2,
            },
          ]
        : []),
    ],
    [me],
  );

  const visibleTabs = useMemo(
    () =>
      session
        ? [...tabs, { id: "mine", label: "My Workouts", icon: UserRoundCheck }]
        : tabs,
    [session, tabs],
  );

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
      // A rejected provider token is unusable, so drop it rather than leaving
      // the page looking connected.
      if (err instanceof SpeedianceError && /session expired/i.test(err.message)) {
        window.sessionStorage.removeItem(PROVIDER_SESSION_KEY);
        setSession(null);
        setMe(null);
      }
    } finally {
      setBusy("");
    }
  };

  // Login happens browser-to-Speediance. The password lives in component state
  // for the duration of the request and is cleared as soon as it succeeds; it is
  // never persisted and never sent to this site.
  const connect = (event) => {
    event.preventDefault();
    run("connect", async () => {
      const result = await speedianceLogin({
        email: connectForm.email,
        password: connectForm.password,
        region: connectForm.region || "Global",
      });

      // The leaderboard is server state, so when a hub backend is present the
      // same login also opens a hub session. Without one, connect is provider
      // only and the page stays a catalogue plus direct install.
      if (HUB_ONLINE) {
        try {
          // Only the provider token crosses to the hub. The password stays in
          // this function's scope and is cleared as soon as login succeeds.
          await hub.connect({
            providerSession: result,
            region: connectForm.region || "Global",
            unit: 1,
            deviceType: 1,
          });
          setToken("hub");
        } catch (hubError) {
          // A provider login that works is still worth keeping.
          setNotice(
            `Connected to Speediance, but the hub backend refused the session (${hubError.message}). Leaderboard actions are unavailable.`,
          );
        }
      }

      setConnectForm((current) => ({ ...current, password: "" }));
      window.sessionStorage.setItem(PROVIDER_SESSION_KEY, JSON.stringify(result));
      setSession(result);
      setMe({ display_name: result.displayName });
      setNotice(
        `Connected to Speediance as ${result.displayName}. Your password was not stored.`,
      );
      // Land on the account's own library: it is the one view that only exists
      // because you connected, so connecting visibly does something.
      setActiveTab("mine");
    });
  };

  const disconnect = () =>
    run("disconnect", async () => {
      window.sessionStorage.removeItem(PROVIDER_SESSION_KEY);
      setSession(null);
      setMe(null);
      if (HUB_ONLINE && token) {
        await hub.disconnect().catch(() => {});
        setToken("");
      }
      setNotice("Speediance session cleared from this browser.");
    });

  const copyText = async (value) => {
    if (!value) return;
    if (await writeToClipboard(value)) {
      setCopiedCode(value);
      setTimeout(() => setCopiedCode(""), 2000);
      return;
    }
    setError(
      "This browser blocked the clipboard. Select the text below and copy it manually.",
    );
  };

  // Reading your own library needs nothing but the provider session, so this
  // works on the static build exactly as it does against the hub backend.
  const loadMyTemplates = () =>
    run("my-templates", async () => {
      const templates = await listUserTemplates({ session });
      setMyTemplates(templates);
      if (templates.length === 0) {
        setNotice("Speediance returned no custom workouts for this account.");
      }
    });

  useEffect(() => {
    if (!session) {
      setMyTemplates(null);
      return;
    }
    if (myTemplates === null && activeTab === "mine") loadMyTemplates();
  }, [session, activeTab, myTemplates]);

  // Joining a leaderboard shares the program if nobody has yet, and otherwise
  // attaches to the existing entry matched on name and exercises.
  // The hub session and the Speediance session are two different things, and the
  // page can legitimately hold the second without the first: the hub call can
  // fail while connect still succeeds, and a hub session can age out inside a
  // tab that stays open. Sending a visibly connected account back to the Connect
  // form in that state is just wrong, so re-open the hub session in place from
  // the provider session already in hand.
  const ensureHubSession = async () => {
    if (token) return;
    if (!session) throw new Error("Connect your Speediance account first.");
    await hub.connect({
      providerSession: session,
      region: connectForm.region || session.region || "Global",
      unit: 1,
      deviceType: 1,
    });
    setToken("hub");
  };

  // Gates on the Speediance session, not the hub one — the hub session is this
  // component's problem to obtain, not something to send the visitor away over.
  const requireConnected = (message) => {
    if (!HUB_ONLINE) {
      setNotice("Leaderboards need the hub backend, which is not running.");
      return false;
    }
    if (!session) {
      setActiveTab("account");
      setNotice(message);
      return false;
    }
    return true;
  };

  const addToLeaderboard = (workoutId) => {
    if (!requireConnected("Connect your Speediance account to join a leaderboard.")) return;
    run(`leaderboard-${workoutId}`, async () => {
      const workout = allAvailableWorkouts.find((item) => item.id === workoutId);
      if (!workout) throw new Error("That workout is no longer in the catalogue.");
      await ensureHubSession();
      const result = await hub.claimWorkout(buildExportPayload(workout));
      setNotice(
        result.matched_existing
          ? `Joined the existing leaderboard for "${workout.name}" — another member had already shared it.`
          : `"${workout.name}" is now shared and has its own leaderboard.`,
      );
      setSelectedId(result.id || workoutId);
      setActiveTab("leaderboard");
    });
  };

  // The account's own workouts are the ones worth putting on a board: they carry
  // a real template id, which is what sync matches completions against.
  const addTemplateToLeaderboard = (template) => {
    if (!requireConnected("Connect your Speediance account to join a leaderboard.")) return;
    run(`template-leaderboard-${template.id}`, async () => {
      await ensureHubSession();
      // The list endpoint does not always carry the exercise breakdown, and the
      // fingerprint is built from it, so fall back to the shared detail.
      let detail = null;
      if (!Array.isArray(template.actionLibraryList) || template.actionLibraryList.length === 0) {
        if (!template.code) {
          throw new Error(
            `"${template.name}" is not shared on Speediance yet, so its exercises cannot be read. Share it in the app first.`,
          );
        }
        detail = await fetchTemplateByCode({ session, code: template.code });
      }
      const payload = templateToExportPayload(template, detail);
      if (payload.exercises.length === 0) {
        throw new Error(`"${template.name}" has no readable exercises to publish.`);
      }
      const result = await hub.claimWorkout(payload);
      setNotice(
        result.matched_existing
          ? `Joined the existing leaderboard for "${payload.name}" — another member had already shared it.`
          : `"${payload.name}" is now shared and has its own leaderboard.`,
      );
      await loadWorkouts();
      setSelectedId(result.id);
      setActiveTab("leaderboard");
    });
  };

  const install = (workoutId) => {
    if (!CONNECT_ENABLED) {
      setNotice(
        "Direct install is off on this build. Use the JSON export or open the program in the Speediance app.",
      );
      return;
    }
    if (!session) {
      setActiveTab("account");
      setNotice("Connect your Speediance account before installing a workout.");
      return;
    }
    run(`install-${workoutId}`, async () => {
      const workout = allAvailableWorkouts.find((item) => item.id === workoutId);
      const code = workout && (workout.code || workout.provider_template_code);
      if (!code) {
        throw new Error("This workout has no Speediance share code to install from.");
      }
      const installed = await installTemplate({ session, code, name: workout.name });
      setNotice(
        `"${installed.name}" is now in your Speediance custom workout library.`,
      );
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
      const payload = await hub.exportWorkout(workoutId);
      downloadWorkout(payload);
    });

  const sync = () =>
    run("sync", async () => {
      // Sync reads the provider's own record of what was finished, so it needs
      // the Speediance session as well as the hub one.
      if (!session) {
        throw new Error(
          "Connect your Speediance account before syncing completions.",
        );
      }
      await ensureHubSession();
      const result = await hub.syncCompletions({
        providerSession: session,
        region: connectForm.region || "Global",
        unit: 1,
        startDate: daysAgoIso(90),
        endDate: todayIso(),
      });
      setNotice(
        `Synced ${result.imported} verified completions from your Speediance history.`,
      );
      await loadWorkouts();
      if (selectedId) {
        const updatedLeaderboard = await hub.getLeaderboard(selectedId);
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
      const created = await hub.publishWorkout(imported.payload);
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
                {HUB_ONLINE
                  ? "Export community routines, install workouts to your device, and sync verified volume to the global leaderboard."
                  : CONNECT_ENABLED
                    ? "Browse every set of 53 shared Speediance routines, install any of them straight to your own account, or export one as JSON."
                    : "Browse every set of 53 shared Speediance routines, export any of them as JSON, or open one straight in the app."}
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
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => (id === "__disconnect" ? disconnect() : setActiveTab(id))}
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
                {/* Syncing completions writes to the shared hub, so it needs a hub
                    session — not just the provider login that connect always does.
                    Without one the button could only ever return a 401. */}
                {HUB_ONLINE && token && (
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
                )}
                <button
                  type="button"
                  onClick={disconnect}
                  disabled={Boolean(busy)}
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-neutral-300 hover:bg-white/[0.07] disabled:opacity-50"
                >
                  <Unplug size={15} />
                  Disconnect
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
                      <span>Sam ({samWorkoutCount})</span>
                      <a
                        href="https://www.youtube.com/@SpeedyHomeGains"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Sam on YouTube — @SpeedyHomeGains"
                        aria-label="Sam on YouTube — @SpeedyHomeGains"
                        className="ml-1 inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300 transition hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/50"
                      >
                        <Play size={12} className="fill-current" />
                        <span>Speedy Home Gains</span>
                      </a>
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
              onCopyCode={copyText}
              onInstall={install}
              onExport={exportJson}
              onLeaderboard={(id) => {
                setSelectedId(id);
                setActiveTab("leaderboard");
              }}
              onAddToLeaderboard={addToLeaderboard}
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

        {activeTab === "mine" && (
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-400">
                  Your Speediance account
                </p>
                <h2 className="mt-2 text-3xl font-medium tracking-tight">
                  My custom workouts
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-neutral-400">
                  Read live from your Speediance library. Every custom workout
                  carries a share code — copy its link to send the program to
                  anyone, and it opens straight in their app.
                </p>
              </div>
              <button
                type="button"
                onClick={loadMyTemplates}
                disabled={Boolean(busy)}
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-white/[0.07] disabled:opacity-50 transition"
              >
                <RefreshCw
                  size={14}
                  className={busy === "my-templates" ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {busy === "my-templates" && myTemplates === null ? (
              <Loading label="Reading your Speediance library" />
            ) : myTemplates && myTemplates.length > 0 ? (
              <div className="mt-7 space-y-3">
                {myTemplates.map((template) => {
                  const code = template.code || "";
                  const link = code ? shareLinkForCode(code) : "";
                  return (
                    <div
                      key={template.id}
                      className="rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-white">{template.name}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {(template.actionLibraryList || []).length || "—"} exercises
                            {code ? "" : " · not shared yet"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {HUB_ONLINE && (
                            <button
                              type="button"
                              onClick={() => addTemplateToLeaderboard(template)}
                              disabled={busy === `template-leaderboard-${template.id}`}
                              className="inline-flex items-center gap-2 rounded-md border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-400/20 disabled:opacity-50 transition"
                              title="Publish this workout to the shared hub and join its leaderboard"
                            >
                              <Trophy size={14} />
                              {busy === `template-leaderboard-${template.id}`
                                ? "Adding…"
                                : "Add to leaderboard"}
                            </button>
                          )}
                          {code && (
                            <>
                              <button
                                type="button"
                                onClick={() => copyText(link)}
                                className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition"
                                title="Copy shareable link"
                              >
                                {copiedCode === link ? (
                                  <Check size={14} />
                                ) : (
                                  <ArrowUpFromLine size={14} />
                                )}
                                Copy share link
                              </button>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/[0.07] transition"
                              >
                                <ExternalLink size={14} />
                                Open
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      {code && (
                        <p className="mt-3 break-all font-mono text-[11px] text-neutral-500">
                          {link}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-7">
                <Empty
                  icon={Dumbbell}
                  title="No custom workouts found"
                  body="This Speediance account has no custom templates, or they are stored under a different device type."
                />
              </div>
            )}
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
                Your browser signs in to Speediance directly. This site is static
                — the request goes from your device to{" "}
                <span className="font-mono text-xs text-neutral-300">
                  {connectForm.region === "EU"
                    ? "euapi.speediance.com"
                    : "api2.speediance.com"}
                </span>{" "}
                and nothing is sent to tobyonfitnesstech.com. Your password is
                used for that one request and never stored; the session it
                returns is kept in this tab only and disappears when you close
                it.
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
                        {HUB_ONLINE
                          ? "You can install shared workouts and sync verified completions."
                          : "Open any workout in the library and use Install to my device to copy it into your Speediance account."}
                      </p>
                      <button
                        type="button"
                        onClick={disconnect}
                        disabled={Boolean(busy)}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                      >
                        <Unplug size={15} />
                        Disconnect and clear this session
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
                body="Used once for the Speediance login request, then cleared from the form."
              />
              <SecurityItem
                icon={Database}
                title="No server in the middle"
                body="A static page cannot receive your credentials. Your browser calls Speediance itself — check the Network tab."
              />
              <SecurityItem
                icon={ShieldCheck}
                title="Session ends with the tab"
                body="The Speediance session is held in sessionStorage, so closing the tab signs you out."
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
  onAddToLeaderboard,
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
  // Install re-posts the program from its Speediance share code, so both the
  // code and a resolved structure have to be present.
  const canInstall = hasStructure && Boolean(workout.code || workout.provider_template_code);

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

          {/* Sam's YouTube channel — replaces the old Program Code snippet */}
          {workout.is_sam && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href="https://www.youtube.com/@SpeedyHomeGains"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Sam on YouTube — @SpeedyHomeGains"
                aria-label={`Sam on YouTube — @SpeedyHomeGains (${workout.name})`}
                className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/50"
              >
                <Play size={12} className="fill-current" />
                <span>Watch on YouTube — @SpeedyHomeGains</span>
              </a>
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
              disabled={Boolean(busy) || !canInstall}
              title={
                canInstall
                  ? "Copy this program into your Speediance library"
                  : hasStructure
                    ? "This entry has no Speediance share code, so it cannot be installed"
                    : "This program is no longer shared on Speediance"
              }
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
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onAddToLeaderboard(workout.id)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-300 hover:text-orange-200 disabled:opacity-50"
                    title="Share this workout if nobody has yet, then join its leaderboard"
                  >
                    {busy === `leaderboard-${workout.id}` ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Medal size={15} />
                    )}
                    Add to leaderboard
                  </button>
                  <button
                    type="button"
                    onClick={() => onLeaderboard(workout.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-300 hover:text-orange-200"
                  >
                    <Users size={15} />
                    View leaderboard
                  </button>
                </div>
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
                  ? "This program is no longer shared on Speediance's cloud registry, so it can't be installed until the owner re-shares it."
                  : "This routine is shared through Speediance's cloud program registry. Tap below to open it directly in the app on your phone."}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
