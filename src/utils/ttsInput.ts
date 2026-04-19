export interface TtsRequestConfig {
  input: string;
  speed: number;
}

function countHanCharacters(text: string) {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

export function buildTtsRequest(text: string, speed = 1.0): TtsRequestConfig {
  const trimmed = text.trim();
  if (!trimmed) {
    return { input: trimmed, speed };
  }

  if (countHanCharacters(trimmed) <= 3) {
    const pausedWord = Array.from(trimmed).map(char => `${char}……`).join('');
    return {
      input: pausedWord,
      speed,
    };
  }

  return { input: trimmed, speed };
}
