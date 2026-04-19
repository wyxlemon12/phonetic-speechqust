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
      input: `請用兒童發音教學的方式朗讀，逐字清楚示範，字與字之間稍微停頓，每個字都要完整，不要太快，尤其最後一個字不要吞音。<|endofprompt|>${spacedWord}。`,
      speed,
    };
  }

  return { input: trimmed, speed };
}
