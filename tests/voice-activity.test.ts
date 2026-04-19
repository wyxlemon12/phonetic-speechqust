import test from 'node:test';
import assert from 'node:assert/strict';

import { detectSpeechFromLevel, normalizeAudioLevel } from '../src/utils/voiceActivity.ts';

test('normalizeAudioLevel returns higher values for stronger waveforms', () => {
  const silentFrame = new Uint8Array([128, 128, 128, 128]);
  const voicedFrame = new Uint8Array([128, 180, 80, 150]);

  assert.equal(normalizeAudioLevel(silentFrame), 0);
  assert.ok(normalizeAudioLevel(voicedFrame) > 0.1);
});

test('detectSpeechFromLevel rejects silent attempts and accepts spoken attempts', () => {
  assert.equal(detectSpeechFromLevel(0), false);
  assert.equal(detectSpeechFromLevel(0.01), false);
  assert.equal(detectSpeechFromLevel(0.08), true);
});
