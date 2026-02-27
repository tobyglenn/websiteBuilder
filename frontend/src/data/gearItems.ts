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
      'Post-V3.1 firmware changes made cable behavior worse for my training style. I have publicly criticized the retraction behavior and Safety Start implementation.',
      'The hardware is excellent. My biggest issue is software direction and delayed features for advanced custom programming.'
    ],
    pros: [
      'Very quiet operation in a home office',
      'Automatic rep and load tracking',
      'Reliable hardware in daily use',
      'User-replaceable cables and durable build'
    ],
    cons: [
      'V3.1 cable retraction regression',
      'Safety Start behavior is not useful for my workflows',
      'Key software features have moved slower than expected'
    ],
    metrics: [
      { label: 'Total Volume (Both Machines)', value: '1,296,447 lbs' },
      { label: 'Best Session', value: '35,305 lbs / 50 min' }
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=Speediance+Gym+Monster&tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price with no sponsorship.',
    sortOrder: 1
  },
  {
    slug: 'speediance-gym-monster-original',
    name: 'Speediance Gym Monster (Original)',
    category: 'Home Gym',
    categoryEmoji: '🏋️',
    status: 'current',
    verdict: 'Great',
    location: 'Downstairs Living Room',
    image: '/images/gear/speediance-gym-monster-original.jpg',
    shortDescription: 'Older unit that currently feels more reliable in cable behavior than the 2S firmware path.',
    detailIntro: 'Original unit that still gets daily use.',
    details: [
      'This unit is louder than my 2S, so it lives downstairs. Speediance confirmed unit-to-unit power-supply noise variance.',
      'Even though it is older, current behavior feels better for my use case than the 2S after recent updates.',
      'Family-friendly and stable in regular use without downtime.'
    ],
    pros: [
      'Consistent real-world reliability',
      'Daily use with no major failures',
      'Strong fit for shared family use'
    ],
    cons: [
      'Power supply noise can be noticeable',
      'Feature set lags newer model updates',
      'No Pilates/Safety Start hardware path'
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=Speediance+Gym+Monster&tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price.',
    sortOrder: 2
  },
  {
    slug: 'doorway-pull-up-bar',
    name: 'Power Rack with Pull up Bar',
    category: 'Home Gym',
    categoryEmoji: '🏋️',
    status: 'current',
    verdict: 'Great',
    location: 'Doorway Setup',
    image: '/images/gear/power-rack-with-pull-up-bar.jpg',
    shortDescription: 'Solid rack setup for dead hangs and pull-ups between cable sessions.',
    detailIntro: 'Low-cost, high-frequency accessory.',
    details: [
      'It does exactly what I need without extra complexity.',
      'Useful for quick pull-up and grip work when I do not want to run a full machine session.'
    ],
    pros: [
      'Easy to use and put together',
      'Great for daily hangs and pull-ups',
      'Fits perfectly around the Speediance',
      'Strong value for price'
    ],
    cons: [
      'Accessory-level utility only'
    ],
    affiliateUrl: 'https://www.amazon.com/dp/B09Z2NHBHJ?tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price.',
    sortOrder: 3
  },
  {
    slug: 'whoop-5',
    name: 'WHOOP 5.0',
    category: 'Recovery Tracking',
    categoryEmoji: '💜',
    status: 'current',
    verdict: 'Essential',
    location: 'Worn 24/7',
    image: '/images/gear/whoop-5.0.jpg',
    shortDescription: 'Core recovery tracker for training decisions, with strong hardware but platform frustrations.',
    detailIntro: 'My main recovery signal for day-to-day training load decisions.',
    details: [
      'I run WHOOP alongside Garmin and use WHOOP recovery/strain signals to decide how hard to train.',
      'Data quality improved once integrations were fixed, especially when workout strain could flow correctly.',
      'Hardware remains strong, but product decisions and web experience have regressed in areas I care about.'
    ],
    pros: [
      'Recovery and HRV insights drive real decisions',
      'Strong wearability and continuous tracking',
      'Useful signal during mixed training blocks'
    ],
    cons: [
      'Web experience has degraded over time',
      'Accessory/backward compatibility issues',
      'Needs clean integration plumbing for accurate strain'
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=WHOOP+5.0+strap&tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price.',
    sortOrder: 4
  },
  {
    slug: 'garmin-forerunner-265s',
    name: 'Garmin Forerunner 265S',
    category: 'Activity Tracking',
    categoryEmoji: '🏃',
    status: 'current',
    verdict: 'Essential',
    location: 'Running + Sleep',
    image: '/images/gear/garmin-forerunner-265s.jpg',
    shortDescription: 'Lightweight GPS watch with strong reliability, training readiness, and long device lifespan.',
    detailIntro: 'Primary running watch and nightly wearable.',
    details: [
      'I chose the 265S specifically for light weight and sleep wearability.',
      'Garmin device longevity has been excellent in my experience, and this one stays focused when notifications are disabled.',
      'I use it mainly for runs and readiness context, not as a lifestyle smartwatch.'
    ],
    pros: [
      'Comfortable enough to wear overnight',
      'Reliable tracking and battery profile',
      'Good value in Garmin lineup'
    ],
    cons: [
      'Some metrics are less useful for strength contexts',
      'Model naming/positioning can be confusing',
      'Extra features I do not need on this form factor'
    ],
    metrics: [
      { label: 'Miles Logged', value: '265.1 mi' },
      { label: 'Runs Tracked', value: '111' }
    ],
    affiliateUrl: 'https://www.amazon.com/dp/B0BS2F6DJ3?tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price.',
    sortOrder: 5
  },
  {
    slug: 'apple-watch-series-11',
    name: 'Apple Watch Series 11',
    category: 'Activity Tracking',
    categoryEmoji: '🏃',
    status: 'current',
    verdict: 'Great',
    location: 'iOS Integration',
    image: '/images/gear/apple-watch-s11.jpg',
    shortDescription: 'Feature-rich smartwatch with excellent Apple ecosystem integration and broad health tooling.',
    detailIntro: 'Mainstream smartwatch benchmark for iPhone users.',
    details: [
      'Apple Watch remains one of the strongest general-purpose smartwatch platforms for iOS.',
      'Health features and ecosystem fit are excellent, but battery life and cost remain common tradeoffs.',
      'Best fit for users who want both smart features and fitness tracking in one device.'
    ],
    pros: [
      'Excellent iOS ecosystem integration',
      'Strong health/safety feature set',
      'Mature app ecosystem'
    ],
    cons: [
      'Typically requires daily charging',
      'High price compared to focused fitness watches',
      'Best experience depends on iPhone ecosystem'
    ],
    affiliateUrl: 'https://www.amazon.com/dp/B0CK2B118W?tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price.',
    sortOrder: 6
  },
  {
    slug: '8sleep-pod',
    name: '8Sleep Pod',
    category: 'Sleep Tech',
    categoryEmoji: '😴',
    status: 'current',
    verdict: 'Good',
    location: 'Temperature + Tracking',
    image: '/images/gear/8sleep-pod.jpg',
    shortDescription: 'Valuable for temperature control; tracking value improves when correlated with other devices.',
    detailIntro: 'Best used as a temperature system plus one more data source.',
    details: [
      'The biggest value is temperature regulation, not standalone sleep scoring.',
      'I triangulate sleep signals across WHOOP, Garmin, and 8Sleep instead of trusting one stack.',
      'Data flow and API constraints make integration more work than it should be.'
    ],
    pros: [
      'Effective temperature control',
      'Adds another useful signal for sleep correlation',
      'Can improve comfort in hot/cold environments'
    ],
    cons: [
      'Integration and data portability are limited',
      'Tracking can diverge from other devices',
      'High cost for the category'
    ],
    affiliateUrl: 'https://www.amazon.com/s?k=8Sleep+Pod&tag=tobyonfitness-20',
    affiliateLabel: 'Check Price on Amazon',
    affiliateNote: 'Affiliate link available. Purchased at full price.',
    sortOrder: 7
  },
  {
    slug: 'cronometer',
    name: 'Cronometer',
    category: 'Nutrition Logging',
    categoryEmoji: '🥗',
    status: 'current',
    verdict: 'Great',
    location: 'iOS + Android',
    image: '/images/gear/cronometer.jpg',
    shortDescription: 'Nutrition tracking app with strong exportability and micronutrient depth.',
    detailIntro: 'Current daily driver for calorie and macro/micro tracking.',
    details: [
      'Data portability and API access are major reasons it stays in my stack.',
      'It feeds into my broader reporting system alongside other training and recovery tools.',
      'Manual logging adds friction, but data quality and export support are strong.'
    ],
    pros: [
      'Export-friendly data model',
      'Strong micronutrient depth',
      'Works well in custom analytics workflows'
    ],
    cons: [
      'Manual entry is slower than camera-first tools',
      'Long-term app choice still under evaluation'
    ],
    affiliateNote: 'No affiliate relationship with Cronometer.',
    sortOrder: 8
  },
  {
    slug: 'openclaw-m1-mac-mini',
    name: 'OpenClaw on M1 Mac Mini',
    category: 'AI & Tech',
    categoryEmoji: '🤖',
    status: 'current',
    verdict: 'Essential',
    location: 'Self-Hosted',
    image: '/images/gear/openclaw-m1-mac-mini.jpg',
    shortDescription: 'Self-hosted automation and data-correlation stack that ties disconnected fitness tools together.',
    detailIntro: 'The core system behind my multi-device fitness reporting workflow.',
    details: [
      'I use this to unify data from systems that do not naturally interoperate.',
      'The M1 Mac Mini setup has been far more stable and practical than other hardware attempts.',
      'It is powerful but assumes technical comfort, maintenance discipline, and good model/provider choices.'
    ],
    pros: [
      'Bridges fitness data silos',
      'Supports custom connectors and automation',
      'Enables consistent daily reporting workflows'
    ],
    cons: [
      'Setup can be complex for non-technical users',
      'Model/provider quality and cost vary widely',
      'Requires active maintenance'
    ],
    affiliateNote: 'No commercial relationship. This is my actual workflow stack.',
    sortOrder: 9
  },
  {
    slug: 'openclaw-mac-studio',
    name: 'OpenClaw on Mac Studio',
    category: 'AI & Tech',
    categoryEmoji: '🤖',
    status: 'current',
    verdict: 'Essential',
    location: 'Self-Hosted',
    image: '/images/gear/openclaw-mac-studio.jpg',
    shortDescription: 'Higher-power local OpenClaw setup for running heavier local models and parallel workloads.',
    detailIntro: 'My scale-up path when I need more local model headroom than the M1 Mini.',
    details: [
      'This setup is about local performance capacity: more unified memory, stronger sustained throughput, and better concurrency for heavier model runs.',
      'It keeps the same OpenClaw workflow and look/feel as my M1 setup, but gives me room to run bigger local models and additional background tasks.',
      'The tradeoff is cost and power draw, but for advanced self-hosted AI workflows the extra headroom is often worth it.'
    ],
    pros: [
      'More headroom for larger local models',
      'Handles parallel model tasks more comfortably',
      'Same OpenClaw workflow pattern as the M1 setup',
      'Strong sustained performance for long runs'
    ],
    cons: [
      'Higher upfront hardware cost',
      'Higher power usage than the M1 Mini',
      'Still requires active maintenance and tuning'
    ],
    affiliateNote: 'No commercial relationship. This is part of my real self-hosted stack.',
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
