// Public account identities verified against the BJJ Shorts publishing workflow.
// Keep personal and company LinkedIn identities distinct in structured data.
export const socialProfiles = [
  {
    id: 'youtube', label: 'YouTube', handle: '@tobyonfitness',
    href: 'https://www.youtube.com/@tobyonfitness',
    description: 'Full videos, fitness tech reviews, and training stories.',
    identities: ['person', 'organization'],
  },
  {
    id: 'tiktok', label: 'TikTok', handle: '@tobyonfitness',
    href: 'https://www.tiktok.com/@tobyonfitness',
    description: 'Short clips from my training, BJJ, and fitness tech videos.',
    identities: ['person', 'organization'],
  },
  {
    id: 'instagram', label: 'Instagram', handle: '@tobyonfitness',
    href: 'https://www.instagram.com/tobyonfitness',
    description: 'Reels and updates from my training and fitness tech journey.',
    identities: ['person', 'organization'],
  },
  {
    id: 'facebook', label: 'Facebook — Toby On Fitness Tech', handle: 'Facebook page',
    href: 'https://www.facebook.com/profile.php?id=61583662221886',
    description: 'The Toby On Fitness Tech page for Reels and video updates.',
    identities: ['organization'],
  },
  {
    id: 'x', label: 'X', handle: '@tobyglenn',
    href: 'https://x.com/tobyglenn',
    description: 'Short videos, project updates, and conversation.',
    identities: ['person', 'organization'],
  },
  {
    id: 'linkedin', label: 'LinkedIn — Toby Peters', handle: 'Personal profile',
    href: 'https://www.linkedin.com/in/tobyglenn/',
    description: 'My personal profile, professional work, and video posts.',
    identities: ['person'],
  },
  {
    id: 'linkedin_page', label: 'LinkedIn — TobyOnFitnessTech', handle: 'Company page',
    href: 'https://www.linkedin.com/company/tobyonfitnesstech/',
    description: 'The TobyOnFitnessTech page for brand updates and videos.',
    identities: ['organization'],
  },
];

export const personSocialUrls = socialProfiles
  .filter((profile) => profile.identities.includes('person'))
  .map((profile) => profile.href);

export const organizationSocialUrls = socialProfiles
  .filter((profile) => profile.identities.includes('organization'))
  .map((profile) => profile.href);
