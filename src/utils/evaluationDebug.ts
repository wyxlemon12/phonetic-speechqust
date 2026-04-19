export const EVALUATION_DEBUG_STORAGE_KEY = 'xingbao_evaluation_debug_log';

export interface EvaluationDebugResult {
  isCorrect: boolean;
  score: number;
  heardText?: string;
  confidence?: number;
  feedback: string;
  simplifiedFeedback: string;
}

export interface EvaluationDebugEntry {
  id: string;
  timestamp: number;
  targetWord: string;
  targetPinyin?: string;
  audioBase64Length: number;
  result: EvaluationDebugResult;
  error?: string;
}

export function buildEvaluationDebugEntry(args: {
  targetWord: string;
  targetPinyin?: string;
  audioBase64Length: number;
  result: EvaluationDebugResult;
  error?: string;
}): EvaluationDebugEntry {
  const timestamp = Date.now();

  return {
    id: `${args.targetWord}-${timestamp}`,
    timestamp,
    targetWord: args.targetWord,
    targetPinyin: args.targetPinyin,
    audioBase64Length: args.audioBase64Length,
    result: args.result,
    error: args.error,
  };
}

export function trimEvaluationDebugLog<T>(entries: T[], maxEntries = 20) {
  return entries.slice(-maxEntries);
}

export function persistEvaluationDebugEntry(entry: EvaluationDebugEntry) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const current = window.localStorage.getItem(EVALUATION_DEBUG_STORAGE_KEY);
  const parsed: EvaluationDebugEntry[] = current ? JSON.parse(current) : [];
  const next = trimEvaluationDebugLog([...parsed, entry]);
  window.localStorage.setItem(EVALUATION_DEBUG_STORAGE_KEY, JSON.stringify(next));
}
