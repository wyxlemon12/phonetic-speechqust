import test from 'node:test';
import assert from 'node:assert/strict';

test('generateSpeech logs upstream error details when /api/tts fails', async () => {
  const warnings: string[] = [];
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '));
  };

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ error: 'SiliconFlow failed', details: 'Api key is invalid' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    )) as typeof fetch;

  try {
    const { generateSpeech } = await import('../src/services/geminiService.ts');
    const result = await generateSpeech(`測試-${Date.now()}`);

    assert.equal(result, null);
    assert.ok(
      warnings.some((warning) => warning.includes('Api key is invalid')),
      `Expected warning to include upstream details, got: ${warnings.join('\n')}`,
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});
