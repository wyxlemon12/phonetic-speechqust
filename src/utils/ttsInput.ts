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
    const spacedWord = Array.from(trimmed).join(' ');
    return {
      input: `請清楚、放慢一些，把每個字都讀完整，尤其最後一個字不要吞音。<|endofprompt|>${spacedWord}。`,
      speed,
    };
  }

  return { input: trimmed, speed };
}
