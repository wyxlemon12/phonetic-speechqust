import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTtsRequest } from '../src/utils/ttsInput.ts';

test('buildTtsRequest keeps normal sentences unchanged', () => {
  const result = buildTtsRequest('今天我們一起去冒險', 1.0);

  assert.equal(result.input, '今天我們一起去冒險');
  assert.equal(result.speed, 1.0);
});

test('buildTtsRequest expands very short practice words with pacing prompt and slower speed', () => {
  const result = buildTtsRequest('竹子', 1.0);

  assert.match(result.input, /<\|endofprompt\|>/);
  assert.match(result.input, /竹 子。$/);
  assert.match(result.input, /最後一個字不要吞音/);
  assert.equal(result.speed, 0.82);
});
