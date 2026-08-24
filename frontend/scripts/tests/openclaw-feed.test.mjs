import assert from 'node:assert/strict';
import test from 'node:test';
import {
  githubRawFallbackUrls,
  githubRequestHeaders,
} from '../../src/lib/openclawFeed.ts';

test('adds authenticated API and jsDelivr fallbacks for GitHub raw feed URLs', () => {
  assert.deepEqual(
    githubRawFallbackUrls('https://raw.githubusercontent.com/example/podcast/main/feed.xml'),
    [
      'https://api.github.com/repos/example/podcast/contents/feed.xml?ref=main',
      'https://raw.githubusercontent.com/example/podcast/main/feed.xml',
      'https://cdn.jsdelivr.net/gh/example/podcast@main/feed.xml',
    ],
  );
});

test('leaves non-GitHub feed URLs unchanged', () => {
  assert.deepEqual(
    githubRawFallbackUrls('https://example.com/feed.xml'),
    ['https://example.com/feed.xml'],
  );
});

test('only sends GitHub authorization to GitHub-owned feed hosts', () => {
  const apiHeaders = githubRequestHeaders(
    'https://api.github.com/repos/example/podcast/commits/main',
    'application/json',
    'feed-test',
    'secret-token',
  );
  const rawHeaders = githubRequestHeaders(
    'https://raw.githubusercontent.com/example/podcast/main/feed.xml',
    'application/xml',
    'feed-test',
    'secret-token',
  );
  const mirrorHeaders = githubRequestHeaders(
    'https://cdn.jsdelivr.net/gh/example/podcast@main/feed.xml',
    'application/xml',
    'feed-test',
    'secret-token',
  );

  assert.equal(apiHeaders.Authorization, 'Bearer secret-token');
  assert.equal(rawHeaders.Authorization, 'Bearer secret-token');
  assert.equal('Authorization' in mirrorHeaders, false);
});
