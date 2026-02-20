// BJJ data — sourced from video transcripts and real match history
// Toby is a brown belt who competes in Gi, No-Gi, and Absolute divisions

export const beltTimeline = [
  {
    belt: 'White',
    color: '#e5e7eb',
    period: 'Early 2010s',
    highlights: [
      'Competed in first tournament — took gold',
      'Learned takedown-to-submission game',
      'Began developing reverse triangle attacks',
      'Lost a ton of tournament matches at 170',
      'Spent a ton of time at white belt and needed a lot of it to improve',
      'Began developing triangle attacks',
    ],
    competed: true,
  },
  {
    belt: 'Blue',
    color: '#3b82f6',
    period: 'Mid 2010s',
    highlights: [
      'Competed and medaled at blue belt',
      'Developed positional dominance game',
      'Refined omoplata-to-reverse triangle entry',
    ],
    competed: true,
  },
  {
    belt: 'Purple',
    color: '#8b5cf6',
    period: 'Late 2010s',
    highlights: [
      'Transitioned focus to coaching',
      'Guided white belt student with 60+ wins to compete against blue belts',
      'Deepened understanding of timing and belt-level skill gaps',
      'Saw Mike Israetel compete at a Northeast tournament as a brown belt',
    ],
    competed: false,
    note: 'Focused on coaching — did not compete personally at this belt',
  },
  {
    belt: 'Brown',
    color: '#92400e',
    period: '2023–Present',
    highlights: [
      'Competed in Gi, No-Gi, and Absolute Cash Prize division',
      'Finished with 3rd place — won via reverse triangle submission',
      'Lost absolute division overtime to a nogi-specialist blue belt (got launched onto concrete)',
      'Beat competition black belt in Gi — showed takedown and positional game',
      'Signature submission: reverse triangle from Omoplata defense',
    ],
    competed: true,
    current: true,
  },
];

export const competitionRecord = {
  totalComps: 3,  // white, blue, brown (skipped purple — was coaching)
  highlights: [
    {
      belt: 'White',
      result: 'Gold',
      icon: '🥇',
    },
    {
      belt: 'Blue',
      result: 'Medal',
      icon: '🏅',
    },
    {
      belt: 'Brown',
      result: '3rd Place',
      icon: '🥉',
      detail: 'Won Gi & No-Gi matches including a reverse triangle; lost absolute overtime',
    },
  ],
};

export const signatureMoves = [
  {
    name: 'Reverse Triangle',
    description: 'Toby\'s go-to submission — entered from Omoplata defense or inside control. Works against purple belts and above.',
    tags: ['Submission', 'Ground', 'Gi & No-Gi'],
  },
  {
    name: 'Deep Double Leg',
    description: 'High-amplitude takedown with lift. Surprised a competition black belt who wasn\'t expecting the athleticism at 220 lbs.',
    tags: ['Takedown', 'Surprise Factor'],
  },
  {
    name: 'Cartwheel Guard Pass',
    description: 'Saved for once-a-year situations. Can execute it — just not at 220+ lbs unless necessary.',
    tags: ['Guard Pass', 'Athletic', 'Gi'],
  },
];

export const trainingPhilosophy = [
  {
    title: 'Compete to Validate',
    body: 'No belt should be accepted without proving it on the mat. Competed at every belt except purple (coaching focus). Returned to competition at brown to set an example for students.',
    icon: '🏆',
  },
  {
    title: 'Position Over Submission — Except When Losing',
    body: 'When ahead on points, controls position. When behind, flips the script — hits dynamic submissions from adverse positions (reverse triangle down 0-12).',
    icon: '🔄',
  },
  {
    title: 'Injury Awareness',
    body: 'Strips dangerous moves against smaller training partners. Uses Garmin + WHOOP to track training load and recovery. Currently training through a broken finger from grip battles with upper belts.',
    icon: '🩹',
  },
  {
    title: 'Size-Aware Game',
    body: 'At 220 lbs, adapts game based on training partner size. Avoids neck-risk moves against heavy partners. Strips cartwheel passes and explosive drops at heavier weights.',
    icon: '⚖️',
  },
];

export const bjjVideos = [
  {
    id: 'dG8GPamRHmA',
    title: 'Is Mike Israetel Really a Legit BJJ Black Belt?',
    description: 'A brown belt\'s insider take — including seeing Israetel compete at a Northeast tournament as a brown belt.',
    date: '2025-11-13',
  },
  {
    id: 'DvBzOcR-RXo',
    title: 'The \'Levels\' of Jiu-Jitsu: Tying My Pants Mid-Roll',
    description: 'The moment you realize skill gaps are real — controlling a white belt while casually retying your gi pants.',
    date: '2026-01-31',
  },
  {
    id: 'CvOTYwkVHAc',
    title: 'Should Black Belts Be Earned ONLY Through Competition?',
    description: 'The nuanced take on belt promotion — why tournament requirements aren\'t always fair, but often necessary.',
    date: '2025-12-03',
  },
  {
    id: 'apsAL3x_V3k',
    title: 'WHOOP vs Garmin for Jiu-Jitsu & Strength Training',
    description: 'Why WHOOP wins for BJJ tracking (chest straps during rolls are terrible) and Garmin wins for running.',
    date: '2026-01-16',
  },
];

export const bjjStats = {
  currentBelt: 'Brown Belt',
  beltsSinceStart: 4,
  compsEntered: 3,
  compsWithMedal: 3,
  currentWeight: 220,
  signatureSubmission: 'Reverse Triangle',
  currentInjury: 'Broken finger (grip battle vs upper belt)',
  trainingPartners: ['purple belts', 'brown belts', 'black belts'],
  grappleStyle: 'Gi & No-Gi',
  yearsTraining: '10+',
};
