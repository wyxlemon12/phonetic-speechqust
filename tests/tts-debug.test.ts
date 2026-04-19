import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTtsRequest } from '../src/utils/ttsInput.ts';

test('short-word TTS debug input stays inspectable and deterministic', () => {
  const request = buildTtsRequest('竹子', 1.0);

  assert.equal(request.input, '竹……子……');
  assert.equal(request.speed, 1.0);
});
