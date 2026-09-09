export type ProjectLink = { label: string; href: string };
export type ProjectFeature = { title: string; description: string };
export type WorkflowFile = {
  file: string;
  title: string;
  description: string;
  command: string;
  implementation: string[];
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
      tags: ['Python', 'Android + iOS', 'Device automation'],
      overview: [
        'This project brings the repetitive parts of my Pokémon GO workflow into one Python toolkit. A small set of named commands coordinates gift sending, adding friends, GO Battle League, trading, transferring Pokémon, and feeding berries across connected devices.',
        'The public package separates the reusable automation from the private setup. You supply your own device inventory, connection details, screen calibration, and friend lists. The repository explains how the pieces fit together so another developer or AI coding agent can reproduce the setup on different hardware.',
      ],
      features: [
        { title: 'One entry point per job', description: 'Descriptive Python filenames make each workflow easy to find. They route into the existing Android and iOS implementations rather than hiding the work in one giant script.' },
        { title: 'A shared fleet layer', description: 'Device selection, readiness checks, and optional remote-machine routing are configured separately from the game workflows. Start with one phone, then add devices and machines to your inventory.' },
        { title: 'Private configuration by design', description: 'Personal device identifiers, network addresses, machine names, account data, friend lists, and runtime artifacts stay outside the tracked public package. Example files show the structure using generic values.' },
        { title: 'An inspectable starting point', description: 'Plan commands show the selected workflow and routing before a live run. Source maps and setup documentation give coding agents the context they need to extend and debug the project.' },
      ],
      steps: [
        { title: 'Install the package and device tools', description: 'Follow the repository README for a Python environment and dependencies. Set up ADB for Android or the documented iOS automation connection before attempting a workflow.' },
        { title: 'Create your private inventory', description: 'Copy the generic configuration examples into your own configuration directory and replace their placeholders. Set POGO_CONFIG_DIR when using a custom location.' },
        { title: 'Check readiness and review a plan', description: 'Run python fleet.py status, then the relevant command with --plan. Check device selection, remote routing, and screen calibration on your own hardware.' },
        { title: 'Run and inspect the real result', description: 'Follow the workflow guide for execution options. Begin with a small live run and inspect the phone state; a successful software test alone does not establish that a device completed the task.' },
      ],
      notes: 'These workflows interact with the Pokémon GO interface on physical devices. Screen layouts, connectivity, and game updates can affect behavior. Review the selected Pokémon and pair before live transfers or trades, which change your collection. Plan output describes routing; it is not a completed game action.',
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
        tags: ['Fighting', 'RPG', 'Browser game'],
        overview: ['MMA RPG is a playable experiment that brings mixed martial arts into a browser game. The interface combines an arena with fighter actions, a weight-room entry point, and a fight-night score and hype display.', 'The project explores how to make a sport with striking and grappling readable on a small game screen. You can open the game directly in a browser and use the controls shown in the arena.'],
        features: [
          { title: 'Arena controls', description: 'On-screen directional controls and action buttons put movement, jabs, and takedowns within reach.' },
          { title: 'Stand-up and ground game', description: 'The interface exposes both striking and grappling states, reflecting the different phases of an MMA fight.' },
          { title: 'Training and fight feedback', description: 'A weight-room entry point, timer, score, and crowd-hype display give the game a broader frame than a single attack button.' },
        ],
        steps: [
          { title: 'Open the game', description: 'Launch the browser version using the link on this page.' },
          { title: 'Learn the arena controls', description: 'Use the visible movement and action buttons to explore striking and takedowns.' },
          { title: 'Play another round', description: 'Watch the fight feedback and use the restart control to try a different approach.' },
        ],
        notes: 'This is an evolving game experiment. The playable build is the best reference for its current rules, controls, and balance.',
        links: [{ label: 'Play MMA RPG', href: 'https://clawdassistant85-netizen.github.io/mma-rpg/' }],
      },
      {
        slug: 'gridbound-realms', title: 'Gridbound Realms', status: 'Live',
        description: 'A tactical browser game with a grid-based battlefield, unit actions, and solo or local multiplayer modes.',
        tags: ['Strategy', 'Tactics', 'Grid'],
        overview: ['Gridbound Realms is a tactical strategy game about moving a squad around a battlefield and choosing when to attack, wait, or use a special action. Its browser interface keeps the map, selected-unit information, and battle log together.', 'The live game offers a solo campaign alongside local co-op and local versus mode choices. The project focuses on making turn-by-turn decisions visible: where a unit can go, what resources it has, and what happened after each action.'],
        features: [
          { title: 'A readable tactical map', description: 'Select a unit on the grid and inspect its health, attack, defense, movement, and other current attributes.' },
          { title: 'Distinct unit actions', description: 'Move, Attack, Wait, and Special controls organize each turn around a clear choice.' },
          { title: 'Campaign and local modes', description: 'The interface includes Solo, Local Co-op, and Local Versus choices, plus a battle log, restart control, and save action.' },
        ],
        steps: [
          { title: 'Choose a mode', description: 'Open the game and select the available solo or local multiplayer option that fits your session.' },
          { title: 'Select a unit', description: 'Read its stats and the battlefield before choosing a move or attack.' },
          { title: 'Follow the objective', description: 'Use the turn indicator and battle log to track progress, then save or restart from the game controls.' },
        ],
        notes: 'The live interface currently identifies the game as v0.0.3. Mechanics and balance may change as the prototype develops.',
        links: [{ label: 'Play Gridbound Realms', href: 'https://clawdassistant85-netizen.github.io/gridbound-realms/' }],
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
        tags: ['BJJ', 'Training log', 'Techniques'],
        overview: ['BJJ Buddy brings training notes and technique references into one project. It grew out of a practical need: remember what happened on the mat, keep useful techniques close at hand, and make the next session more deliberate.', 'The project combines a roll log with a technique library, favorites, and training history. Development has been shared in my videos, including work on the app and the wider AI-assisted training workflow.'],
        features: [
          { title: 'A record of your rolls', description: 'Capture training sessions and sparring notes so useful details survive beyond the drive home.' },
          { title: 'Techniques with context', description: 'Organize techniques and video references around the positions and skills you want to practice.' },
          { title: 'Favorites and training history', description: 'Keep useful references accessible and revisit past training when deciding what to work on next.' },
        ],
        steps: [
          { title: 'Browse the project', description: 'Open BJJ Buddy to see the current app experience, or watch the development walkthrough for background.' },
          { title: 'Connect notes with technique practice', description: 'Use your recent rolls to identify a position or technique to revisit.' },
          { title: 'Return after training', description: 'Add what worked and what needs practice, then use that record to guide the next session.' },
        ],
        notes: 'The app lives on a separate site. Its available features and access requirements are determined by that deployed version.',
        links: [
          { label: 'Open BJJ Buddy', href: 'https://bjj-buddy.pages.dev/' },
          { label: 'Watch the development walkthrough', href: '/video/MsdQU6uuHaE/' },
        ],
      },
      {
        slug: 'nutritrack', title: 'NutriTrack', status: 'Project',
        description: 'A nutrition-tracking project for recording meals and keeping calorie and macro intake connected to training goals.',
        tags: ['Nutrition', 'Macros', 'Meal log'],
        overview: ['NutriTrack is a nutrition-tracking project built around the everyday act of logging food. Its focus is making meals, calories, and macronutrients easier to review alongside a training routine.', 'The project complements the training side of this site: exercise explains only part of the picture, and a meal record provides context for the habits around it. The aim is a practical tool that supports consistent tracking.'],
        features: [
          { title: 'Meal logging', description: 'Record food intake as a daily habit, with meals providing the foundation for a useful nutrition history.' },
          { title: 'Macro awareness', description: 'Keep protein, carbohydrate, and fat intake visible when reviewing how a day of eating fits your goals.' },
          { title: 'Training context', description: 'Use the nutrition record alongside your own training goals rather than treating meals as isolated numbers.' },
        ],
        steps: [
          { title: 'Start with a normal day', description: 'A representative day of meals gives you a more useful baseline than an idealized plan.' },
          { title: 'Review the pattern', description: 'Look at your logged intake and macros in the context of your training routine.' },
          { title: 'Keep the habit useful', description: 'Use consistent records to decide which food habits you want to maintain or adjust.' },
        ],
        notes: 'NutriTrack has a separate app address. This page documents the project; the app address is currently unavailable.',
        links: [{ label: 'Visit the NutriTrack app address', href: 'https://nutritrack.tobyonfitnesstech.com' }],
      },
    ],
  },
  {
    id: 'church', eyebrow: 'Church', title: 'Scripture and memory work',
    description: 'Tools for practicing a passage, checking recall, and returning to it over time.',
    projects: [{
      slug: 'one-peter-memory', title: '1 Peter Memory Trainer', status: 'In progress',
      description: 'A KJV scripture memorization trainer with audio, disappearing text, recitation checks, and scheduled review.',
      tags: ['Scripture', 'Memorization', 'KJV'],
      overview: ['The 1 Peter Memory Trainer is built for learning the KJV text of 1 Peter in manageable units. It was created around Alert Academy preparation, with a progression from reading and listening to recalling the words without prompts.', 'The trainer organizes five chapters into memory units and keeps practice state in the current browser. Audio and echo practice support repetition; hiding text and checking a typed recitation provide different ways to test recall.'],
      features: [
        { title: 'Units and chapters', description: 'Work through a smaller passage, then return to the full chapter as your recall improves.' },
        { title: 'Several ways to practice', description: 'Read, listen, repeat with echo audio, hide words, and compare a typed recitation with the passage.' },
        { title: 'Progress and review', description: 'The trainer stores practice progress in browser storage and offers chapter review checkpoints so earlier work stays in rotation.' },
      ],
      steps: [
        { title: 'Choose a memory unit', description: 'Start with the chapter and passage you want to practice.' },
        { title: 'Move from reading to recall', description: 'Use the audio and visible text, then hide words and attempt a recitation.' },
        { title: 'Return for review', description: 'Check the review area and revisit chapters as they become due. Keep using the same browser to retain local progress.' },
      ],
      notes: 'Progress is stored locally in the browser. Clearing site storage or switching to another browser can separate you from your saved practice record.',
      links: [{ label: 'Open the 1 Peter trainer', href: '/one-peter-memory/' }],
    }],
  },
  {
    id: 'video', eyebrow: 'Video', title: 'Video channels and creative work',
    description: 'Family videos and story series, each with its own format, editing choices, and publishing rhythm.',
    projects: [
      {
        slug: 'lilly', title: 'Lilly Plays', status: 'Active',
        description: 'Gaming and family-adventure videos led by Lilly, with editing, captions, full episodes, and Shorts prepared behind the scenes.',
        tags: ['YouTube', 'Gaming', 'Family adventures'],
        overview: ["Lilly Plays is Lilly's gaming and creative video project, covering Minecraft, Roblox, AEW, and family adventures. Lilly leads the videos; my role is helping shape the footage into episodes and clips that preserve her voice.", 'The production work includes selecting moments, editing the sequence, keeping audio aligned, creating captions and section graphics, and packaging full videos alongside Shorts. A consistent style makes a gaming session or a day out feel like part of the same channel.'],
        features: [
          { title: 'Lilly leads the story', description: 'The editing supports her reactions, explanations, and adventures. The channel identity stays consistent across gaming and family footage.' },
          { title: 'Full episodes and Shorts', description: 'Longer videos preserve the experience, while shorter edits focus on individual moments with framing and captions suited to vertical viewing.' },
          { title: 'A finished publishing package', description: 'Titles, captions, graphics, and video checks support the handoff from edited footage to a watchable channel release.' },
          { title: 'Visible quality checks', description: 'Audio sync, picture-in-picture framing, and wrapped section titles are checked in the rendered video. Clickable YouTube elements are verified in the saved platform state.' },
        ],
        steps: [
          { title: 'Choose an episode or a quick moment', description: "Open Lilly's channel and choose a full video or a Short depending on how much of the adventure you want to follow." },
          { title: 'Follow the channel format', description: 'Gaming sessions and family outings share a consistent presentation while allowing each video to have its own pace.' },
          { title: 'Explore related videos', description: 'Use the channel and available video links to move between shorter highlights and the longer stories around them.' },
        ],
        notes: 'This page describes the channel and production workflow. The published videos live on YouTube; private source footage and account details are not part of this project page.',
        links: [{ label: "Watch Lilly's channel", href: 'https://www.youtube.com/channel/UC7ZfdS-b0zU-cE8Ie6NZVlQ' }],
      },
      {
        slug: 'ironvane', title: 'IronVane', status: 'Active',
        description: 'The Crossfire / IronVane story channel, with an ongoing episode run centered on Ceryn and Talya.',
        tags: ['YouTube', 'Story', 'AI video'],
        overview: ['IronVane is a serialized story-video project associated with the Crossfire / IronVane channel. The ongoing episode run centers on Ceryn and Talya, giving the channel a continuing cast and narrative rather than a collection of unrelated clips.', 'The project combines story development with AI-assisted video production. Its central creative challenge is continuity: making characters, tone, and episode progression feel connected as the series grows.'],
        features: [
          { title: 'A continuing story', description: 'Episodes belong to a larger narrative, with recurring characters and developments that carry forward.' },
          { title: 'Character continuity', description: 'Ceryn and Talya anchor the current story work and give viewers a consistent point of entry into the series.' },
          { title: 'AI-assisted production', description: 'Generated material is shaped through story and editing decisions into a channel-specific video format.' },
        ],
        steps: [
          { title: 'Visit the series channel', description: 'The channel video list is the current source for released episodes.' },
          { title: 'Follow the episode sequence', description: 'Use the published titles and ordering to follow the ongoing story.' },
          { title: 'Return for the next release', description: 'The project is active; new work appears through the channel as episodes are released.' },
        ],
        notes: 'The channel is the source of truth for available episodes. This overview does not imply a release date for unreleased work.',
        links: [{ label: 'Watch IronVane', href: 'https://www.youtube.com/@IronVaneStory/videos' }],
      },
      {
        slug: 'liminal', title: 'Liminal', status: 'Archived',
        description: 'A supernatural comedy set at a seaside inn. Production is paused, with released episodes available to watch.',
        tags: ['YouTube', 'Comedy', 'Archived'],
        overview: ['Liminal is a supernatural seaside-inn comedy series. Its setting gives the story a contained place for unusual situations and character-driven humor, with the supernatural premise shaping the tone of the episodes.', 'The project is currently archived: production is paused, while released work remains part of the creative portfolio. It sits alongside IronVane as a different use of the story-video format, with its own setting and comic identity.'],
        features: [
          { title: 'A distinctive setting', description: 'The seaside inn provides the recurring backdrop for the supernatural comedy premise.' },
          { title: 'An episode-based format', description: 'The story is presented as released videos, making the finished episodes the best way to experience the project.' },
          { title: 'A preserved creative project', description: 'The archive keeps the released work accessible without presenting paused production as an active release schedule.' },
        ],
        steps: [
          { title: 'Start with a released video', description: 'Use the watch link to open an available Liminal episode.' },
          { title: 'Explore the premise', description: 'Watch how the seaside setting and supernatural elements shape the comedy.' },
          { title: 'Browse another story project', description: 'Return to All Projects to explore IronVane or the other video work.' },
        ],
        notes: 'Production is paused. The archive does not announce or promise new episodes.',
        links: [{ label: 'Watch Liminal', href: 'https://www.youtube.com/watch?v=Vo_LQS1ubWc' }],
      },
    ],
  },
];

export const projects = projectGroups.flatMap((group) => group.projects.map((project) => ({ ...project, group: group.eyebrow })));
