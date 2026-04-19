import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';

test('server forwards TTS requests to SiliconFlow CN endpoint', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiKey = process.env.SILICONFLOW_API_KEY;
  const originalVercel = process.env.VERCEL;
  const originalFetch = globalThis.fetch;

  process.env.NODE_ENV = 'test';
  process.env.SILICONFLOW_API_KEY = 'sk-test';
  process.env.VERCEL = '1';

  let requestedUrl = '';

  globalThis.fetch = (async (input: URL | RequestInfo) => {
    requestedUrl = String(input);
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  }) as typeof fetch;

  try {
    const { default: handler } = await import('../api/index.ts');

    const app = express();
    app.use((req, res) => handler(req as any, res as any));

    const server = await new Promise<import('node:http').Server>((resolve) => {
      const instance = createServer(app).listen(0, '127.0.0.1', () => resolve(instance));
    });

    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Could not resolve test server address');
      }

      const response = await originalFetch(`http://127.0.0.1:${address.port}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '你好，小朋友' }),
      });

      assert.equal(response.status, 200);
      assert.equal(requestedUrl, 'https://api.siliconflow.cn/v1/audio/speech');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
    process.env.SILICONFLOW_API_KEY = originalApiKey;
    process.env.VERCEL = originalVercel;
  }
});
