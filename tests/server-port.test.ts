import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('dev server reads PORT from .env on startup', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const cwd = path.resolve(__dirname, '..');
  const envFilePath = path.join(cwd, '.env.test-port');
  const testPort = '3911';
  const env = { ...process.env };
  delete env.PORT;
  env.DOTENV_CONFIG_PATH = envFilePath;

  await fs.writeFile(envFilePath, `PORT=${testPort}\n`, 'utf8');

  const child = spawn('node', ['--import', 'tsx', 'server.ts'], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    const output = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Timed out waiting for server startup'));
      }, 20_000);

      const onData = (chunk: Buffer) => {
        const text = chunk.toString();
        if (text.includes('Server running on')) {
          clearTimeout(timer);
          child.stdout.off('data', onData);
          child.stderr.off('data', onData);
          child.kill();
          resolve(text);
        }
      };

      child.stdout.on('data', onData);
      child.stderr.on('data', onData);
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on('exit', (code) => {
        if (code && code !== 0) {
          clearTimeout(timer);
          reject(new Error(`Server exited early with code ${code}`));
        }
      });
    });

    assert.match(output, new RegExp(`http://localhost:${testPort}`));
  } finally {
    await fs.rm(envFilePath, { force: true });
  }
});
