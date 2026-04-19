import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEvaluationDebugEntry, trimEvaluationDebugLog } from '../src/utils/evaluationDebug.ts';

test('buildEvaluationDebugEntry keeps the fields needed for monitoring', () => {
  const entry = buildEvaluationDebugEntry({
    targetWord: '能量',
    targetPinyin: 'neng liang',
    audioBase64Length: 1234,
    result: {
      isCorrect: false,
      score: 42,
      heardText: '能亮',
      confidence: 0.61,
      feedback: '星寶這次先幫你調整後鼻音。',
      simplifiedFeedback: '星寶聽到後鼻音還不夠穩。',
    },
  });

  assert.equal(entry.targetWord, '能量');
  assert.equal(entry.targetPinyin, 'neng liang');
  assert.equal(entry.audioBase64Length, 1234);
  assert.equal(entry.result.score, 42);
  assert.equal(entry.result.heardText, '能亮');
  assert.equal(entry.result.confidence, 0.61);
  assert.ok(typeof entry.timestamp === 'number');
});

test('trimEvaluationDebugLog keeps the newest monitoring entries only', () => {
  const entries = Array.from({ length: 30 }, (_, index) => ({
    id: `entry-${index}`,
    timestamp: index,
  }));

  const trimmed = trimEvaluationDebugLog(entries, 20);

  assert.equal(trimmed.length, 20);
  assert.equal(trimmed[0].id, 'entry-10');
  assert.equal(trimmed[19].id, 'entry-29');
});

test('buildEvaluationDebugEntry can store evaluation errors for silent or failed attempts', () => {
  const entry = buildEvaluationDebugEntry({
    targetWord: '能量',
    audioBase64Length: 0,
    result: {
      isCorrect: false,
      score: 0,
      heardText: '',
      confidence: 0,
      feedback: '星寶這次沒有聽清楚，請再讀一次。',
      simplifiedFeedback: '星寶沒有聽清。',
    },
    error: 'Audio was empty',
  });

  assert.equal(entry.audioBase64Length, 0);
  assert.equal(entry.error, 'Audio was empty');
});
