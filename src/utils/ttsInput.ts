function countHanCharacters(text: string) {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

export function buildTtsInput(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  if (countHanCharacters(trimmed) <= 3) {
    return `請用更慢一點、更完整的方式清楚朗讀這個詞。<|endofprompt|>${trimmed}。`;
  }

  return trimmed;
}
