import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPracticeRecord,
  didPassAttempt,
  getAnalysisRecords,
} from '../src/utils/practiceSession.ts';

test('didPassAttempt only passes when isCorrect is true and score is at least 50', () => {
  assert.equal(didPassAttempt({ isCorrect: true, score: 80 }), true);
  assert.equal(didPassAttempt({ isCorrect: true, score: 50 }), true);
  assert.equal(didPassAttempt({ isCorrect: true, score: 49 }), false);
  assert.equal(didPassAttempt({ isCorrect: false, score: 90 }), false);
  assert.equal(didPassAttempt({ isCorrect: false, score: 0 }), false);
});

test('buildPracticeRecord keeps prompt details for every completed challenge', () => {
  const record = buildPracticeRecord({
    challenge: {
      id: 'c-1',
      word: '獅子',
      pinyin: 'shi zi',
      hint: '舌尖往後捲一些',
      instruction: '先慢慢讀，再連讀',
    },
    feedback: '再把舌尖抬高一點',
    score: 48,
    passed: false,
  });

  assert.equal(record.word, '獅子');
  assert.equal(record.pinyin, 'shi zi');
  assert.equal(record.hint, '舌尖往後捲一些');
  assert.equal(record.instruction, '先慢慢讀，再連讀');
  assert.equal(record.feedback, '再把舌尖抬高一點');
  assert.equal(record.score, 48);
  assert.equal(record.passed, false);
  assert.ok(typeof record.timestamp === 'number');
});

test('getAnalysisRecords only returns failed attempts for weakness analysis', () => {
  const records = [
    {
      id: '1',
      word: '獅子',
      hint: 'h1',
      instruction: 'i1',
      feedback: 'f1',
      passed: false,
      timestamp: 1,
    },
    {
      id: '2',
      word: '竹子',
      hint: 'h2',
      instruction: 'i2',
      feedback: 'f2',
      passed: true,
      timestamp: 2,
    },
  ];

  assert.deepEqual(getAnalysisRecords(records).map((item) => item.id), ['1']);
});
