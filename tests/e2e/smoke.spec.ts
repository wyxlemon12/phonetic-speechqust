import { expect, test } from '@playwright/test';

test('health endpoint responds ok', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
});

test('tts endpoint fails fast when key is missing', async ({ request }) => {
  const response = await request.post('/api/tts', {
    data: { text: '測試' },
  });

  expect(response.status()).toBe(500);
  await expect(response.json()).resolves.toMatchObject({ error: 'No TTS API Key configured' });
});

test('quick start flow renders core screens', async ({ page }) => {
  await page.goto('/?e2e=1');

  await expect(page.getByTestId('story-adventurer')).toBeVisible();
  await page.getByTestId('quick-start-test').click();

  await expect(page.getByTestId('game-screen')).toBeVisible();
  await page.getByTestId('intro-continue').click();

  await expect(page.getByTestId('story-title')).toBeVisible();
  await expect(page.getByTestId('challenge-word')).toBeVisible();

  await page.getByTestId('nav-library').click();
  await expect(page.getByTestId('library-screen')).toBeVisible();

  await page.getByTestId('nav-medals').click();
  await expect(page.getByTestId('medals-screen')).toBeVisible();
});
