import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEvaluationPrompt } from '../src/utils/speechFeedbackPrompt.ts';

test('evaluation prompt keeps Xingbao identity and teacher-like guidance constraints', () => {
  const prompt = buildEvaluationPrompt('獅子', 'shi zi');

  assert.match(prompt, /星寶/);
  assert.match(prompt, /像老師一樣/);
  assert.match(prompt, /避免使用老師自稱或老師口吻句式/);
});

test('evaluation prompt explicitly guards against overfitted template feedback', () => {
  const prompt = buildEvaluationPrompt('前後鼻音', 'qian hou bi yin');

  assert.match(prompt, /不要把回饋寫成固定模板/);
  assert.match(prompt, /只根據這次實際聽到的問題作答/);
  assert.match(prompt, /每次只抓最關鍵的 1 到 2 個問題/);
  assert.match(prompt, /如果是聽不清楚，就明確說星寶這次沒有聽清/);
  assert.match(prompt, /避免每次都重複使用同一類句子/);
  assert.match(prompt, /heardText/);
  assert.match(prompt, /confidence/);
});
