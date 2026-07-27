import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPodcastMetaDescription,
  sanitizePodcastSummary,
} from '../../src/lib/podcastMeta.ts';

const episode26Description = `[00:00] INTRO / HOOK
OpenClaw 2026.4.8 drops a unified inference layer, session checkpointing,
and a restored memory stack. Anthropic's Glasswing coalition, MegaTrain's
single-GPU frontier training, and AI writing research round out the episode.
[02:00] STORY 1 - OpenClaw 2026.4.8`;

test('removes timestamp headings and produces a bounded episode summary', () => {
  const summary = buildPodcastMetaDescription({
    title: 'Episode 26: OpenClaw Gets a Brain Transplant',
    description: episode26Description,
  });

  assert.ok(summary.length >= 120);
  assert.ok(summary.length <= 160);
  assert.doesNotMatch(summary, /\[\d{1,2}:\d{2}\]/);
  assert.doesNotMatch(summary, /INTRO|STORY 1/);
});

test('prefers structured feed descriptions from new show notes', () => {
  const summary = buildPodcastMetaDescription({
    title: 'Episode 94: A Long Episode Title',
    description: '[00:00] INTRO / HOOK\nRaw timestamped notes.',
    showNotes: `# AgentStack Daily

**Feed description:** OpenClaw and Codex ship practical agent updates, while new MCP tooling and local inference releases change how builders run daily workflows.

## Show Notes
Full notes follow.`,
  });

  assert.equal(
    summary,
    'OpenClaw and Codex ship practical agent updates, while new MCP tooling and local inference releases change how builders run daily workflows.',
  );
});

test('removes markdown, transcript labels, and raw URLs', () => {
  const summary = sanitizePodcastSummary(`\`\`\`md
## Show Notes
[00:00] INTRO / HOOK
The release adds safer agent sessions and clearer recovery controls.
Show notes: https://tobyonfitnesstech.com/podcasts/episode-55/
\`\`\``);

  assert.equal(
    summary,
    'The release adds safer agent sessions and clearer recovery controls.',
  );
});
