# Phonetic SpeechQuest

Interactive Mandarin pronunciation adventure app for children, combining story-based practice, AI speech evaluation, guided feedback from Xingbao, and TTS playback.

## Features

- Story-driven pronunciation practice
- AI evaluation for target words and syllables
- Teacher-like feedback in Xingbao's voice and style
- TTS playback for story segments and target words
- Practice history with hints, feedback, and retry tracking
- Playwright smoke tests for local CI verification

## Tech Stack

- React 19
- Vite
- TypeScript
- Express
- Google Gemini API
- SiliconFlow TTS
- Playwright

## Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
SILICONFLOW_API_KEY=your_siliconflow_api_key
PORT=3001
```

Optional:

```env
SILICONFLOW_TTS_URL=https://api.siliconflow.cn/v1/audio/speech
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3001
```

## Testing

Type check:

```bash
npm run lint
```

Run Playwright smoke tests:

```bash
npm run test:e2e
```

## Vercel Deployment

This project includes:

- `vercel.json` for SPA rewrites and API routing
- `api/index.ts` as the serverless function entry

### Deploy from GitHub

1. Import the GitHub repository into Vercel
2. Set these environment variables in Vercel project settings:
   - `GEMINI_API_KEY`
   - `SILICONFLOW_API_KEY`
   - `SILICONFLOW_TTS_URL` (optional)
3. Deploy

### Deploy with Vercel CLI

```bash
npx vercel
```

For production:

```bash
npx vercel --prod
```

## Notes

- Silent or near-silent attempts are blocked before AI evaluation when local speech activity detection fails.
- Very short TTS inputs are expanded with pacing guidance to reduce clipped endings.
- Evaluation debug data can be inspected in the browser console and in local storage when enabled by the current flow.

## Repository

GitHub:

[https://github.com/wyxlemon12/phonetic-speechqust](https://github.com/wyxlemon12/phonetic-speechqust)
