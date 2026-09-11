export type ProjectLink = { label: string; href: string };
export type ProjectFeature = { title: string; description: string };
export type WorkflowFile = {
  file: string;
  title: string;
  description: string;
  command: string;
  implementation: string[];
};

export type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
  aspect?: 'video' | 'square' | 'portrait' | 'wide';
};

export type ProjectEpisode = {
  number?: string | number;
  title: string;
  subtitle?: string;
  description: string;
  youtubeId?: string;
  youtubeUrl?: string;
  isShort?: boolean;
  thumbnail?: string;
  highlights?: string[];
};

export type ProjectCharacter = {
  name: string;
  role: string;
  description: string;
  image?: string;
  voiceActor?: string;
};

export type ProjectGalleryItem = {
  src: string;
  alt: string;
  title: string;
  description: string;
};

export type Project = {
  slug: string;
  title: string;
  status: string;
  description: string;
  tags: string[];
  overview: string[];
  features: ProjectFeature[];
  steps: ProjectFeature[];
  notes: string;
  links: ProjectLink[];
  workflowFiles?: WorkflowFile[];
  heroImage?: ProjectImage;
  featuredYoutubeId?: string;
  episodes?: ProjectEpisode[];
  characters?: ProjectCharacter[];
  gallery?: ProjectGalleryItem[];
  productionNotes?: { title: string; content: string }[];
};

// Public source only. Device inventories, machine addresses and account data
// belong in the automation project's external private configuration directory.
export const pokemonRepository = 'https://github.com/tobyglenn/pokemon-go-automation';
export const projectHref = (slug: string) => `/projects/${slug}/`;

export const projectGroups: { id: string; eyebrow: string; title: string; description: string; projects: Project[] }[] = [
  {
    id: 'automation', eyebrow: 'Automation', title: 'Pokémon GO automation',
    description: 'Reusable Python workflows for connected phones, with personal device configuration kept outside the source code.',
    projects: [{
      slug: 'pokemon-go-automation', title: 'Pokémon GO Automation', status: 'Open source',
      description: 'Gift sending, friend requests, GO Battle League, trades, transfers, and berry feeding in one documented toolkit for Android and iOS devices.',
      tags: ['Python', 'Android + iOS', 'Device automation', 'ADB', 'Computer Vision'],
      heroImage: {
        src: '/images/projects/pokemon-go-automation/hero.png',
        alt: 'Physical device running automated Pokémon GO Battle League combat sequence',
        caption: 'Live physical device running automated GO Battle League matches, move timing, and charged attacks via ADB.',
        aspect: 'portrait',
      },
      gallery: [
        {
          src: '/images/projects/pokemon-go-automation/battle_shield.png',
          alt: 'Automated protect shield activation during GO Battle League combat',
          title: 'Shield Timing & Defense',
          description: 'Sub-pixel template matching and frame timing to trigger defensive protect shields against incoming opponent charged moves.',
        },
        {
          src: '/images/projects/pokemon-go-automation/battle_charge.png',
          alt: 'Charged move execution with combat feedback and stat debuff detection',
          title: 'Charged Attack Execution',
          description: 'Real-time optical frame evaluation detecting super-effective multipliers, charged move mini-game swiping, and stat changes.',
        },
        {
          src: '/images/projects/pokemon-go-automation/battle_party.png',
          alt: 'Automated battle party selection for Competitors Cup',
          title: 'Party Selection & Matchmaking',
          description: 'Automated league navigation, party composition verification, and match queuing without manual inputs.',
        },
      ],
      overview: [
        'This project brings the repetitive parts of my daily Pokémon GO routine into a unified Python automation toolkit. A concise set of named commands coordinates gift sending, friend code queuing, GO Battle League matches, peer-to-peer trading, bulk transfers, and berry feeding across tethered devices.',
        'The public architecture separates reusable device-interaction logic from private credentials. You supply your own device identifiers, screen resolutions, and friend lists. The codebase provides the complete execution pipeline so another developer or AI coding agent can reproduce the setup on independent hardware.',
      ],
      features: [
        { title: 'One entry point per job', description: 'Descriptive Python entry points route directly into platform-specific Android (ADB) and iOS workers rather than burying execution in an unmaintainable monolith.' },
        { title: 'A shared fleet layer', description: 'Device discovery, battery thresholds, readiness checks, and optional remote-machine dispatch operate independently from game-specific loops.' },
        { title: 'Private configuration by design', description: 'Device serials, machine IPs, account tokens, friend lists, and execution logs stay strictly within private configuration directories, using generic templates in version control.' },
        { title: 'Inspectable execution plans', description: 'Running any command with --plan previews device routing, screen coordinates, and target counts without touching physical game state.' },
      ],
      steps: [
        { title: 'Install the package and device tools', description: 'Set up Python dependencies and verify ADB connectivity for Android devices or the documented WebDriverAgent connection for iOS hardware.' },
        { title: 'Create your private inventory', description: 'Copy pokemon-fleet.example.yaml into ~/.config/pokemon-go-automation/ and map your connected device serials and screen calibrations.' },
        { title: 'Check readiness and review a plan', description: 'Run python fleet.py status to verify battery and connection health, then execute your target command with --plan.' },
        { title: 'Run and inspect physical results', description: 'Execute live workflows with small batches while monitoring the physical screen to verify gesture alignment and network latency tolerances.' },
      ],
      productionNotes: [
        { title: 'Sub-Pixel Optical Verification', content: 'Rather than blindly sending tap events on fixed timers, the pipeline samples screen frames using fast ADB framebuffer grabs, applying OpenCV template matching to confirm animations completed.' },
        { title: 'Fleet Health & Thermal Throttling', content: 'Devices run prolonged background batches. The fleet monitor polls battery levels and CPU temperatures, inserting cool-down intervals when thermal throttling threatens frame rates.' },
      ],
      notes: 'These workflows interact directly with the Pokémon GO interface on physical hardware. Screen layouts, game updates, and network lag can alter timing. Always review proposed trades and transfers with --plan prior to live runs.',
      links: [{ label: 'Browse the source on GitHub', href: pokemonRepository }],
      workflowFiles: [
        { file: 'send_gifts.py', title: 'Send gifts', description: 'Send gifts using the platform-specific friends-list workflow and the selected fleet.', command: 'python send_gifts.py --count 1 --plan', implementation: ['sources/gift_android.py', 'sources/gift_ios.py'] },
        { file: 'add_friends.py', title: 'Add friends', description: 'Run the friend-request workflow with trainer codes supplied in your private configuration. Keep real codes and queue files out of version control.', command: 'python add_friends.py --plan', implementation: [] },
        { file: 'battle_league.py', title: 'GO Battle League', description: 'Route to the Android or iOS GBL implementation. Consult the workflow options and verify the starting game screen before executing battles.', command: 'python battle_league.py --count 1 --plan', implementation: ['sources/gbl_android.py', 'sources/gbl_ios.py'] },
        { file: 'trade_pokemon.py', title: 'Trade Pokémon', description: 'Coordinate a selected pair of devices for the trading workflow. Select two devices on the same host. Pair names come from your private inventory; these names are examples.', command: 'python trade_pokemon.py --pair android-one android-two --count 1 --plan', implementation: ['sources/pokemon_fleet.py'] },
        { file: 'transfer_pokemon.py', title: 'Transfer Pokémon', description: 'Use the platform-specific transfer workflow for collection cleanup. Review the search, selection, and protection behavior before a live run.', command: 'python transfer_pokemon.py --count 1 --plan', implementation: ['sources/luckytrash_android.py', 'sources/luckytrash_ios.py'] },
        { file: 'feed_berries.py', title: 'Feed berries', description: 'Run the berry-feeding workflow through the same device-selection and planning conventions.', command: 'python feed_berries.py --spend 1 --plan', implementation: ['sources/berry_android.py', 'sources/berry_ios.py'] },
        { file: 'fleet.py', title: 'Inspect the fleet', description: 'Read the configured inventory and report readiness before launching a workflow. Use the fleet documentation when adding remote machines.', command: 'python fleet.py status', implementation: ['sources/pokemon_fleet.py'] },
      ],
    }],
  },
  {
    id: 'games', eyebrow: 'Games', title: 'Playable experiments',
    description: 'Browser games built around fighting, tactics, and the choices that make a round interesting.',
    projects: [
      {
        slug: 'mma-rpg', title: 'MMA RPG', status: 'Live',
        description: 'A browser fighting RPG with an arena, training room, and stand-up and ground-game controls.',
        tags: ['Fighting', 'RPG', 'Browser game', 'JavaScript', 'HTML5 Canvas'],
        heroImage: {
          src: '/images/projects/mma-rpg/hero.png',
          alt: 'MMA RPG title screen and fighter archetype selection',
          caption: 'Turn-based mixed martial arts RPG interface with Brawler and Featherweight fighter archetypes.',
          aspect: 'wide',
        },
        overview: [
          'MMA RPG brings the tactical tension of mixed martial arts into a responsive browser-based game. Built collaboratively with Digi, the game translates striking, clinch fighting, takedowns, ground-and-pound, and submission transitions into clean turn-based decisions.',
          'The project solves the challenge of making a sport with dynamic positional shifts readable on screens of any size. Players navigate a full career loop: training in the weight room to build stamina and power, managing camp fatigue, and stepping into the cage under the roar of the crowd hype meter.',
        ],
        features: [
          { title: 'Stand-up & Ground State Machines', description: 'Fights transition smoothly between orthodox striking range, Thai clinch knees, double-leg takedown shots, half guard scrambles, and full mount.' },
          { title: 'Stamina & Crowd Hype Systems', description: 'Throwing high-damage hooks drains stamina quickly; maintaining pressure builds crowd hype, unlocking signature fight-ending combinations.' },
          { title: 'Weight Room Progression', description: 'Between bouts, train bench press, heavy bag endurance, and mat drills to level up core attributes and prepare for ranked contenders.' },
          { title: 'Local & Networked Play', description: 'Play solo against responsive AI fighters or challenge a peer via direct browser room hosting.' },
        ],
        steps: [
          { title: 'Choose your fighter archetype', description: 'Select between high-power Brawlers or lightning-fast Featherweights with distinct move pools.' },
          { title: 'Master the combat wheel', description: 'Use directional arena controls to time jabs, parries, feints, and takedown entries.' },
          { title: 'Advance through the rankings', description: 'Win bouts by decision, knockout, or submission to climb the circuit and unlock championship belts.' },
        ],
        productionNotes: [
          { title: 'Pure Canvas & Vanilla DOM Architecture', content: 'Engineered with zero bulky game engine dependencies, running at 60 FPS on both mobile touch screens and desktop keyboards.' },
        ],
        notes: 'MMA RPG is an actively updated playable prototype. You can play directly in your browser without installs or accounts.',
        links: [{ label: 'Play MMA RPG Live', href: 'https://clawdassistant85-netizen.github.io/mma-rpg/' }],
      },
      {
        slug: 'gridbound-realms', title: 'Gridbound Realms', status: 'Live',
        description: 'A tactical browser game with a grid-based battlefield, unit actions, and solo or local multiplayer modes.',
        tags: ['Strategy', 'Tactics', 'Grid', 'Turn-based', 'Multiplayer'],
        heroImage: {
          src: '/images/projects/gridbound-realms/hero.png',
          alt: 'Gridbound Realms tactical grid battlefield and turn controls',
          caption: 'Turn-based grid tactics battlefield showing unit positions, combat action panels, and zone objectives.',
          aspect: 'wide',
        },
        overview: [
          'Gridbound Realms is a turn-based tactical strategy game built for players who love spatial puzzles and unit positioning. Command a squad across a terrain grid, carefully balancing movement range, action points, line of sight, and special abilities.',
          'The game features a multi-map solo campaign alongside hotseat Local Co-op and Local Versus modes. Every decision is transparent: selected units display attack reach, defensive cover bonuses, and a chronological battle log recapping every engagement.',
        ],
        features: [
          { title: 'Readable Tactical Battlefield', description: 'Inspect friendly and enemy units on the grid to review health pools, attack values, defense modifiers, and movement radius.' },
          { title: 'Distinct Unit Action Economy', description: 'Move, Attack, Wait, and Special action menus organize each turn around clear tactical trade-offs.' },
          { title: 'Campaign & Hotseat Modes', description: 'Progress through zone campaigns or play alongside a friend on the same machine with hotseat co-op and versus rules.' },
          { title: 'In-Game State Persistence', description: 'Full battle log, turn history, and save-state capabilities allow pausing and resuming skirmishes seamlessly.' },
        ],
        steps: [
          { title: 'Select your battle mode', description: 'Start the Solo Campaign to learn mechanics or boot into Local Versus to test squad compositions.' },
          { title: 'Position your squad', description: 'Navigate high-ground terrain and obstacle choke-points to protect vulnerable support units.' },
          { title: 'Complete zone objectives', description: 'Eliminate enemy grunts or secure capture points before turn timers expire.' },
        ],
        productionNotes: [
          { title: 'Lightweight Grid Engine', content: 'Built with modular ES6 classes managing pathfinding, tile occupancy, and turn queues with zero framework bloat.' },
        ],
        notes: 'The game is live at v0.0.3. New map zones, enemy archetypes, and tactical mechanics are added incrementally.',
        links: [{ label: 'Play Gridbound Realms Live', href: 'https://clawdassistant85-netizen.github.io/gridbound-realms/' }],
      },
    ],
  },
  {
    id: 'apps', eyebrow: 'Apps', title: 'Training and nutrition tools',
    description: 'Fitness utilities for remembering what happened in training and keeping everyday habits visible.',
    projects: [
      {
        slug: 'bjj-buddy', title: 'BJJ Buddy', status: 'Project',
        description: 'A Brazilian Jiu-Jitsu companion for logging rolls, organizing techniques, and following grappling progress.',
        tags: ['BJJ', 'React Native', 'Expo', 'Training log', 'Grappling'],
        heroImage: {
          src: '/images/projects/bjj-buddy/hero.png',
          alt: 'BJJ Buddy training dashboard showing White Belt progress and training streaks',
          caption: 'Live grappling companion dashboard tracking belt progress, streak consistency, and roll histories.',
          aspect: 'wide',
        },
        overview: [
          'BJJ Buddy is a specialized training companion built to solve a problem every grappler faces: technique amnesia on the drive home from the academy. By providing structured logging immediately after training, key adjustments, submissions, and sweeps stay fresh.',
          'Built with React Native and Expo, the app pairs a detailed roll log with a positional technique library. Grapplers can record sparring partners, gi vs. no-gi sessions, submissions landed or conceded, and attach video references for future drill sessions.',
        ],
        features: [
          { title: 'Comprehensive Roll Logging', description: 'Capture rounds rolled, sparring intensity, partner rank, and specific submissions caught or conceded.' },
          { title: 'Positional Technique Library', description: 'Filter moves by position (Closed Guard, Half Guard, Side Control, Mount, Back Control) and submission type.' },
          { title: 'Belt & Stripe Milestones', description: 'Track mat hours, continuous training streaks, and promotions from White Belt through advanced ranks.' },
          { title: 'Video Timestamp Integration', description: 'Attach instructional timestamps from YouTube or competition footage directly to your technique notes.' },
        ],
        steps: [
          { title: 'Open the app after training', description: 'Log today’s rounds, note what guards were tested, and record where sweeps were stopped.' },
          { title: 'Tag focus techniques', description: 'Pin positions you struggled with to review instructional breakdowns before your next open mat.' },
          { title: 'Review longitudinal progress', description: 'Look at submission defense patterns over 30, 60, and 90 days to guide deliberate practice.' },
        ],
        productionNotes: [
          { title: 'Cross-Platform React Native Architecture', content: 'Built with Expo, TypeScript, and Zustand for snappy state management, syncing seamlessly with local SQLite storage for offline mat access.' },
        ],
        notes: 'The companion app is deployed to Cloudflare Pages. A deep architectural review was featured on Toby’s main channel.',
        links: [
          { label: 'Open BJJ Buddy Live', href: 'https://bjj-buddy.pages.dev/' },
          { label: 'Watch the Development Walkthrough', href: '/video/MsdQU6uuHaE/' },
        ],
      },
      {
        slug: 'nutritrack', title: 'NutriTrack', status: 'Project',
        description: 'A nutrition-tracking project for recording meals and keeping calorie and macro intake connected to training goals.',
        tags: ['Nutrition', 'React Native', 'Macros', 'Strength Training', 'BJJ Sync'],
        heroImage: {
          src: '/images/projects/nutritrack/hero.png',
          alt: 'NutriTrack mobile UI showing daily calorie ring, macro distribution, and BJJ Buddy sync',
          caption: 'Daily nutrition dashboard designed for strength athletes, integrating macro goals and BJJ energy expenditure.',
          aspect: 'portrait',
        },
        overview: [
          'NutriTrack is an athlete-centric nutrition tracker engineered to keep daily caloric and macronutrient targets tightly aligned with heavy lifting and grappling demands. Instead of generic calorie counters designed purely for weight loss, NutriTrack emphasizes protein pacing and training recovery.',
          'The application features dynamic daily targets that adapt based on energy expenditure from Speediance workouts and BJJ mat time, providing immediate feedback on whether you have fueled adequately for recovery.',
        ],
        features: [
          { title: 'Visual Calorie & Macro Rings', description: 'Clear concentric rings and progress bars displaying real-time protein, carbohydrate, and healthy fat intake against personalized targets.' },
          { title: 'Strength & Grappling Sync', description: 'Automatically factors in heavy digital weight volume and high-intensity sparring sessions to adjust daily calorie burn.' },
          { title: 'Meal Pacing Breakdown', description: 'Organizes nutrition into breakfast, lunch, pre-workout fuel, dinner, and post-workout recovery shakes.' },
          { title: 'Water & Hydration Tracking', description: 'Monitors daily fluid intake against target hydration levels essential for intense training days.' },
        ],
        steps: [
          { title: 'Establish your training baseline', description: 'Configure your body composition targets, daily lifting schedule, and grappling days.' },
          { title: 'Log meals with instant macro math', description: 'Input daily foods or select saved athlete meal templates to track protein grams effortlessly.' },
          { title: 'Review weekly recovery adherence', description: 'Correlate nutrition adherence with strength gains and recovery metrics to optimize performance.' },
        ],
        productionNotes: [
          { title: 'Dynamic Energy Balancing Engine', content: 'Integrates telemetry algorithms that dynamically scale carbohydrate recommendations based on eccentric load from strength sessions.' },
        ],
        notes: 'NutriTrack was developed as part of the broader fitness telemetry suite. Its core data structures power our automated daily fitness rollups.',
        links: [{ label: 'Explore Nutrition Telemetry', href: '/gear/' }],
      },
    ],
  },
  {
    id: 'church', eyebrow: 'Church', title: 'Scripture and memory work',
    description: 'Tools for practicing a passage, checking recall, and returning to it over time.',
    projects: [{
      slug: 'one-peter-memory', title: '1 Peter Memory Trainer', status: 'Live',
      description: 'A KJV scripture memorization trainer with audio, disappearing text, recitation checks, and scheduled review.',
      tags: ['Scripture', 'Memorization', 'KJV', 'Web App', 'Edge-TTS'],
      heroImage: {
        src: '/images/projects/one-peter-memory/hero.png',
        alt: '1 Peter Memory Trainer interface with chapter navigation and neural audio narrators',
        caption: 'Interactive scripture memorization tool featuring 24 memory units, echo audio, and blind recitation checks.',
        aspect: 'wide',
      },
      overview: [
        'The 1 Peter Memory Trainer was created for systematic scripture memorization of the complete King James text of 1 Peter, originally developed to prepare for Alert Academy. It splits the epistle’s five chapters into twenty-four bite-sized memory units.',
        'The application employs a proven four-stage cognitive progression: Listen and Read, Vanishing Words, First-Letter Prompts, and Blind Recitation with automated diff checking. Two distinct AI neural voice models provide pitch-perfect auditory repetition.',
      ],
      features: [
        { title: '24 Manageable Memory Units', description: 'Carefully segmented passage units across all 5 chapters, allowing steady daily mastery.' },
        { title: 'Dual Neural Voice Narrators', description: 'Switch between "Aldric Command" (en-US-BrianNeural) and "IronVane Narrator" (en-GB-RyanNeural) for focused auditory repetition.' },
        { title: 'Progressive Vanishing Text', description: 'Gradually hide 25%, 50%, 75%, or 100% of the words to force active recall before attempting recitation.' },
        { title: 'Automated Recitation Diffing', description: 'Type or speak your recitation and instantly see color-coded diffs highlighting missed or transposed words.' },
        { title: 'Local Browser Persistence', description: 'All progress, review queues, and mastery scores are stored securely in local browser storage with zero external tracking.' },
      ],
      steps: [
        { title: 'Select a memory unit', description: 'Choose your chapter and passage, starting with unit 1:1-2 "Scattered and Kept".' },
        { title: 'Listen and echo practice', description: 'Play the neural narration while reading along, then engage the echo loop.' },
        { title: 'Hide words and recite', description: 'Switch on disappearing words to test recall, then submit a typed recitation for instant scoring.' },
        { title: 'Maintain your review queue', description: 'Revisit completed chapters through the scheduled review system to ensure long-term retention.' },
      ],
      productionNotes: [
        { title: 'Pre-Rendered Audio Pipeline', content: 'Every verse unit is pre-rendered into high-fidelity MP3 audio using Edge-TTS models, served directly from static storage without cloud API delays.' },
      ],
      notes: 'The trainer runs entirely in client-side JavaScript. All 24 units across 1 Peter are fully playable right now.',
      links: [{ label: 'Open the 1 Peter Trainer Live', href: '/one-peter-memory/' }],
    }],
  },
  {
    id: 'video', eyebrow: 'Video', title: 'Video channels and creative work',
    description: 'Family videos and story series, each with its own format, editing choices, and publishing rhythm.',
    projects: [
      {
        slug: 'lilly', title: 'Lilly Plays', status: 'Active',
        description: 'Gaming and family-adventure videos led by Lilly, with editing, captions, full episodes, and Shorts prepared behind the scenes.',
        tags: ['YouTube', 'Gaming', 'Family Adventures', 'Minecraft', 'Roblox', 'Shorts'],
        heroImage: {
          src: '/images/projects/lilly/hero.jpg',
          alt: 'Lilly Plays Minecraft Sister Chaos with Maggie YouTube Thumbnail',
          caption: 'Official thumbnail for "Minecraft Building Chaos with My Little Sister!" on the @LillyAxolotl channel.',
          aspect: 'wide',
        },
        featuredYoutubeId: 'E3wFSxmlb4I',
        gallery: [
          {
            src: '/images/projects/lilly/qa_contact.jpg',
            alt: 'Finished full episode quality assurance contact sheet',
            title: 'Full-Length QA Contact Sheet',
            description: 'Automated frame inspection verifying chapter overlays, audio sync, and facecam placement across the 15-minute episode.',
          },
          {
            src: '/images/projects/lilly/shorts_contact.jpg',
            alt: 'Vertical Shorts quality assurance contact sheet',
            title: 'Vertical Shorts QA Grid',
            description: 'Verification grid checking 9:16 full-bleed composition and timed caption readability across all scheduled Shorts.',
          },
        ],
        episodes: [
          {
            number: 'Full Episode',
            title: 'Minecraft Building Chaos with My Little Sister!',
            subtitle: 'Sister Gaming in Creative Mode',
            youtubeId: 'E3wFSxmlb4I',
            youtubeUrl: 'https://youtu.be/E3wFSxmlb4I',
            description: 'Lilly and her little sister Maggie explore village shops, hunt for furniture, get hilariously "broke" in Minecraft, and build a colorful new house with a vibrant purple roof. Features synchronized facecam, sound effects, and custom chapter titles.',
            highlights: [
              '12 Chapter markers including "Village House Hunt", "Maggie Broke the House", and "Doors, Windows and a Purple Roof"',
              'Synchronized picture-in-picture webcam and audio balance',
              'Verified YouTube Subscribe and Watch Next native outro cards',
            ],
          },
          {
            number: 'Full Episode',
            title: '99 Nights in Roblox with Lilly',
            subtitle: 'Survival Challenge',
            youtubeId: '23YyhwIoWbE',
            youtubeUrl: 'https://www.youtube.com/watch?v=23YyhwIoWbE',
            description: 'Lilly tackles the intense 99 Nights survival challenge in Roblox, managing resources, barricading against night monsters, and delivering live tactical commentary.',
            highlights: [
              'Live gameplay commentary with genuine, unscripted reactions',
              'Shelter fortification and resource strategy',
              'Parent-friendly editing preserving Lilly’s authentic personality',
            ],
          },
          {
            number: 'Family Special',
            title: 'Meeting Pet Axolotls: Dot and Strawberry',
            subtitle: 'Real-Life Pet Care Showcase',
            description: 'A family documentary episode introducing Lilly’s real pet axolotls Dot (who glows under blacklight!) and Strawberry, detailing their chilled tank setup, gravel vacuuming, and feeding habits.',
            highlights: [
              'Live blacklight fluorescence demonstration of Dot',
              'Tank chiller setup and gravel vacuum routine',
              'Pet personality breakdown and care guide',
            ],
          },
          {
            number: 'Short #1',
            title: 'One Minecraft Shopping Trip Left Me Broke',
            subtitle: 'Shorts Release',
            isShort: true,
            youtubeId: 'Vd9IPl49Oho',
            youtubeUrl: 'https://www.youtube.com/shorts/Vd9IPl49Oho',
            description: 'Maggie and Lilly go on an emergency furniture run in the village and realize emeralds disappear much faster than expected.',
          },
          {
            number: 'Short #2',
            title: 'My Sister Told Me Not to Look Inside Her Minecraft House',
            subtitle: 'Shorts Release',
            isShort: true,
            youtubeId: 'IgUvDyW_IAg',
            youtubeUrl: 'https://www.youtube.com/shorts/IgUvDyW_IAg',
            description: 'The hilarious reveal of Maggie’s secret interior architectural choices that left Lilly completely speechless.',
          },
          {
            number: 'Short #3',
            title: 'This Delivery Blocked My Minecraft Front Door',
            subtitle: 'Shorts Release',
            isShort: true,
            youtubeId: 'JLQd7OuqnHM',
            youtubeUrl: 'https://www.youtube.com/shorts/JLQd7OuqnHM',
            description: 'A delivery drop right in the entrance doorway turns a routine supply check into total doorway gridlock.',
          },
          {
            number: 'Short #4',
            title: 'She Broke the Front Door and Wants a New House',
            subtitle: 'Shorts Release',
            isShort: true,
            youtubeId: 'EQNxSwLybH0',
            youtubeUrl: 'https://www.youtube.com/shorts/EQNxSwLybH0',
            description: 'When accidental demolition strikes the main entrance, Maggie proposes moving into a brand-new house.',
          },
          {
            number: 'Short #5',
            title: 'I Told My Sister to Stay Away From the Candy Shop',
            subtitle: 'Shorts Release',
            isShort: true,
            youtubeId: 'Ya3Hr9tPk9w',
            youtubeUrl: 'https://www.youtube.com/shorts/Ya3Hr9tPk9w',
            description: 'Explicit warnings about the village candy store go unheeded with predictable, comedic consequences.',
          },
        ],
        overview: [
          'Lilly Plays is Lilly’s gaming and creative video channel (@LillyAxolotl), covering Minecraft, Roblox, AEW, and real-life family adventures. Lilly leads the show with her genuine reactions, comedic commentary, and creative imagination; my role is editing and packaging behind the scenes.',
          'The production pipeline transforms raw recording sessions into polished YouTube uploads. This includes selecting the best comedic beats, multi-track audio leveling, burned-in dynamic captions, custom section graphics, and generating borderless vertical Shorts for YouTube and TikTok.',
        ],
        features: [
          { title: 'Lilly Leads the Story', description: 'Pacing and editing always serve Lilly’s natural voice, keeping gaming sessions spontaneous rather than over-scripted.' },
          { title: 'Full Episodes & Vertical Shorts', description: 'Long-form videos provide relaxed storytelling, while targeted 9:16 Shorts highlight punchy, laugh-out-loud moments.' },
          { title: 'Automated Post-Production Tooling', description: 'Custom Python render scripts automate vertical crop composition, Whisper caption alignment, and YouTube API staging.' },
          { title: 'Verified Studio Publication Manifest', description: 'Every Short is programmatically tied to its full-length parent episode via YouTube’s native "Related video" feature to drive long-form viewership.' },
        ],
        steps: [
          { title: 'Capture high-framerate gameplay and facecam', description: 'Record 1080p60 gameplay alongside dedicated webcam and microphone feeds.' },
          { title: 'Edit the narrative and balance audio', description: 'Cut dead air, highlight funny interactions with Maggie, and balance game sound with speech.' },
          { title: 'Render vertical Shorts with the full-bleed builder', description: 'Extract peak moments and format them into borderless 9:16 vertical clips with dynamic captions.' },
          { title: 'Verify native YouTube elements before publish', description: 'Verify that native Related Video links, outro cards, and non-made-for-kids audience classifications are saved in YouTube Studio.' },
        ],
        productionNotes: [
          { title: 'Borderless Full-Bleed 9:16 Builder', content: 'Our automated clip pipeline recomposes 16:9 widescreen gameplay and webcam streams into borderless 9:16 vertical video. It centers Lilly’s facecam above the action without distracting letterboxing or blurry pillarboxes.' },
          { title: 'Whisper Timed Captions', content: 'Subtitles are aligned using word-level Whisper timestamping with custom child-friendly typography and automated screen-boundary collision detection.' },
          { title: 'YouTube Studio Publication Manifest', content: 'Every published Short is hashed and linked to its full-length parent episode via YouTube’s native "Related video" link, verified in Studio before release to drive traffic to the channel’s flagship videos.' },
        ],
        notes: 'Lilly Plays is active with ongoing releases. Published videos live on YouTube at @LillyAxolotl and TikTok at @lillyaxolotl.',
        links: [
          { label: "Watch Lilly's Channel on YouTube", href: 'https://www.youtube.com/channel/UC7ZfdS-b0zU-cE8Ie6NZVlQ' },
          { label: 'Follow on TikTok', href: 'https://www.tiktok.com/@lillyaxolotl' },
        ],
      },
      {
        slug: 'ironvane', title: 'IronVane', status: 'Active',
        description: 'The Crossfire / IronVane story channel, with an ongoing episode run centered on Ceryn and Talya.',
        tags: ['YouTube', 'Story', 'AI Video', 'FLUX.1', 'Dark Fantasy', 'Ken Burns'],
        heroImage: {
          src: '/images/projects/ironvane/hero.jpg',
          alt: 'Commander Aldric in formal armor from Crossfire Episode 13',
          caption: 'Commander Aldric inside the Aldenmoor council chambers, rendered via FLUX.1 with cinematic lighting.',
          aspect: 'wide',
        },
        featuredYoutubeId: 'Unlyz4mYDVA',
        characters: [
          { name: 'Ceryn', role: 'Protagonist / Wandering Blade', image: '/images/projects/ironvane/ceryn.png', description: 'A solitary swordswoman bound by an ancient oath, navigating the collapsing borders between provincial warlords.' },
          { name: 'Aldric', role: 'Castellan of Aldenmoor', image: '/images/projects/ironvane/aldric.png', voiceActor: 'en-US-BrianNeural', description: 'A battle-hardened commander who must make the bitter tactical decisions that preserve what remains of the realm.' },
          { name: 'Seraphine', role: 'Scholar & Mystic', image: '/images/projects/ironvane/seraphine.png', description: 'Keeper of suppressed archival ledgers, uncovering systemic treason within the inner court.' },
          { name: 'Lyra', role: 'Scout & Vanguard Archer', image: '/images/projects/ironvane/lyra.png', description: 'Sharp-eyed border scout who tracks troop movements through treacherous mountain passes.' },
          { name: 'Galven', role: 'Veteran Shield-Captain', image: '/images/projects/ironvane/galven.png', description: 'The steady frontline anchor whose loyalty to his soldiers often conflicts with high command.' },
          { name: 'Wren', role: 'Infiltrator', image: '/images/projects/ironvane/wren.png', description: 'A ghost in the shadows who specializes in silent reconnaissance and covert extractions.' },
        ],
        episodes: [
          {
            number: 'Episode 13',
            title: "CROSSFIRE — Episode 13: Ceryn's Road",
            subtitle: 'The Chapel That Remembered',
            youtubeId: 'Unlyz4mYDVA',
            youtubeUrl: 'https://www.youtube.com/watch?v=Unlyz4mYDVA',
            description: 'Ceryn reaches the forgotten chapel ruins where ancient vows and scarred memories collide. Old loyalties fracture under the revelation of what truly happened during the siege.',
            highlights: [
              'Climactic emotional confrontation in the ruined chapel',
              'Multi-voice ensemble dialogue between Aldric and Ceryn',
              'High-density visual storytelling with 100+ unique FLUX scenes',
            ],
          },
          {
            number: 'Episode 10b',
            title: 'Episode 10: The Choice That Costs Least',
            subtitle: 'The Bleeding Ledger',
            youtubeId: 'dBeK6U-YAfE',
            youtubeUrl: 'https://www.youtube.com/watch?v=dBeK6U-YAfE',
            description: 'Surrounded by superior hostile forces, Aldric is forced to weigh the tactical survival of his vanguard against civilian lives in a chilling moral dilemma.',
            highlights: [
              'Tactical war council sequence',
              'Deep character development for the Aldenmoor officer corps',
              'Narrated in the canonical British baritone',
            ],
          },
          {
            number: 'Episode 11',
            title: 'Episode 11: The Second Hand',
            subtitle: 'Court Politics & Shadow Treason',
            youtubeId: 's1Ij6ICq1lQ',
            youtubeUrl: 'https://www.youtube.com/watch?v=s1Ij6ICq1lQ',
            description: 'Behind the battle lines, Seraphine uncovers ledger tampering that proves the siege was engineered from within the imperial capital.',
            highlights: [
              'Espionage and investigative pacing',
              'Archival lore expansion of the IronVane universe',
            ],
          },
          {
            number: 'Episode 12',
            title: 'Episode 12: The Room With No Door',
            subtitle: 'The Sealed Vault',
            youtubeId: 'jTe2d1NU6FE',
            youtubeUrl: 'https://www.youtube.com/watch?v=jTe2d1NU6FE',
            description: 'Trapped inside a subterranean stone sanctum, the squad must decipher ancient pre-Aldenmoor inscriptions before the air runs out.',
            highlights: [
              'Claustrophobic tension and ancient mystery',
              'Dynamic Ken Burns focal pulls across detailed stone carvings',
            ],
          },
          {
            number: 'Episode 15',
            title: 'Episode 15: The Table Beneath the Throne',
            subtitle: 'The Shadow Council',
            youtubeId: 'kzDlgCfPnOk',
            youtubeUrl: 'https://www.youtube.com/watch?v=kzDlgCfPnOk',
            description: 'Confronting the conspirators in the subterranean crypt beneath the capital, where lineage and illegitimacy are laid bare before drawn blades.',
            highlights: [
              'High political drama and impending civil war',
              'Orchestral musical score integration',
            ],
          },
          {
            number: 'Episode 2',
            title: 'Episode 2: The Siege of Aldenmoor',
            subtitle: 'The Fall of the Wall',
            youtubeId: 'DT-co7MkzaY',
            youtubeUrl: 'https://www.youtube.com/watch?v=DT-co7MkzaY',
            description: 'The opening assault that shattered a decade of uneasy peace, thrusting Ceryn into the heart of the Crossfire conflict.',
            highlights: [
              'Epic siege imagery and smoke-filled ramparts',
              'The catalyst that sets the entire 16-episode saga in motion',
            ],
          },
        ],
        overview: [
          'IronVane is a serialized dark-fantasy story-video project published on the Crossfire / IronVane channel. Spanning an ongoing 16-episode run, the narrative follows Ceryn, Commander Aldric, and Seraphine through political betrayal, military sieges, and ancient mystical legacies.',
          'The project represents an advanced blend of long-form literary screenwriting and AI video generation. Its core engineering challenge is visual and auditory continuity: maintaining consistent character faces, costumes, lighting palettes, and vocal identities across hundreds of generated scenes per episode.',
        ],
        features: [
          { title: 'Continuing Episodic Narrative', description: 'Episodes are not standalone clips; they form a tightly plotted serialized saga with consequence, character death, and shifting alliances.' },
          { title: 'Strict Character Continuity', description: 'Curated character reference portraits and tuned FLUX prompts ensure that characters remain instantly recognizable across varied lighting and angles.' },
          { title: 'Cinematic Ken Burns Assembly', description: 'Rather than erratic AI video morphing, production pairs high-resolution still scenes with precise, cinematic pans, zooms, and focal shifts.' },
          { title: 'Multi-Voice Ensemble Cast', description: 'Narrated by the canonical en-GB-RyanNeural voice with distinct neural voice actors assigned to key roles like Commander Aldric.' },
        ],
        steps: [
          { title: 'Scriptwriting & Narration Synthesis', description: 'Draft multi-voice character scripts with speaker tags, synthesized via Edge-TTS with customized rate and pitch calibrations.' },
          { title: 'Distributed FLUX Image Generation', description: 'Generate high-resolution scenes across our M3 Ultra, M4 Max, and DGX Spark CUDA cluster (at 3 seconds per step).' },
          { title: 'Automated 1.2x Preflight Validation', description: 'Run automated checks confirming scene count exceeds narration segments by at least 1.2x to eliminate visual repetition.' },
          { title: 'Assembly & Master Render', description: 'Assemble scenes into Final 1080p25 Ken Burns sequences with synchronized subtitle burns, sound design, and YouTube metadata.' },
        ],
        productionNotes: [
          { title: 'Dual-Mac & DGX Spark Render Fleet', content: 'Image generation is distributed across an M3 Ultra (96GB), an M4 Max (64GB), and a DGX Spark CUDA cluster (running at ~3s per step), generating thousands of candidate frames for every script.' },
          { title: 'Ken Burns Motion & Temporal Matching', content: 'Stills are brought to life using custom-tuned Ken Burns camera pans, zooms, and rack-focus simulations matched to speech cadences.' },
          { title: 'The Canonical Narrator & Ensemble Voice Cast', content: 'Narrated by the iconic en-GB-RyanNeural (-12% rate, -8Hz pitch) alongside dedicated character voices like en-US-BrianNeural for Commander Aldric.' },
          { title: 'The 1.2× Scene Buffer Preflight Gate', content: 'Our automated preflight check verifies that scene count exceeds narration segments by at least 1.2× to ensure no visual repetition during multi-minute monologues.' },
        ],
        notes: 'The IronVane story is actively released on YouTube at @IronVaneStory. The channel video archive is the canonical source for all 16 episodes.',
        links: [
          { label: 'Watch IronVane on YouTube', href: 'https://www.youtube.com/@IronVaneStory/videos' },
          { label: 'Channel Home', href: 'https://www.youtube.com/@IronVaneStory' },
        ],
      },
      {
        slug: 'liminal', title: 'Liminal', status: 'Archived',
        description: 'A supernatural comedy set at a seaside inn. Production is paused, with released episodes available to watch.',
        tags: ['YouTube', 'Comedy', 'Archived', 'Supernatural', 'Anime', 'FLUX LoRA'],
        heroImage: {
          src: '/images/projects/liminal/hero.jpg',
          alt: 'The Wayward Inn seaside exterior in morning light',
          caption: 'The Wayward Inn perched along the misty coast, setting the stage for supernatural seaside comedy.',
          aspect: 'wide',
        },
        featuredYoutubeId: 'Vo_LQS1ubWc',
        gallery: [
          {
            src: '/images/projects/liminal/inn_night.jpg',
            alt: 'The Wayward Inn illuminated at night under supernatural lantern glow',
            title: 'The Wayward Inn (Night)',
            description: 'The seaside inn illuminated under mystical lanterns, where spectral guests begin their evening festivities.',
          },
        ],
        characters: [
          { name: 'Yuki', role: 'Kitsune Spirit & Self-Appointed Landlord', image: '/images/projects/liminal/yuki.png', description: 'A mischievous nine-tailed fox spirit with an insatiable appetite for sweet red bean buns and creating supernatural misunderstandings.' },
          { name: 'Kai', role: 'Mortal Innkeeper', image: '/images/projects/liminal/kai.png', description: 'The deadpan human manager trying to balance lodging ledgers while spectral apparitions take over the bathhouses.' },
          { name: 'Tanaka', role: 'Exasperated Regular Guest', image: '/images/projects/liminal/tanaka.png', description: 'A stressed corporate salaryman who booked a quiet coastal holiday and keeps waking up to find yokai floating over his futon.' },
        ],
        episodes: [
          {
            number: 'Episode 5',
            title: 'Episode 5: The Beach Inspection',
            subtitle: 'Maritime Health & Safety vs. Eldritch Spirits',
            youtubeId: 'Vo_LQS1ubWc',
            youtubeUrl: 'https://www.youtube.com/watch?v=Vo_LQS1ubWc',
            description: 'A municipal health inspector threatens to revoke the inn’s operating permit unless Kai can explain why the hot springs are glowing purple and speaking in riddles, while Yuki attempts to disguise demonic entities as pool floats.',
            highlights: [
              'High-stakes comedic dialogue and deadpan delivery',
              'Anime-inspired visual gags and expressive character LoRA shots',
              'Full Ken Burns pan sequences across the sunny coastal beachfront',
            ],
          },
          {
            number: 'Episode 1',
            title: 'Episode 1: The Fox Who Fell From the Sky',
            subtitle: 'The Inheritance',
            youtubeId: '597CdkCMXFo',
            youtubeUrl: 'https://www.youtube.com/watch?v=597CdkCMXFo',
            description: 'Kai arrives at his newly inherited seaside inn expecting a quiet retirement, only for a kitsune spirit to crash through the cedar roof and demand back rent.',
            highlights: [
              'Series premiere establishing the supernatural seaside premise',
              'First appearance of Yuki and Kai’s dry comedic banter',
            ],
          },
          {
            number: 'Episode 2',
            title: 'Episode 2: The Umbrella That Rose Through The Plumbing',
            subtitle: 'Tsukumogami Trouble',
            youtubeId: 'iUtARa3mxKI',
            youtubeUrl: 'https://www.youtube.com/watch?v=iUtARa3mxKI',
            description: 'A century-old sentient umbrella clogs the main pipes, forcing Kai into delicate diplomatic negotiations in the wet crawlspace.',
            highlights: [
              'Crawlspace ghost diplomacy',
              'Classic Japanese folklore reimagined with dry workplace humor',
            ],
          },
          {
            number: 'Episode 3',
            title: 'Episode 3: The Cat Who Hated Being A Cat',
            subtitle: 'Bakeneko Demands',
            youtubeId: 'QAWF4u5MkhI',
            youtubeUrl: 'https://www.youtube.com/watch?v=QAWF4u5MkhI',
            description: 'A shapeshifting cat spirit occupies the best parlor sofa and refuses to leave until served heated cushions and artisanal sashimi.',
            highlights: [
              'Parlor room standoff',
              'Tanaka’s first nervous breakdown',
            ],
          },
          {
            number: 'Episode 4',
            title: 'Episode 4: The Axolotl Who Came Up Through The Koi Pond',
            subtitle: 'Pond Intruder',
            youtubeId: 'Ib2ZjOwVecY',
            youtubeUrl: 'https://www.youtube.com/watch?v=Ib2ZjOwVecY',
            description: 'A giant mystical axolotl moves into the tranquil garden koi pond, baffling the local tourism board and captivating the staff.',
            highlights: [
              'Garden pond transformation',
              'Whimsical aquatic creature design',
            ],
          },
        ],
        overview: [
          'Liminal is a supernatural anime-inspired comedy series set at The Wayward Inn, a creaky coastal ryokan situated right on the threshold between the human world and the spirit realm.',
          'The series explores workplace comedy under absurd supernatural circumstances. Mortal manager Kai tries to keep the lights on and the guests alive, while nine-tailed kitsune Yuki treats the historic inn as her personal amusement park. While production is currently paused, the released 8-episode run remains an engaging showcase of AI character consistency and comedic timing.',
        ],
        features: [
          { title: 'A Distinctive Contained Setting', description: 'The coastal ryokan provides a cozy recurring backdrop for folklore chaos, bathhouse disasters, and beachfront comedy.' },
          { title: 'Custom Trained LoRA Character Models', description: 'Character designs for Yuki, Kai, and Tanaka were trained into dedicated FLUX LoRAs to ensure facial and silhouette consistency across all 8 episodes.' },
          { title: 'Warm Storybook British Narration', description: 'Voiced by en-GB-SoniaNeural (+2% rate, -2Hz pitch), creating a delightful stylistic contrast between proper British storytelling and anime slapstick.' },
          { title: 'Preserved Creative Archive', description: 'All released episodes remain preserved and viewable on YouTube as part of our creative video portfolio.' },
        ],
        steps: [
          { title: 'Start with Episode 5: The Beach Inspection', description: 'Watch the flagship episode to experience the series’ full visual and comedic stride.' },
          { title: 'Follow the earlier episodes', description: 'Revisit Episode 1 to see how Kai first inherited the inn and discovered Yuki crashing through the roof.' },
          { title: 'Explore the companion drama IronVane', description: 'Compare Liminal’s comedy tone with the epic dark-fantasy drama of IronVane.' },
        ],
        productionNotes: [
          { title: 'Custom Character LoRA Models', content: 'Trained dedicated FLUX LoRAs on Yuki, Kai, and Tanaka to preserve facial expressions, hair silhouettes, and costume details across hundreds of comedy scenes.' },
          { title: 'Distinct British Female Narrator', content: 'Narrated by en-GB-SoniaNeural (+2% rate, -2Hz pitch), giving the series a warm, witty storybook tone that heightens the comedic contrast.' },
          { title: 'Archived Creative Legacy', content: 'While active production is paused, the 8-episode collection remains an integral part of our creative AI storytelling exploration.' },
        ],
        notes: 'Production on Liminal is currently archived. All released episodes remain available to watch on YouTube.',
        links: [{ label: 'Watch Liminal Episode 5 on YouTube', href: 'https://www.youtube.com/watch?v=Vo_LQS1ubWc' }],
      },
    ],
  },
];

export const projects = projectGroups.flatMap((group) => group.projects.map((project) => ({ ...project, group: group.eyebrow })));
