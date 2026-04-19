import { Mistake, WordChallenge } from '../types';

export function didPassAttempt(result: { isCorrect: boolean; score: number }) {
  return result.isCorrect && result.score >= 50;
}

export function buildPracticeRecord(args: {
  challenge: Pick<WordChallenge, 'id' | 'word' | 'pinyin' | 'hint' | 'instruction'>;
  feedback: string;
  score?: number;
  passed: boolean;
}): Mistake {
  return {
    id: `${args.challenge.id}-${Date.now()}`,
    word: args.challenge.word,
    pinyin: args.challenge.pinyin,
    hint: args.challenge.hint,
    instruction: args.challenge.instruction,
    feedback: args.feedback,
    score: args.score,
    passed: args.passed,
    timestamp: Date.now(),
  };
}

export function getAnalysisRecords(records: Mistake[]) {
  return records.filter((record) => !record.passed);
}
