import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePodcastHtml } from '../../src/lib/podcastHtml.mjs';

test('imported podcast headings and unfinished citations retain their text without broken links', () => {
  const html = preparePodcastHtml('<h1 id="intro">आज &amp; tomorrow</h1><p><a href="...">Research</a> and <a href="%E8%A7%84%E5%88%92">source text</a>.</p>');
  assert.equal(html, '<h2 id="intro">आज &amp; tomorrow</h2><p><span>Research</span> and <span>source text</span>.</p>');
});

test('working source links, episode links and timestamp anchors remain usable', () => {
  const html = '<p><a href="https://example.org/paper?q=a&amp;b=c">Paper</a><a href="/podcasts/episode-81/">Episode</a><a href="#intro">Intro</a></p>';
  assert.equal(preparePodcastHtml(html), html);
});

test('relative documents resolve against the public source instead of the website', () => {
  assert.equal(
    preparePodcastHtml('<a href="../show_notes/episode_081.md#sources">Notes</a>', 'https://example.org/transcripts/episode_081.md'),
    '<a href="https://example.org/show_notes/episode_081.md#sources">Notes</a>',
  );
});
