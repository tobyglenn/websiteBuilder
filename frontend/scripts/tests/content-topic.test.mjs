import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyContentTopic } from '../../src/lib/contentTopic.js';

test('keeps explicit AgentStack content in the AgentStack path', () => {
  assert.equal(
    classifyContentTopic('OpenClaw fitness reports for Garmin, WHOOP, and Speediance'),
    'agentstack',
  );
});

test('prefers product and training topics over generic AI wording', () => {
  assert.equal(
    classifyContentTopic('Speediance Gym Monster 2S AI smart gym review'),
    'speediance',
  );
  assert.equal(
    classifyContentTopic('WHOOP recovery with an AI-generated summary'),
    'wearables',
  );
  assert.equal(
    classifyContentTopic('BJJ black belt AI match analysis'),
    'bjj',
  );
});

test('uses the AgentStack path for generic Claude and Anthropic content', () => {
  assert.equal(classifyContentTopic('Anthropic Claude refund policy'), 'agentstack');
  assert.equal(classifyContentTopic('Weekly strength training plan'), 'training');
});
