import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTtsRequest } from '../src/utils/ttsInput.ts';

test('buildTtsRequest keeps normal sentences unchanged', () => {
  const result = buildTtsRequest('今天我們一起去冒險', 1.0);

  assert.equal(result.input, '今天我們一起去冒險');
  assert.equal(result.speed, 1.0);
});

test('buildTtsRequest expands very short practice words with comma pacing', () => {
  const result = buildTtsRequest('竹子', 1.0);

  assert.equal(result.input, '竹，子，');
  assert.equal(result.speed, 1.0);
});
