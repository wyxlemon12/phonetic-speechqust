import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTtsInput } from '../src/utils/ttsInput.ts';

test('buildTtsInput keeps normal sentences unchanged', () => {
  assert.equal(buildTtsInput('今天我們一起去冒險'), '今天我們一起去冒險');
});

test('buildTtsInput expands very short practice words with hidden pacing prompt', () => {
  const result = buildTtsInput('竹子');

  assert.match(result, /<\|endofprompt\|>/);
  assert.match(result, /竹子。$/);
  assert.match(result, /慢一點/);
});
