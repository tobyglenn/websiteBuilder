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
    id: 'roblox', eyebrow: 'Roblox', title: 'Roblox games & worlds',
    description: 'Multiplayer 3D games engineered in native Luau with Rojo and Open Cloud—spanning open-world family adventures, dark fantasy action-RPGs, and creature raising.',
    projects: [
      {
        slug: 'wild-rebellion',
        title: 'Wild Rebellion',
        status: 'Live',
        description: 'Step into Lilly Axolotl’s world: a hidden village, friendly dragons, enterable homes, crystal towers, and Bobcat Island in the sky—built for co-op play on Roblox.',
        tags: ['Roblox', 'Luau', 'Adventure', 'Open World', 'Co-op RPG', 'Family Gaming'],
        heroImage: {
          src: '/images/projects/wild-rebellion/hero.webp',
          alt: 'Wild Rebellion cast lineup and open-world character showcase',
          caption: 'Meet the 13 playable characters in Wild Rebellion across the village and Bobcat Island.',
          aspect: 'wide',
        },
        overview: [
          'Wild Rebellion is a multiplayer 3D Roblox adventure game based on the original world, characters, and storylines created by Lilly Axolotl. Built in native Luau using the Rojo development layout and deployed through Roblox Open Cloud, the experience translates Lilly’s creative universe into an interactive, cross-platform world for PC, mobile, tablet, and Xbox console.',
          'Players choose their path: dive into episodic narrative playthroughs (saving the village as Axi on the Heroes’ side, or defending the Chaos Lair as Madhattr on the Villains’ side) or explore the Wild World in Adventure mode—discovering 13 fully furnished character homes, riding dragons through floating skies, collecting 40 Wild Gems, and tackling cooperative quests.',
        ],
        features: [
          { title: 'Dual Narrative Playthroughs', description: 'Experience the story from both sides: free captured dragons and break Ily’s shadow spell as Axi, or command the Chaos Lair and cast the shadow spell as Madhattr.' },
          { title: '13 Enterable Homes with 26 Quests', description: 'Every friend’s front door opens! Explore multi-floor interiors from Axi’s cozy cottage to Bad Girl’s palace, complete two unique quests in each, and earn the Home Hero badge.' },
          { title: 'Dragon Flight & Aerial Fireballs', description: 'Soar between the village homeland and Bobcat Island in the sky, breathing targeted elemental fireballs that home in on wild targets with explosive splash damage.' },
          { title: 'Dynamic Shadow vs. Light Combat', description: 'Villains summon Shadow Night bosses and cast shadow entrapment threads; heroes unleash Sunburst storms, shatter crystal charges, and free captured allies to fight at their side.' },
          { title: 'Vibrant World Activities', description: 'Fish at the village dock with a 6-species catch log, scale the Cloud Climb obstacle course, hunt 12 hidden treasure chests, and compete in races against Hopie and Fast Flash.' },
          { title: 'Cross-Platform Family Play', description: 'Carefully tuned for 12-player servers with responsive touch controls, keyboard/mouse (WASD/F/Q/R), and full Xbox controller bindings with persistent cloud saves.' },
        ],
        steps: [
          { title: 'Choose your first starter', description: 'Pick between Axi (Heroes) or Madhattr (Villains) on your first launch to unlock your starting archetype and enter the Wild World.' },
          { title: 'Master abilities and movement', description: 'Use WASD or gamepad thumbsticks to navigate, click/RT to strike, Q/Y for Galaxy Eyes, R/B to dash, and H/LB to trigger team abilities.' },
          { title: 'Visit friend homes and take on quests', description: 'Step through door markers across the village and Bobcat Island to help characters solve mysteries and unlock cozy outfits.' },
          { title: 'Mount a dragon and soar', description: 'Interact with the dragon roosts to fly into the sky, rain fireballs onto hostile shadows, and reach high-altitude balloon festivals.' },
        ],
        characters: [
          { name: 'Axi', role: 'Hero Protagonist', description: 'The brave mint-hoodie explorer of the hidden village who leads the rescue mission to break Ily’s shadow spell and liberate the dragons.' },
          { name: 'Madhattr', role: 'Villain Commander', description: 'The enigmatic leader of the Chaos Lair who channels crystal energy to bind the realm under the shadow spell.' },
          { name: 'Bad Girl', role: 'Villain Ally & Palace Ruler', description: 'A fierce powerhouse who strikes the crystal tower to charge team abilities and defend the lair.' },
          { name: 'Ily', role: 'Shadow Weaver', description: 'A mystical sorceress capable of casting shadow entrapment spells that pull wandering heroes into captivity.' },
          { name: 'King Baka', role: 'Village Elder', description: 'The benevolent ruler who introduces new adventurers to the homeland and guides heroes through story chapters.' },
        ],
        gallery: [
          {
            src: '/images/projects/wild-rebellion/villains.webp',
            alt: 'Wild Rebellion villains lineup in the Chaos Lair',
            title: 'The Chaos Lair & Villains Campaign',
            description: 'Madhattr, Bad Girl, and Ily assemble in the subterranean crystal lair to unleash shadow spells across the realm.',
          },
          {
            src: '/images/projects/wild-rebellion/bobcat_island.webp',
            alt: 'Bobcat Island floating in the sky with portal gateway',
            title: 'Bobcat Island in the Clouds',
            description: 'A floating sky sanctuary connected by ancient warp portals, featuring aerial dragon perches and cloud platforming.',
          },
          {
            src: '/images/projects/wild-rebellion/open_world.webp',
            alt: 'Open-world adventure mode showcasing 40 Wild Gems and village exploration',
            title: 'Open-World Adventure & Gem Hunting',
            description: 'Explore the vast wilderness to uncover 40 hidden Wild Gems, secret treasure chests, and friendly NPC challenges.',
          },
        ],
        productionNotes: [
          { title: 'Rojo & Luau Modular Architecture', content: 'Engineered as a clean Rojo project layout with strictly separated Client, Server, and ReplicatedStorage Luau modules, built via automated build scripts (build_place.py).' },
          { title: '43-Track Soundtrack & Voice Pipeline', content: 'Includes 43 original musical themes and sound effects, with preloading used to reduce startup delays.' },
          { title: 'Open Cloud Automated Deployment', content: 'Continuous deployment pipeline driven by custom Python tools (tools/publish_place.py) interacting directly with the Roblox Open Cloud API for verified, byte-matched releases.' },
          { title: 'Family Adventure Design', content: 'Designed around family co-op, cartoon defeat effects, and controller support.' },
        ],
        notes: 'Wild Rebellion is actively published and playable on Roblox (Universe 10767746288, Place 137414447181099). Designed for co-op servers of up to 12 players.',
        links: [
          { label: 'Play Wild Rebellion on Roblox', href: 'https://www.roblox.com/games/137414447181099/Wild-Rebellion' },
          { label: 'Watch Lilly Plays on YouTube', href: 'https://www.youtube.com/channel/UC7ZfdS-b0zU-cE8Ie6NZVlQ' },
        ],
      },
      {
        slug: 'ironvane-chronicle',
        title: 'Ironvane: The Iron Chronicle',
        status: 'Live',
        description: 'An immersive dark fantasy action-RPG on Roblox featuring a 15-chapter campaign, 15-wave survival arena, fortress conquest, and timed parry combat.',
        tags: ['Roblox', 'Luau', 'Dark Fantasy', 'Action RPG', 'Combat', 'Campaign'],
        heroImage: {
          src: '/images/projects/ironvane-chronicle/hero.webp',
          alt: 'Lord Aldric defending the sea-cliff fortress of Aldenmoor in Ironvane',
          caption: 'Third-person dark fantasy combat inside the sea-cliff stronghold of Aldenmoor.',
          aspect: 'wide',
        },
        overview: [
          'Ironvane: The Iron Chronicle brings the dark fantasy universe of the Crossfire / IronVane series into a high-stakes, visceral 3D action-RPG on Roblox. Built natively in Luau with Rojo, the game adapts the cinematic lore into responsive third-person combat with timed parries, multi-hit combos, and epic siege warfare.',
          'Players take up arms as Lord Aldric Vane or Lady Seraphine Vane across three distinct game modes: a 15-chapter canonical story campaign, the 15-wave gladiatorial Iron Gauntlet, and full-scale Castle Siege fortress conquest with real-time squad deployment and gate destruction.',
        ],
        features: [
          { title: '15-Chapter Canonical Campaign', description: 'Fight through Aldenmoor fortress, snowy mountain passes, subterranean vaults, and the First Table beneath the Imperial Throne across 15 scripted episodes.' },
          { title: 'Precision Combat & Timed Parries', description: 'Fluid 3-hit combo chains with guaranteed critical finishers, evasive directional dashes, and a 0.28-second parry window that staggers enemies and deflects 100% of damage.' },
          { title: 'Two Distinct Hero Playstyles', description: 'Wield Lord Aldric’s heavy broadsword and 85% damage mitigation tower shield, or Lady Seraphine’s agile dual-dagger flurry with accelerated health regeneration.' },
          { title: 'The Iron Gauntlet (Survival Arena)', description: 'Survive 15 escalating waves of hostile factions, including Usurper Malachar, the Ancient Vault Golem, and the Imperial Champion, supported by tactical arena elixir runes.' },
          { title: 'Castle Siege & Fortress Warfare', description: 'Command Allied Citadel forces against Dread Bastion in two-sided war, spending battlefield gold to deploy infantry squads, archer batteries, royal knights, and battering rams.' },
          { title: '20-Level Armory & Cloud Progression', description: 'Level up from recruit to champion with persistent DataStore saves, unlocking 6 weapon classes, 5 armor sets, and 4 shield tiers.' },
        ],
        steps: [
          { title: 'Select your hero archetype', description: 'Choose Lord Aldric for balanced heavy defense and high mitigation, or Lady Seraphine for fast-paced dual-blade mobility.' },
          { title: 'Master the parry and combo timing', description: 'Time your right-click / LT block within 0.28s of an attack to stagger bosses, then follow up with a 3-hit combo cleave.' },
          { title: 'Battle through the 15-episode campaign', description: 'Follow chapter markers, escort AI allies (Seraphine, Cael, Wren), and liberate key strongholds from traitor forces.' },
          { title: 'Lead your siege battalions', description: 'In Fortress Conquest, earn battlefield gold ticks, deploy battering rams to breach Dread Bastion, and slay the Bastion Warlord.' },
        ],
        characters: [
          { name: 'Lord Aldric Vane', role: 'The Iron Vanguard', description: 'Castellan of Aldenmoor, wielding a heavy iron broadsword and tower shield with impenetrable defensive parries.' },
          { name: 'Lady Seraphine Vane', role: 'The Unbroken Blade', description: 'High-mobility skirmisher equipped with rapid dual daggers, evasive dashes, and rapid health recovery.' },
          { name: 'Cael', role: 'Courtyard Defender', description: 'Veteran arms master who fights shoulder-to-shoulder with Aldric in the armory courtyard during Episode 6.' },
          { name: 'Wren', role: 'Vanguard Infiltrator', description: 'Agile scout who joins the vanguard during the sea-swept chapel assault in Episode 13.' },
        ],
        gallery: [
          {
            src: '/images/projects/ironvane-chronicle/icon.webp',
            alt: 'House Vane heraldic crest and official game emblem',
            title: 'House Vane Crest & Armory Insignia',
            description: 'The canonical sigil of House Vane, representing the defensive bulwark against imperial betrayal.',
          },
        ],
        productionNotes: [
          { title: 'Native Luau & Rojo Workflow', content: 'Compiled from modular Luau source trees with automated test suites verifying persistence, state machines, and dungeon boundary physics.' },
          { title: '15-Track Preloaded Audio Suite', content: 'Features 15 preloaded orchestral score cues from ACE-Step alongside custom combat SFX including metallic parry clangs, shield impacts, and evasive swooshes.' },
          { title: 'Rigorous 148-Check QA Verification', content: 'Thoroughly validated across 148 automated and playability checks, ensuring clean character collision, camera framing, and responsive mobile and gamepad controls.' },
        ],
        notes: 'Ironvane: The Iron Chronicle is published on Roblox (Universe 10768035372, Place 127416728674621). Supports up to 4 players per server.',
        links: [
          { label: 'Play Ironvane on Roblox', href: 'https://www.roblox.com/games/127416728674621/Ironvane-The-Iron-Chronicle' },
          { label: 'Watch IronVane Story on YouTube', href: 'https://www.youtube.com/@IronVaneStory/videos' },
        ],
      },
      {
        slug: 'monstrum-world',
        title: 'Monstrum World: Battle Academy',
        status: 'On Roblox',
        description: 'A monster-raising RPG on Roblox blending Monster Rancher care, Digimon branching evolutions, in-battle catching, and Active-Time Battles (ATB).',
        tags: ['Roblox', 'Luau', 'Monster Taming', 'Ranch RPG', 'ATB Combat', 'Turn-Based'],
        heroImage: {
          src: '/images/projects/monstrum-world/hero.webp',
          alt: 'Monstrum World Active-Time Battle interface and tactical command menu',
          caption: 'Turn-based Active-Time Battle (ATB) combat showcasing elemental moves, companion synergy, and capture traps.',
          aspect: 'wide',
        },
        overview: [
          'Monstrum World: Battle Academy is a Roblox monster-raising RPG combining the strategic life-sim depth of Monster Rancher with the branching evolutionary webs of Digimon and tactical Active-Time Battles (ATB). Set in the academy realm of Aetheria, players operate a monster ranch, train wild creatures, and compete in ranked tournament cups.',
          'Unlike generic creature catchers where monsters are disposable collectibles, Monstrum World focuses on the bond between breeder and monster. Every drill, meal, rest period, and battle decision alters permanent TrainedStats, determining which branched evolutionary path a monster unlocks upon reaching maturity.',
        ],
        features: [
          { title: 'Ranch Management Core Loop', description: 'Manage fatigue, stress, loyalty, and bond with ranch assistant Coach Juniper through drills, custom feeding (Mint Leaf, Prime Steak), resting, and disc shrine hatching.' },
          { title: 'Care-Driven Branching Evolution', description: 'Novice and Champion monsters evolve along divergent branches—high bond unlocks rare celestial forms, specific stat drilling unlocks elemental variants, and neglect triggers Umbra corruptions.' },
          { title: 'In-Battle Capture System', description: 'Capture occurs exclusively during combat by weakening wild foes and deploying specialized traps (Aether Snare, Volt Net, Stasis Vault) based on elemental affinity.' },
          { title: 'Active-Time Battle (ATB) Engine', description: 'Fast-paced tactical combat where Speed gauges dictate turn order, featuring elemental affinities (Pyre, Tides, Terra, Gale, Bolt, Ferrous, Lumin, Umbra) and commander Bio-Morph burst finishers.' },
          { title: 'Fusion & Rebirth Shrine', description: 'Breed veteran monsters to pass down generational stat bonuses, cross-elemental move pools, and unlock secret Ascendant tier species.' },
          { title: '62 Monsters & 40-Chapter Campaign', description: 'Raise 62 unique creatures across 5 tiers from Novice to Ascendant across an 8-act, 40-chapter story campaign.' },
        ],
        steps: [
          { title: 'Hatch your first monster', description: 'Visit the Disc Shrine or hatch with custom keywords to awaken your starter companion from ancient disc stones.' },
          { title: 'Balance training and recovery', description: 'Rotate light and heavy ranch drills with feeding and rest to keep fatigue below 90 and prevent drill failure.' },
          { title: 'Climb the tournament ranks', description: 'Enter ranked cups from Class E to Class S to increase your ranch prestige and unlock new world expeditions.' },
          { title: 'Evolve and fuse', description: 'Train target stats before level 18 and 36 to steer evolution toward your desired Champion and Ultimate forms.' },
        ],
        characters: [
          { name: 'Coach Juniper', role: 'Ranch Assistant & Breeder Mentor', description: 'Your knowledgeable ranch guide who provides commentary on monster fatigue, drill performance, and dietary needs.' },
          { name: 'Emberpup', role: 'Pyre Novice Starter', description: 'A spirited fire pup whose evolutionary branches include Pyrefang (balanced), Flarewyrm (speed), and Rust Drake (defense).' },
          { name: 'Aqualad', role: 'Tides Novice Starter', description: 'An agile water creature skilled in fluid strikes and restorative care that thrives in water drills.' },
          { name: 'Sproutling', role: 'Terra Novice Starter', description: 'A stalwart nature guardian excelling in boulder pulls and defensive fortitude.' },
        ],
        gallery: [
          {
            src: '/images/projects/monstrum-world/phone_battle.webp',
            alt: 'Monstrum World mobile battle layout with touch-friendly command wheel',
            title: 'Mobile Touch Combat Layout',
            description: 'Ergonomic mobile HUD designed for fast one-thumb command selection during intense ATB encounters.',
          },
          {
            src: '/images/projects/monstrum-world/icon.webp',
            alt: 'Monstrum World Battle Academy crest',
            title: 'Battle Academy Official Seal',
            description: 'The emblem of Aetheria’s premier breeding and combat institution.',
          },
        ],
        productionNotes: [
          { title: 'Headless Luau Test Harness', content: 'Validated via headless Luau simulation (luau_harness.py and behaviour_tests.luau) verifying drill odds, evolution branch selection, and battle state transitions.' },
          { title: 'Pure State-Machine ATB Engine', content: 'A native Luau state machine drives the ATB combat flow and command selection.' },
          { title: 'Generational Inheritance Mathematics', content: 'Fusion algorithms dynamically blend parent stat ceilings, move heritability, and generational scaling multipliers for deep breeding gameplay.' },
        ],
        notes: 'Monstrum World: Battle Academy is available on Roblox. Sign in to Roblox to open the experience; development continues in the monstrum-world repository.',
        links: [
          { label: 'Open Monstrum World on Roblox', href: 'https://www.roblox.com/games/81218380157488/Monstrum-World-Battle-Academy' },
        ],
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

type LocalizedGroupData = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

type LocalizedProjectData = {
  title?: string;
  status?: string;
  description?: string;
  tags?: string[];
};

const PROJECT_TRANSLATIONS: Record<string, {
  groups: Record<string, LocalizedGroupData>;
  projects: Record<string, LocalizedProjectData>;
}> = {
  de: {
    groups: {
      automation: { eyebrow: 'Automatisierung', title: 'Pokémon GO-Automatisierung', description: 'Wiederverwendbare Python-Workflows für verbundene Geräte, mit persönlicher Gerätekonfiguration außerhalb des Quellcodes.' },
      games: { eyebrow: 'Spiele', title: 'Spielbare Experimente', description: 'Browsergames rund um Kampf, Taktik und die Entscheidungen, die eine Runde spannend machen.' },
      roblox: { eyebrow: 'Roblox', title: 'Roblox-Spiele & -Welten', description: 'Mehrspieler-3D-Spiele, entwickelt in nativem Luau mit Rojo und Open Cloud – von Open-World-Familienabenteuern bis hin zu Dark-Fantasy-Action-RPGs und Monsterzucht.' },
      apps: { eyebrow: 'Apps', title: 'Trainings- und Ernährungstools', description: 'Fitness-Tools, um Trainingserfolge festzuhalten und tägliche Gewohnheiten im Blick zu behalten.' },
      church: { eyebrow: 'Bibel', title: 'Bibelverse & Memorierung', description: 'Tools zum Einprägen von Bibeltexten, Überprüfen des Gedächtnisses und regelmäßigen Wiederholen.' },
      video: { eyebrow: 'Video', title: 'Videokanäle und kreative Projekte', description: 'Familienvideos und Story-Serien mit individuellem Format, Videoschnitt und Veröffentlichungsrhythmus.' },
    },
    projects: {
      'pokemon-go-automation': { title: 'Pokémon GO Automatisierung', status: 'Open Source', description: 'Geschenke versenden, Freundesanfragen, GO Battle League, Tauschen, Verschicken und Beerenfütterung in einem dokumentierten Toolkit für Android und iOS.', tags: ['Python', 'Android + iOS', 'Geräte-Automatisierung', 'ADB', 'Computer Vision'] },
      'mma-rpg': { title: 'MMA RPG', status: 'Live', description: 'Ein Browser-Kampf-RPG mit Arena, Trainingsraum sowie Stand-up- und Bodenkampf-Steuerung.', tags: ['Kampfsport', 'RPG', 'Browsergame', 'JavaScript', 'HTML5 Canvas'] },
      'gridbound-realms': { title: 'Gridbound Realms', status: 'Live', description: 'Ein taktisches Rundenstrategiespiel im Browser mit gitterbasiertem Schlachtfeld und Solo- sowie lokalem Mehrspielermodus.', tags: ['Strategie', 'Taktik', 'Rundenbasiert', 'Mehrspieler'] },
      'wild-rebellion': { title: 'Wild Rebellion', status: 'Live', description: 'Tauche ein in Lilly Axolotls Welt: ein verborgenes Dorf, freundliche Drachen, betretbare Häuser, Kristalltürme und Bobcat Island am Himmel – gebaut für Koop-Spaß auf Roblox.', tags: ['Roblox', 'Luau', 'Abenteuer', 'Open World', 'Koop-RPG', 'Familienspiel'] },
      'ironvane-chronicle': { title: 'Ironvane: The Iron Chronicle', status: 'Live', description: 'Ein packendes Dark-Fantasy-Action-RPG auf Roblox mit 15-teiliger Kampagne, 15-Wellen-Überlebensarena, Festungseroberung und präzisem Parierkampf.', tags: ['Roblox', 'Luau', 'Dark Fantasy', 'Action-RPG', 'Kampf', 'Kampagne'] },
      'monstrum-world': { title: 'Monstrum World: Battle Academy', status: 'Auf Roblox', description: 'Ein Monsterzucht-RPG auf Roblox, das Ranch-Pflege im Monster-Rancher-Stil mit verzweigten Evolutionen, Fangen im Kampf und Active-Time-Battles (ATB) verbindet.', tags: ['Roblox', 'Luau', 'Monstersammeln', 'Ranch-RPG', 'ATB-Kampf', 'Rundenbasiert'] },
      'bjj-buddy': { title: 'BJJ Buddy', status: 'Projekt', description: 'Ein Brazilian Jiu-Jitsu Begleiter zum Protokollieren von Sparringsrunden, Organisieren von Techniken und Verfolgen des Grappling-Fortschritts.', tags: ['BJJ', 'React Native', 'Expo', 'Trainingslog', 'Grappling'] },
      'nutritrack': { title: 'NutriTrack', status: 'Projekt', description: 'Ein Ernährungstracker, der Mahlzeiten erfasst und Kalorien- sowie Makronährstoffziele direkt mit Trainingsleistungen verknüpft.', tags: ['Ernährung', 'React Native', 'Makros', 'Krafttraining', 'BJJ-Sync'] },
      'one-peter-memory': { title: '1. Petrus Memorierungstrainer', status: 'Live', description: 'Ein KJV-Bibeltrainer mit Audioausgabe, verschwindendem Text, Rezitationsprüfungen und geplanter Wiederholung.', tags: ['Bibel', 'Auswendiglernen', 'KJV', 'Web-App', 'Edge-TTS'] },
      'lilly': { title: 'Lilly Plays', status: 'Aktiv', description: 'Gaming- und Familienabenteuervideos von Lilly, mit professionellem Schnitt, Untertiteln, ganzen Episoden und Shorts.', tags: ['YouTube', 'Gaming', 'Familienabenteuer', 'Minecraft', 'Roblox', 'Shorts'] },
      'liminal': { title: 'Liminal', status: 'Archiviert', description: 'Eine übernatürliche Anime-Comedy-Serie über ein traditionelles Küsten-Ryokan an der Schwelle zwischen Menschen- und Geisterwelt.', tags: ['Anime-Serie', 'KI-Generiert', 'FLUX LoRA', 'Comedy', 'Storytelling'] },
    },
  },
  es: {
    groups: {
      automation: { eyebrow: 'Automatización', title: 'Automatización de Pokémon GO', description: 'Flujos de trabajo reutilizables en Python para teléfonos conectados, con configuración de dispositivos mantenida fuera del código fuente.' },
      games: { eyebrow: 'Juegos', title: 'Experimentos jugables', description: 'Juegos de navegador basados en combate, táctica y decisiones estratégicas en cada ronda.' },
      roblox: { eyebrow: 'Roblox', title: 'Juegos y mundos en Roblox', description: 'Juegos multijugador 3D desarrollados en Luau nativo con Rojo y Open Cloud: desde aventuras familiares en mundo abierto hasta RPGs de acción y crianza de criaturas.' },
      apps: { eyebrow: 'Apps', title: 'Herramientas de entrenamiento y nutrición', description: 'Utilidades de fitness para registrar entrenamientos y mantener visibles los hábitos diarios.' },
      church: { eyebrow: 'Escrituras', title: 'Memorización de las Escrituras', description: 'Herramientas interactivas para practicar pasajes bíblicos, comprobar la memoria y repasarlos con el tiempo.' },
      video: { eyebrow: 'Vídeo', title: 'Canales de vídeo y proyectos creativos', description: 'Vídeos familiares y series de historias con formatos únicos, edición cuidada y ritmo de publicación constante.' },
    },
    projects: {
      'pokemon-go-automation': { title: 'Automatización de Pokémon GO', status: 'Código abierto', description: 'Envío de regalos, solicitudes de amistad, Liga Combates GO, intercambios, transferencias y alimentación de bayas en un kit documentado para Android e iOS.', tags: ['Python', 'Android + iOS', 'Automatización', 'ADB', 'Visión por ordenador'] },
      'mma-rpg': { title: 'MMA RPG', status: 'En vivo', description: 'Un RPG de lucha para navegador con arena, sala de pesas y controles tanto de golpeo como de sumisiones en el suelo.', tags: ['Lucha', 'RPG', 'Juego de navegador', 'JavaScript', 'HTML5 Canvas'] },
      'gridbound-realms': { title: 'Gridbound Realms', status: 'En vivo', description: 'Un juego táctico por turnos en navegador con tablero de casillas, acciones de escuadrón y modos individual y multijugador local.', tags: ['Estrategia', 'Táctica', 'Casillas', 'Por turnos', 'Multijugador'] },
      'wild-rebellion': { title: 'Wild Rebellion', status: 'En vivo', description: 'Adéntrate en el mundo de Lilly Axolotl: una aldea oculta, dragones amigables, casas explorables, torres de cristal y la Isla Bobcat en el cielo, creado para jugar en cooperativo en Roblox.', tags: ['Roblox', 'Luau', 'Aventura', 'Mundo abierto', 'RPG cooperativo', 'Juego familiar'] },
      'ironvane-chronicle': { title: 'Ironvane: The Iron Chronicle', status: 'En vivo', description: 'Un inmersivo RPG de acción y fantasía oscura en Roblox con campaña de 15 capítulos, arena de supervivencia de 15 oleadas, asedio a fortalezas y combate con bloqueos cronometrados.', tags: ['Roblox', 'Luau', 'Fantasía oscura', 'RPG de acción', 'Combate', 'Campaña'] },
      'monstrum-world': { title: 'Monstrum World: Battle Academy', status: 'En Roblox', description: 'Un RPG de crianza de monstruos en Roblox que combina el cuidado en ranchos tipo Monster Rancher con evoluciones ramificadas estilo Digimon, captura en combate y batallas Active-Time (ATB).', tags: ['Roblox', 'Luau', 'Domar criaturas', 'RPG de rancho', 'Combate ATB', 'Por turnos'] },
      'bjj-buddy': { title: 'BJJ Buddy', status: 'Proyecto', description: 'Un compañero de Brazilian Jiu-Jitsu para registrar combates, organizar técnicas y seguir tu evolución en el tatami.', tags: ['BJJ', 'React Native', 'Expo', 'Registro de entreno', 'Grappling'] },
      'nutritrack': { title: 'NutriTrack', status: 'Proyecto', description: 'Seguimiento nutricional para registrar comidas y conectar los objetivos de calorías y macronutrientes con el rendimiento deportivo.', tags: ['Nutrición', 'React Native', 'Macronutrientes', 'Fuerza', 'Sincronización BJJ'] },
      'one-peter-memory': { title: 'Entrenador de Memoria de 1 Pedro', status: 'En vivo', description: 'Entrenador de memorización de las Escrituras (versión KJV) con audio, palabras que desaparecen y comprobación de recitación.', tags: ['Escrituras', 'Memorización', 'KJV', 'App Web', 'Edge-TTS'] },
      'lilly': { title: 'Lilly Plays', status: 'Activo', description: 'Vídeos de gaming y aventuras familiares presentados por Lilly, con edición, subtítulos, episodios completos y Shorts producidos entre bastidores.', tags: ['YouTube', 'Gaming', 'Aventuras familiares', 'Minecraft', 'Roblox', 'Shorts'] },
      'liminal': { title: 'Liminal', status: 'Archivado', description: 'Serie de comedia inspirada en el anime sobrenatural ambientada en una posada costera en el umbral entre el mundo humano y el espiritual.', tags: ['Serie Anime', 'Generado por IA', 'FLUX LoRA', 'Comedia', 'Narrativa'] },
    },
  },
  hi: {
    groups: {
      automation: { eyebrow: 'ऑटोमेशन', title: 'पोकेमॉन गो ऑटोमेशन', description: 'कनेक्टेड फोन के लिए पुन: प्रयोज्य पायथन वर्कफ़्लो, व्यक्तिगत डिवाइस सेटिंग्स को कोड से अलग रखा गया है।' },
      games: { eyebrow: 'गेम्स', title: 'खेलने योग्य प्रयोग', description: 'लड़ाई, रणनीति और दिलचस्प निर्णयों के इर्द-गिर्द बने ब्राउज़र गेम्स।' },
      roblox: { eyebrow: 'रोब्लॉक्स', title: 'रोब्लॉक्स गेम्स और संसार', description: 'Rojo और Open Cloud के साथ मूल Luau में तैयार किए गए मल्टीप्लेयर 3D गेम्स — ओपन-वर्ल्ड एडवेंचर्स, डार्क फैंटेसी एक्शन-RPG और जीव पालन।' },
      apps: { eyebrow: 'ऐप्स', title: 'ट्रेनिंग और पोषण टूल्स', description: 'ट्रेनिंग की प्रोग्रेस रिकॉर्ड करने और दैनिक आदतों को ट्रैक करने के लिए फिटनेस यूटिलिटीज।' },
      church: { eyebrow: 'धर्मग्रंथ', title: 'धर्मग्रंथ और याद करने के टूल्स', description: 'धर्मग्रंथों को याद करने, स्मरण शक्ति की जांच करने और नियमित अभ्यास के लिए इंटरैक्टिव टूल्स।' },
      video: { eyebrow: 'वीडियो', title: 'वीडियो चैनल और रचनात्मक प्रोजेक्ट्स', description: 'पारिवारिक वीडियो और कहानी श्रृंखला, प्रत्येक का अपना प्रारूप, संपादन और रिलीज शेड्यूल।' },
    },
    projects: {
      'pokemon-go-automation': { title: 'पोकेमॉन गो ऑटोमेशन', status: 'ओपन सोर्स', description: 'एंड्रॉइड और आईओएस दोनों के लिए गिफ्ट भेजने, दोस्त जोड़ने, गो बैटल लीग, ट्रेड और ट्रांसफर का संपूर्ण ऑटोमेशन टूलकिट।', tags: ['पायथन', 'एंड्रॉइड + आईओएस', 'डिवाइस ऑटोमेशन', 'ADB', 'कंप्यूटर विजन'] },
      'mma-rpg': { title: 'MMA RPG', status: 'लाइव', description: 'एरीना, ट्रेनिंग रूम और स्टैंड-अप व ग्राउंड कंट्रोल के साथ एक ब्राउज़र-आधारित फाइटिंग RPG।', tags: ['फाइटिंग', 'RPG', 'ब्राउज़र गेम', 'जावास्क्रिप्ट', 'HTML5 कैनवास'] },
      'gridbound-realms': { title: 'ग्रिडबाउंड रियल्म्स', status: 'लाइव', description: 'ग्रिड युद्धक्षेत्र, यूनिट एक्शन और सोलो या लोकल मल्टीप्लेयर मोड के साथ एक रणनीतिक टर्न-बेस्ड ब्राउज़र गेम।', tags: ['रणनीति', 'टैक्टिक्स', 'ग्रिड', 'टर्न-बेस्ड', 'मल्टीप्लेयर'] },
      'wild-rebellion': { title: 'वाइल्ड रिबेलियन (Wild Rebellion)', status: 'लाइव', description: 'लिली एक्सोलोटल की दुनिया में कदम रखें: एक छिपा हुआ गांव, प्यारे ड्रैगन, प्रवेश योग्य घर, क्रिस्टल टावर और आसमान में बॉबकैट द्वीप — रोब्लॉक्स पर को-ऑप एडवेंचर।', tags: ['रोब्लॉक्स', 'Luau', 'एडवेंचर', 'ओपन वर्ल्ड', 'को-ऑप RPG', 'पारिवारिक गेम'] },
      'ironvane-chronicle': { title: 'आयरनवेन: द आयरन क्रॉनिकल', status: 'लाइव', description: '15-अध्यायों के अभियान, 15-लहर सर्वाइवल एरीना, किले की घेराबंदी और सटीक पैरी कॉम्बैट के साथ रोब्लॉक्स पर डार्क फैंटेसी एक्शन-RPG।', tags: ['रोब्लॉक्स', 'Luau', 'डार्क फैंटेसी', 'एक्शन RPG', 'कॉम्बैट', 'अभियान'] },
      'monstrum-world': { title: 'मॉन्स्ट्रम वर्ल्ड: बैटल एकेडमी', status: 'Roblox पर', description: 'मॉन्स्टर रैंचर केयर, डिजीमोन जैसी शाखाओं वाले विकास, लड़ाई में कैप्चर और एक्टिव-टाइम बैटल्स (ATB) का रोब्लॉक्स मॉन्स्टर आरपीजी।', tags: ['रोब्लॉक्स', 'Luau', 'मॉन्स्टर ट्रेनिंग', 'रैंच RPG', 'ATB कॉम्बैट', 'टर्न-बेस्ड'] },
      'bjj-buddy': { title: 'BJJ बडी', status: 'प्रोजेक्ट', description: 'ब्राज़ीलियन जिउ-जित्सु मैट रोल लॉग करने, तकनीकों को व्यवस्थित करने और ग्रैपलिंग प्रगति ट्रैक करने का साथी ऐप।', tags: ['BJJ', 'रिएक्ट नेटिव', 'एक्सपो', 'ट्रेनिंग लॉग', 'ग्रैपलिंग'] },
      'nutritrack': { title: 'न्यूट्रिट्रैक (NutriTrack)', status: 'प्रोजेक्ट', description: 'भोजन रिकॉर्ड करने और कैलोरी व मैक्रोज़ को ट्रेनिंग लक्ष्यों से सीधे जोड़ने वाला न्यूट्रिशन ट्रैकर।', tags: ['पोषण', 'रिएक्ट नेटिव', 'मैक्रोज़', 'स्ट्रेंथ ट्रेनिंग', 'BJJ सिंक'] },
      'one-peter-memory': { title: '1 पीटर मेमोरी ट्रेनर', status: 'लाइव', description: 'ऑडियो, गायब होने वाले शब्दों, पाठ जांच और शेड्यूल समीक्षा के साथ KJV धर्मग्रंथ याद करने का टूल।', tags: ['धर्मग्रंथ', 'याद करना', 'KJV', 'वेब ऐप', 'Edge-TTS'] },
      'lilly': { title: 'लिली प्लेज़ (Lilly Plays)', status: 'सक्रिय', description: 'लिली द्वारा प्रस्तुत गेमिंग और पारिवारिक रोमांचक वीडियो, संपादन, सबटाइटल और शॉर्ट्स के साथ।', tags: ['यूट्यूब', 'गेमिंग', 'पारिवारिक एडवेंचर', 'माइनक्राफ्ट', 'रोब्लॉक्स', 'शॉर्ट्स'] },
      'liminal': { title: 'लिमिनल (Liminal)', status: 'संग्रहीत', description: 'मानव दुनिया और आत्मा लोक की सीमा पर स्थित एक तटीय इन पर आधारित अलौकिक एनीमे-कॉमेडी श्रृंखला।', tags: ['एनीमे श्रृंखला', 'AI निर्मित', 'FLUX LoRA', 'कॉमेडी', 'कहानी'] },
    },
  },
  pt: {
    groups: {
      automation: { eyebrow: 'Automação', title: 'Automação do Pokémon GO', description: 'Fluxos de trabalho reutilizáveis em Python para celulares conectados, com configurações particulares de dispositivos fora do código-fonte.' },
      games: { eyebrow: 'Jogos', title: 'Experimentos jogáveis', description: 'Jogos de navegador focados em combate, táticas e escolhas dinâmicas a cada rodada.' },
      roblox: { eyebrow: 'Roblox', title: 'Jogos e mundos no Roblox', description: 'Jogos 3D multijogador desenvolvidos em Luau nativo com Rojo e Open Cloud — de aventuras familiares em mundo aberto a RPGs de ação e criação de criaturas.' },
      apps: { eyebrow: 'Aplicativos', title: 'Ferramentas de treino e nutrição', description: 'Utilitários fitness para registrar treinos e manter hábitos diários em evidência.' },
      church: { eyebrow: 'Escrituras', title: 'Memorização das Escrituras', description: 'Ferramentas para praticar passagens bíblicas, testar a memória e revisar periodicamente.' },
      video: { eyebrow: 'Vídeo', title: 'Canais de vídeo e projetos criativos', description: 'Vídeos em família e séries com narrativa própria, edição refinada e cronograma constante.' },
    },
    projects: {
      'pokemon-go-automation': { title: 'Automação Pokémon GO', status: 'Código aberto', description: 'Envio de presentes, pedidos de amizade, Liga de Batalha GO, trocas, transferências e alimentação de frutas em um kit documentado para Android e iOS.', tags: ['Python', 'Android + iOS', 'Automação', 'ADB', 'Visão Computacional'] },
      'mma-rpg': { title: 'MMA RPG', status: 'Disponível', description: 'RPG de luta no navegador com arena, sala de musculação e controles para combate em pé e no chão.', tags: ['Luta', 'RPG', 'Jogo de navegador', 'JavaScript', 'HTML5 Canvas'] },
      'gridbound-realms': { title: 'Gridbound Realms', status: 'Disponível', description: 'Jogo tático por turnos em tabuleiro de grade, com ações de esquadrão e modos solo ou multijogador local.', tags: ['Estratégia', 'Tática', 'Grade', 'Por turnos', 'Multijogador'] },
      'wild-rebellion': { title: 'Wild Rebellion', status: 'Disponível', description: 'Entre no mundo de Lilly Axolotl: uma vila secreta, dragões amigáveis, casas exploráveis, torres de cristal e a Ilha Bobcat no céu — feito para jogar em equipe no Roblox.', tags: ['Roblox', 'Luau', 'Aventura', 'Mundo aberto', 'RPG cooperativo', 'Jogos em família'] },
      'ironvane-chronicle': { title: 'Ironvane: The Iron Chronicle', status: 'Disponível', description: 'Um RPG de ação e fantasia sombria no Roblox com campanha em 15 capítulos, arena de sobrevivência em 15 ondas, cerco a fortalezas e combate com parry preciso.', tags: ['Roblox', 'Luau', 'Dark Fantasy', 'RPG de ação', 'Combate', 'Campanha'] },
      'monstrum-world': { title: 'Monstrum World: Battle Academy', status: 'No Roblox', description: 'RPG de criação de monstros no Roblox combinando cuidados estilo Monster Rancher com evoluções ramificadas estilo Digimon, captura em batalha e combate Active-Time (ATB).', tags: ['Roblox', 'Luau', 'Doma de monstros', 'RPG de rancho', 'Combate ATB', 'Por turnos'] },
      'bjj-buddy': { title: 'BJJ Buddy', status: 'Projeto', description: 'Companheiro de Brazilian Jiu-Jitsu para registrar rolas, organizar técnicas e acompanhar o progresso no tatame.', tags: ['BJJ', 'React Native', 'Expo', 'Diário de treino', 'Grappling'] },
      'nutritrack': { title: 'NutriTrack', status: 'Projeto', description: 'Monitor nutricional para registrar refeições e alinhar ingestão de calorias e macros aos objetivos de treino de força e jiu-jitsu.', tags: ['Nutrição', 'React Native', 'Macros', 'Musculação', 'Sincronização BJJ'] },
      'one-peter-memory': { title: 'Treinador de Memória de 1 Pedro', status: 'Disponível', description: 'Treinador de memorização bíblica KJV com narração em áudio, palavras que somem e verificação automática de recitação.', tags: ['Escrituras', 'Memorização', 'KJV', 'Web App', 'Edge-TTS'] },
      'lilly': { title: 'Lilly Plays', status: 'Ativo', description: 'Vídeos de jogos e aventuras em família apresentados por Lilly, com edição, legendas, episódios completos e Shorts dos bastidores.', tags: ['YouTube', 'Jogos', 'Aventuras em família', 'Minecraft', 'Roblox', 'Shorts'] },
      'liminal': { title: 'Liminal', status: 'Arquivado', description: 'Série de comédia sobrenatural inspirada em anime ambientada em uma pousada costeira no limiar entre o mundo humano e espiritual.', tags: ['Série Anime', 'Gerado por IA', 'FLUX LoRA', 'Comédia', 'Narrativa'] },
    },
  },
};

export function getLocalizedProjectGroups(lang = 'en') {
  if (lang === 'en' || !PROJECT_TRANSLATIONS[lang]) {
    return projectGroups;
  }

  const localeData = PROJECT_TRANSLATIONS[lang];
  return projectGroups.map((group) => {
    const groupTrans = localeData.groups[group.id] || {};
    const translatedProjects = group.projects.map((project) => {
      const projTrans = localeData.projects[project.slug] || {};
      return {
        ...project,
        title: projTrans.title || project.title,
        status: projTrans.status || project.status,
        description: projTrans.description || project.description,
        tags: projTrans.tags || project.tags,
      };
    });

    return {
      ...group,
      eyebrow: groupTrans.eyebrow || group.eyebrow,
      title: groupTrans.title || group.title,
      description: groupTrans.description || group.description,
      projects: translatedProjects,
    };
  });
}

export function getLocalizedProjects(lang = 'en') {
  return getLocalizedProjectGroups(lang).flatMap((group) =>
    group.projects.map((project) => ({ ...project, group: group.eyebrow }))
  );
}
