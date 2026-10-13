const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export interface Jamo {
  initial: string;
  medial: string;
  final: string;
}

export function decompose(syllable: string): Jamo | null {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (Number.isNaN(code) || code < 0 || code > 11171) return null;
  return {
    initial: INITIALS[Math.floor(code / 588)],
    medial: MEDIALS[Math.floor((code % 588) / 28)],
    final: FINALS[code % 28],
  };
}

export function jamoList(word: string): string[] {
  const out: string[] = [];
  for (const ch of word) {
    const j = decompose(ch);
    if (j) out.push(j.initial, j.medial, ...(j.final ? [j.final] : []));
  }
  return out;
}

/**
 * Pre množinu podobných slabík vráti zvuk (jamo), ktorým sa `item` od ostatných líši.
 * Napr. contrastTag(["가","까","카"], "까") === "ㄲ".
 */
export function contrastTag(set: string[], item: string): string | undefined {
  const chars = [...item];
  for (let i = 0; i < chars.length; i++) {
    const mine = decompose(chars[i]);
    const parts = set.map((s) => decompose([...s][i] ?? ''));
    if (!mine || parts.some((p) => !p)) continue;
    for (const key of ['initial', 'medial', 'final'] as const) {
      if (parts.some((p) => p![key] !== mine[key])) return mine[key] || undefined;
    }
  }
  return undefined;
}

/** Hrubá podobnosť dvoch kórejských slov (na výber zradných možností). */
export function similarity(a: string, b: string): number {
  if (a === b) return -1;
  const ja = jamoList(a);
  const jb = jamoList(b);
  let score = 0;
  const n = Math.min(ja.length, jb.length);
  for (let i = 0; i < n; i++) if (ja[i] === jb[i]) score += 2;
  const setB = new Set(jb);
  ja.forEach((j) => {
    if (setB.has(j)) score += 1;
  });
  if ([...a].length === [...b].length) score += 3;
  return score;
}
