import { currentSpeedianceStats, garminStats, whoopStats, eightSleepStats } from './fitnessStats';

export type GearVerdict = 'Not Recommended' | 'Good' | 'Great' | 'Essential';
export type GearStatus = 'current' | 'replaced';

export interface GearMetric {
  label: string;
  value: string;
}

export interface GearItem {
  slug: string;
  name: string;
  category: string;
  categoryEmoji: string;
  status: GearStatus;
  verdict: GearVerdict;
  location: string;
  image: string;
  shortDescription: string;
  detailIntro: string;
  details: string[];
  pros: string[];
  cons: string[];
  metrics?: GearMetric[];
  affiliateUrl?: string;
  affiliateLabel?: string;
  affiliateNote: string;
  replacedBy?: string;
  sortOrder: number;
}

export const gearItems: GearItem[] = [
  {
    slug: 'speediance-gym-monster-2s',
    name: 'Speediance Gym Monster 2S',
    category: 'Home Gym',
    categoryEmoji: '🏋️',
    status: 'current',
    verdict: 'Great',
    location: 'Upstairs Office',
    image: '/images/gear/speediance-gym-monster-2s.jpg',
    shortDescription: 'Quiet cable machine with huge logged volume, but firmware decisions introduced regressions.',
    detailIntro: 'Primary upstairs machine with massive real-world usage.',
    details: [
      'It is significantly quieter than my original unit and office-friendly. I have logged 1,296,447 lbs of total volume across both Speediance machines with a best single session of 35,305 lbs in 50 minutes.',
      'Post-V3.1 firmware changes made cable behavior worse for my training style. I have publicly criticized the retraction behavior and app responsiveness issues.',
      'Even with software frustrations, the physical utility for daily heavy cable work is high enough that it remains a core part of my training.'
    ],
    pros: [
      'Significantly quieter than the original Gym Monster',
      'Compact footprint for an upstairs office setup',
      'Proven volume workhorse across hundreds of sessions'
    ],
    cons: [
      'Firmware V3.1 regression changed cable loading behavior',
      'App responsiveness can feel laggy during sessions',
      'Software changes hurt user trust over time'
    ],
    metrics: [
      { label: 'Total Volume (Both Machines)', value: '1,296,447 lbs' },
      { label: 'Single Session Best Volume', value: '35,305 lbs' },
      { label: 'Single Session Duration', value: '50 minutes' }
    ],
    affiliateUrl: 'https://speediance.pxf.io/c/5903932/2180806/26850',
    affiliateLabel: 'View Speediance Gym Monster 2S',
    affiliateNote: 'Affiliate link included. I bought this machine with my own money.',
    sortOrder: 1
  },
  {
    slug: 'speediance-gym-monster-original',
    name: 'Speediance Gym Monster (Original)',
    category: 'Home Gym',
    categoryEmoji: '🏋️',
    status: 'current',
    verdict: 'Good',
    location: 'Downstairs Gym',
    image: '/images/gear/speediance-gym-monster-original.jpg',
    shortDescription: 'Loud motor fan, but a reliable secondary workhorse machine.',
    detailIntro: 'The original unit that proved the digital weight concept in my training.',
    details: [
      'This machine built my initial baseline for digital weight training before I added the 2S upstairs.',
      'Motor fan noise is noticeably louder than the 2S, making it less ideal for quiet environments.',
      'It remains fully functional and handles secondary training sessions in the downstairs setup.'
    ],
    pros: [
      'Handles heavy daily training volume reliably',
      'Solid hardware durability over long-term use',
      'Good baseline cable motion'
    ],
    cons: [
      'Noticeably louder motor fan operation',
      'Same software/firmware limitations as the rest of the ecosystem'
    ],
    metrics: [
      { label: 'Total Workouts Logged (Both)', value: '88' },
      { label: 'Primary Use', value: 'Downstairs supplementary lifting' }
    ],
    affiliateUrl: 'https://speediance.pxf.io/c/5903932/2180806/26850',
    affiliateLabel: 'View Speediance Store',
    affiliateNote: 'Affiliate link included. Used in my real training environment.',
    sortOrder: 2
  },
  {
    slug: 'doorway-pull-up-bar',
    name: 'Power Rack with Pull up Bar',
    category: 'Home Gym',
    categoryEmoji: '🏋️',
    status: 'current',
    verdict: 'Essential',
    location: 'Downstairs Gym',
    image: '/images/gear/power-rack-with-pull-up-bar.jpg',
    shortDescription: 'Zero electronics, infinite uptime, mandatory anchor for daily training.',
    detailIntro: 'The absolute physical baseline of my home gym setup.',
    details: [
      'No firmware updates, no Bluetooth pairing, no subscription tier, no software regressions.',
      'Used daily for bodyweight pull-ups, chin-ups, hanging leg raises, and band attachments.',
      'Complements digital weight systems by providing simple, bulletproof mechanical reliability.'
    ],
    pros: [
      'Zero maintenance and infinite operational life',
      'No dependence on cloud services or apps',
      'Essential for foundational upper-body movements'
    ],
    cons: [
      'Takes up fixed physical space',
      'Requires proper installation and ceiling height'
    ],
    affiliateNote: 'No affiliate relationship. Simple rack hardware.',
    sortOrder: 3
  },
  {
    slug: 'whoop-5',
    name: 'WHOOP 5.0',
    category: 'Wearables & Recovery',
    categoryEmoji: '⌚',
    status: 'current',
    verdict: 'Essential',
    location: 'On Wrist (24/7)',
    image: '/images/gear/whoop-5.0.jpg',
    shortDescription: 'Continuous strain, HRV, and recovery anchor. 30-day avg recovery 62% (n=30), HRV 28.0 ms, RHR 72 bpm.',
    detailIntro: 'My primary 24/7 recovery monitor and strain engine — 1,646 recovery scores on file since Feb 2026.',
    details: [
      'I rely on WHOOP for continuous HRV, resting heart rate, and sleep strain tracking. The most recent 30 days of recovery data show a 62% average (n=30) with HRV 28.0 ms and resting HR 72 bpm.',
      'Sleep data over the same window averages 7.3h in bed, 6.6h asleep, 2.2h REM, 1.4h deep, and 76% sleep performance. That composition tracks with my long-term pattern (all-time 30.6% green days, 52.2% yellow, 17.2% red across 1,646 recoveries).',
      '30-day average strain sits at 6.9 with peaks at 14.1. The battery pack mechanism avoids the battery-degradation issues I experienced with other wearables, which is why WHOOP replaced my Oura ring in this slot.',
      'Data flows directly into my daily readiness model to decide whether to push Speediance volume, scale back, or shift to mobility and BJJ work.'
    ],
    pros: [
      'Continuous 24/7 monitoring without off-wrist charging downtime',
      'Consistent HRV and recovery trend modeling (1,600+ days of personal history)',
      'No battery replacement failure mode like ring form factors',
      'Strong strain/sleep correlation with subjective readiness'
    ],
    cons: [
      'Subscription model required for ongoing use',
      'Screenless design requires phone app for real-time checks',
      'Web experience has degraded over multiple product cycles'
    ],
    metrics: [
      { label: '30-Day Avg Recovery', value: '62%' },
      { label: '30-Day Avg HRV', value: '28.0 ms' },
      { label: '30-Day Avg RHR', value: '72 bpm' },
      { label: '30-Day Avg Sleep Performance', value: '76%' },
      { label: '30-Day Avg Time Asleep', value: '6.6h' },
      { label: '30-Day Avg REM Sleep', value: '2.2h' },
      { label: '30-Day Avg Deep Sleep', value: '1.4h' },
      { label: '30-Day Avg Strain', value: '6.9 (peak 14.1)' },
      { label: 'All-Time Green Recovery Days', value: '30.6%' },
      { label: 'Total Recovery Records', value: '1,646 days' }
    ],
    affiliateNote: 'No affiliate link. Real data from 1,600+ days of personal use — the live section on this page recomputes on every build.',
    sortOrder: 4
  },
  {
    slug: 'garmin-forerunner-265s',
    name: 'Garmin Forerunner 265S',
    category: 'Wearables & Recovery',
    categoryEmoji: '⌚',
    status: 'current',
    verdict: 'Essential',
    location: 'On Wrist (Workouts & Outdoor)',
    image: '/images/gear/garmin-forerunner-265s.jpg',
    shortDescription: 'Dedicated outdoor running and multisport GPS watch with bulletproof tracking.',
    detailIntro: 'Primary cardio and run tracking watch.',
    details: [
      'Selected for physical button controls, bright AMOLED display, and reliable GPS pacing.',
      'I use it for all outdoor runs, intervals, and cardio sessions where real-time metrics matter.',
      'Provides dependable distance, heart rate, and training load data without smartwatch distractions.'
    ],
    pros: [
      'Excellent GPS accuracy and instant pace feedback',
      'Physical buttons work reliably with sweaty hands or gloves',
      'Long battery life with minimal charging friction'
    ],
    cons: [
      'Garmin ecosystem UI can feel dense for casual users',
      'Fewer third-party smartwatch app integrations than Apple Watch'
    ],
    metrics: [
      { label: 'Total Distance (Lifetime)', value: '4,012 mi' },
      { label: 'Total Run Sessions', value: '1,385' }
    ],
    affiliateNote: 'No affiliate relationship with Garmin.',
    sortOrder: 5
  },
  {
    slug: 'apple-watch-series-11',
    name: 'Apple Watch Series 11',
    category: 'Wearables & Recovery',
    categoryEmoji: '⌚',
    status: 'current',
    verdict: 'Good',
    location: 'Secondary Wearable',
    image: '/images/gear/apple-watch-s11.jpg',
    shortDescription: 'Smartwatch convenience, health sensors, and secondary metric validation.',
    detailIntro: 'Used for smartwatch notifications, Siri triggers, and secondary health tracking.',
    details: [
      'Fills the smartwatch role where Garmin and WHOOP are focused strictly on athletic telemetry.',
      'Useful for quick notifications, voice notes, and cross-checking heart rate metrics.',
      'Battery life requires daily charging, so it does not replace my 24/7 recovery monitors.'
    ],
    pros: [
      'Best-in-class smartwatch integration and notifications',
      'Fast responsive display and voice controls',
      'Accurate heart rate sensor for general health check-ins'
    ],
    cons: [
      'Daily charging requirement creates tracking gaps',
      'Touchscreen-first UI is less ideal during intense workouts'
    ],
    affiliateNote: 'No affiliate relationship with Apple.',
    sortOrder: 6
  },
  {
    slug: '8sleep-pod',
    name: '8Sleep Pod',
    category: 'Sleep & Recovery',
    categoryEmoji: '😴',
    status: 'current',
    verdict: 'Essential',
    location: 'Bedroom',
    image: '/images/gear/8sleep-pod.jpg',
    shortDescription: 'Active thermal regulation mattress cover with automated temperature adjustments.',
    detailIntro: 'The single highest-impact sleep environment upgrade in my setup.',
    details: [
      'Dynamically cools and warms throughout the night based on sleep stages and biometrics.',
      'Has drastically improved my deep sleep consistency and reduced nighttime wake-ups.',
      'Integrated metrics feed directly into my recovery correlation analysis.'
    ],
    pros: [
      'Active dual-zone temperature control during sleep cycles',
      'Measurable boost in deep sleep duration and HRV stability',
      'Seamless automated operation once programmed'
    ],
    cons: [
      'High hardware cost and ongoing subscription requirements',
      'Requires periodic water maintenance and priming'
    ],
    metrics: [
      { label: 'Recent Avg Sleep Score', value: '69' },
      { label: 'Recent Avg Sleep Duration', value: '5.8h' }
    ],
    affiliateNote: 'No affiliate relationship with 8Sleep.',
    sortOrder: 7
  },
  {
    slug: 'cronometer',
    name: 'Cronometer',
    category: 'Nutrition & Tracking',
    categoryEmoji: '🥗',
    status: 'current',
    verdict: 'Great',
    location: 'Mobile & Web App',
    image: '/images/gear/cronometer.jpg',
    shortDescription: 'Micronutrient and macro logging tool with verifiable nutrition database entries.',
    detailIntro: 'Primary app for accurate nutrition and micronutrient tracking.',
    details: [
      'Chosen for verified NCCDB food database accuracy over crowd-sourced databases.',
      'Tracks total calories, macronutrient split, and comprehensive micronutrient targets.',
      'Exports clean nutrition logs that sync with my central reporting dashboard.'
    ],
    pros: [
      'Highly accurate verified food database entries',
      'Detailed breakdown of micronutrients and amino acids',
      'Clean data exports for personal analytics'
    ],
    cons: [
      'Manual entry is slower than camera-first tools',
      'Long-term app choice still under evaluation'
    ],
    affiliateNote: 'No affiliate relationship with Cronometer.',
    sortOrder: 8
  },
  {
    slug: 'codex-antigravity-claude-m3-mac-studio',
    name: 'M3 Mac Studio (Codex, Antigravity, Claude)',
    category: 'AI & Tech',
    categoryEmoji: '🤖',
    status: 'current',
    verdict: 'Essential',
    location: 'Local Workstation',
    image: '/images/gear/openclaw-mac-studio.jpg',
    shortDescription: 'M3 Mac Studio running Codex, Antigravity, and Claude (CMD) for agentic development. Recommended replacement for the M1 Mac Mini.',
    detailIntro: 'My primary local workstation for multi-agent developer orchestration — runs Codex, Antigravity, and Claude in parallel.',
    details: [
      'Upgraded from the M1 Mac Mini to the M3 Mac Studio for massive unified memory headroom, faster CPU/GPU cores, and sustained throughput.',
      'Now hosts three concurrent agent stacks: OpenAI Codex, Google Antigravity, and Anthropic Claude (run from the command line).',
      'Replaced the original OpenClaw-only setup with an integrated agentic developer environment for code generation, project builds, and long-context local tasks.',
      'If you are considering an M1 Mac Mini for self-hosted AI today, I would skip it and go straight to an M3 Mac Studio unless your workload is very light.'
    ],
    pros: [
      'Massive unified memory headroom for heavy parallel agent tasks',
      'Seamless orchestration of Codex, Antigravity, and Claude agent workflows',
      'Blazing fast local site builds and compilation performance',
      'Silent, cool operation under heavy multi-threaded workloads',
      'Recommended upgrade path from any M1-class Mac'
    ],
    cons: [
      'High upfront hardware investment',
      'Requires active workspace and key configuration for each agent tool'
    ],
    affiliateNote: 'No commercial relationship. Recommended primary workstation for agentic development.',
    sortOrder: 9
  },
  {
    slug: 'hermes-dgx-gx10',
    name: 'GX10 / DGX Spark (Hermes AI)',
    category: 'AI & Tech',
    categoryEmoji: '🤖',
    status: 'current',
    verdict: 'Essential',
    location: 'Local AI Server (192.168.1.6)',
    image: '/images/gear/dgx-gx10.jpg',
    shortDescription: 'NVIDIA DGX Spark (a.k.a. GX10) running Hermes local AI models for high-throughput on-prem inferencing and background agent workloads.',
    detailIntro: 'My dedicated on-prem AI server — the GX10 runs Hermes models locally for the heavy background work that the M3 Mac Studio is too small for.',
    details: [
      'The NVIDIA DGX Spark (codename GX10) lives at 192.168.1.6 and serves as my dedicated local AI compute engine.',
      'Powered by Hermes local AI models for ultra-fast inference response times, high context bandwidth, and zero cloud API dependency.',
      'Handles continuous background tasks, automated data processing pipelines, and Hermes tool invocations with high memory throughput.',
      'Reachable from the M3 Mac Studio over SSH — this is the rig that hosts the gear site you are reading right now.'
    ],
    pros: [
      'Dedicated on-prem LLM inference with Hermes — no cloud API cost',
      'High memory bandwidth for batched local model workloads',
      'Powers the site / pipelines / data processing without round-tripping to a cloud provider',
      'Complete data privacy with on-device execution'
    ],
    cons: [
      'Higher power draw during continuous heavy inference batches',
      'Requires dedicated Linux host management and server configuration',
      'Not portable — lives at 192.168.1.6 in the rack'
    ],
    affiliateNote: 'No commercial relationship. This is the rig that serves this very website.',
    sortOrder: 10
  },
  {
    slug: 'tonal',
    name: 'Tonal',
    category: 'What I Replaced',
    categoryEmoji: '🗑️',
    status: 'replaced',
    verdict: 'Not Recommended',
    location: 'Retired',
    image: '/images/gear/tonal.jpg',
    shortDescription: 'Replaced due to subscription and data-control tradeoffs that did not fit my workflow.',
    detailIntro: 'Important product, but no longer a fit for how I train.',
    details: [
      'Membership model and data ownership constraints were the main blockers for me.',
      'I replaced it with a setup that better supports independent tracking and custom analysis.'
    ],
    pros: [
      'Strong guided programming',
      'Polished user experience'
    ],
    cons: [
      'Ongoing subscription dependency',
      'Less aligned with my data portability priorities'
    ],
    affiliateNote: 'No active recommendation from my current setup.',
    replacedBy: 'Speediance setup',
    sortOrder: 101
  },
  {
    slug: 'apple-watch-gen-1-2',
    name: 'Apple Watch (Gen 1 & 2)',
    category: 'What I Replaced',
    categoryEmoji: '🗑️',
    status: 'replaced',
    verdict: 'Not Recommended',
    location: 'Retired',
    image: '/images/gear/apple-watch-gen-1-2.jpg',
    shortDescription: 'Older generations were unreliable for my use and were replaced with Garmin.',
    detailIntro: 'Early smartwatch experience that did not hold up for my requirements.',
    details: [
      'Stability and workflow annoyances were too frequent for my tolerance.',
      'I moved to Garmin for durability, focus, and long-term reliability.'
    ],
    pros: [
      'Strong ecosystem vision for the time',
      'Good concept for mainstream smart wearables'
    ],
    cons: [
      'Reliability issues in my use',
      'Workflow friction after updates'
    ],
    affiliateNote: 'No active recommendation from my current setup.',
    replacedBy: 'Garmin Forerunner 265S',
    sortOrder: 102
  },
  {
    slug: 'motorola-watch-2r',
    name: 'Motorola Watch 2R',
    category: 'What I Replaced',
    categoryEmoji: '🗑️',
    status: 'replaced',
    verdict: 'Not Recommended',
    location: 'Returned',
    image: '/images/gear/motorola-watch-2r.jpg',
    shortDescription: 'Battery was fine, but tracking quality and integration fit were not good enough long term.',
    detailIntro: 'Temporary test device that did not make the cut.',
    details: [
      'I tested it as a short-term option and decided to return it.',
      'The integration and fitness workflow fit were below what I need in my stack.'
    ],
    pros: [
      'Battery life was solid',
      'Simple baseline smartwatch behavior'
    ],
    cons: [
      'Tracking and ecosystem depth were limited',
      'Did not meet long-term workflow requirements'
    ],
    affiliateNote: 'No active recommendation from my current setup.',
    replacedBy: 'Returned (no replacement in this slot)',
    sortOrder: 103
  },
  {
    slug: 'oura-ring-gen-1-2',
    name: 'Oura Ring (Gen 1 & 2)',
    category: 'What I Replaced',
    categoryEmoji: '🗑️',
    status: 'replaced',
    verdict: 'Not Recommended',
    location: 'Dead',
    image: '/images/gear/oura-ring.jpg',
    shortDescription: 'Phenomenal tracking. Terrible battery longevity. Three devices dead within two years.',
    detailIntro: 'The Oura Ring tracks exceptionally well — but all three of mine had batteries fail inside two years.',
    details: [
      'I owned three Oura Ring units (Gen 1 and Gen 2). Every single one had its battery die within two years of use.',
      'One replacement was covered under the original two-year warranty. Oura later changed their warranty terms from two years down to one year.',
      'You pay for the device AND a monthly membership — and get a warranty that does not even cover the most common failure mode.',
      'The form factor is excellent. The sleep and recovery tracking is among the best available in any wearable.',
      'But a wearable that dies in under two years is not a wearable — it is a subscription with a hardware timer.',
      'I replaced it with WHOOP, which uses a charging pack instead of an internal battery, solving the dead-battery problem entirely.'
    ],
    pros: [
      'Outstanding sleep stage tracking',
      'Best-in-class form factor — feels like wearing nothing',
      'Readiness and recovery scores were accurate and useful',
      'Discreet — nobody knows you are tracking'
    ],
    cons: [
      'Battery died on all three units within two years',
      'Warranty changed from 2 years to 1 year mid-ownership',
      'Charges both device price AND monthly membership fee',
      'No way to replace battery — device is a write-off when it dies',
      'Customer support was unhelpful on out-of-warranty failures'
    ],
    affiliateNote: 'Cannot recommend. Hardware lifespan does not justify the combined device + membership cost.',
    replacedBy: 'WHOOP 4.0',
    sortOrder: 104
  },
  {
    slug: 'openclaw-m1-mac-mini',
    name: 'M1 Mac Mini',
    category: 'What I Replaced',
    categoryEmoji: '💻',
    status: 'replaced',
    verdict: 'Great',
    location: 'Upgraded',
    image: '/images/gear/openclaw-m1-mac-mini.jpg',
    shortDescription: 'Replaced by M3 Mac Studio. Was a solid compact node for light self-hosted automation workflows.',
    detailIntro: 'The initial self-hosted automation workhorse in my stack — now upgraded to an M3 Mac Studio.',
    details: [
      'Served as the core self-hosted node for running automation, sync connectors, and light model tasks.',
      'Replaced when I upgraded to the M3 Mac Studio to handle heavier multi-agent developer workflows (Codex, Antigravity, Claude).',
      'Would still strongly recommend for anyone looking for an efficient, dead-silent entry-level automation node.'
    ],
    pros: [
      'Incredible energy efficiency and silent operation',
      'Bridges data silos for light local automation',
      'Great entry point for self-hosted AI tasks'
    ],
    cons: [
      'Limited unified memory headroom for large models',
      'Lacks multi-core capacity for heavy parallel agent sessions'
    ],
    affiliateNote: 'No commercial relationship. Replaced by M3 Mac Studio — that rig now runs my full agent stack.',
    replacedBy: 'M3 Mac Studio (runs Codex, Antigravity, Claude)',
    sortOrder: 105
  }
];

export const currentGearItems = gearItems
  .filter((item) => item.status === 'current')
  .sort((a, b) => a.sortOrder - b.sortOrder);

export const replacedGearItems = gearItems
  .filter((item) => item.status === 'replaced')
  .sort((a, b) => a.sortOrder - b.sortOrder);

export function getGearItemBySlug(slug: string) {
  return gearItems.find((item) => item.slug === slug);
}
