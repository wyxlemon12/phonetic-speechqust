export function normalizeAudioLevel(samples: Uint8Array) {
  if (samples.length === 0) return 0;

  let sum = 0;
  for (const sample of samples) {
    const centered = (sample - 128) / 128;
    sum += centered * centered;
  }

  return Math.sqrt(sum / samples.length);
}

export function detectSpeechFromLevel(level: number, threshold = 0.035) {
  return level >= threshold;
}
