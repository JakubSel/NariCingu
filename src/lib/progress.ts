import { createStore } from './store';

export type Area = 'pronunciation' | 'listening' | 'assimilation' | 'vocabulary' | 'hangul';

export interface Counter {
  c: number; // správne
  t: number; // spolu
}

export interface SessionStat {
  title: string;
  best: number; // percentá
  last: number;
  attempts: number;
  lastAt: number;
}

export interface RecentItem {
  key: string;
  title: string;
  subtitle?: string;
  path: string;
  at: number;
}

export interface Progress {
  v: 1;
  /** Úspešnosť podľa zvuku (jamo), napr. "ㄱ". */
  sounds: Record<string, Counter>;
  /** Zámeny "očakávané>zvolené", napr. "ㄱ>ㄲ". */
  confusions: Record<string, number>;
  areas: Record<string, Counter>;
  /** Úspešnosť jednotlivých položiek (slová, príklady asimilácie). */
  items: Record<string, Counter>;
  sessions: Record<string, SessionStat>;
  recent: RecentItem[];
  /** Počet odpovedí za deň (YYYY-MM-DD). */
  days: Record<string, number>;
  /** Pozreté položky (napr. znaky Hangul). */
  seen: Record<string, number>;
}

const empty = (): Progress => ({
  v: 1,
  sounds: {},
  confusions: {},
  areas: {},
  items: {},
  sessions: {},
  recent: [],
  days: {},
  seen: {},
});

export const progressStore = createStore<Progress>('naricingu:progress:v1', empty);
export const useProgress = progressStore.use;

export function dayKey(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const inc = (c: Counter | undefined, ok: boolean): Counter => ({
  c: (c?.c ?? 0) + (ok ? 1 : 0),
  t: (c?.t ?? 0) + 1,
});

export interface AnswerRecord {
  area: Area;
  correct: boolean;
  expectedTag?: string;
  chosenTag?: string;
  itemKey?: string;
}

export function recordAnswer(a: AnswerRecord) {
  progressStore.set((s) => {
    const today = dayKey();
    const next: Progress = {
      ...s,
      areas: { ...s.areas, [a.area]: inc(s.areas[a.area], a.correct) },
      days: { ...s.days, [today]: (s.days[today] ?? 0) + 1 },
    };
    if (a.expectedTag) {
      next.sounds = { ...s.sounds, [a.expectedTag]: inc(s.sounds[a.expectedTag], a.correct) };
      if (!a.correct && a.chosenTag && a.chosenTag !== a.expectedTag) {
        const k = `${a.expectedTag}>${a.chosenTag}`;
        next.confusions = { ...s.confusions, [k]: (s.confusions[k] ?? 0) + 1 };
      }
    }
    if (a.itemKey) next.items = { ...s.items, [a.itemKey]: inc(s.items[a.itemKey], a.correct) };
    return next;
  });
}

export function recordSession(key: string, title: string, correct: number, total: number) {
  if (!total) return;
  const pct = Math.round((correct / total) * 100);
  progressStore.set((s) => {
    const prev = s.sessions[key];
    return {
      ...s,
      sessions: {
        ...s.sessions,
        [key]: {
          title,
          best: Math.max(prev?.best ?? 0, pct),
          last: pct,
          attempts: (prev?.attempts ?? 0) + 1,
          lastAt: Date.now(),
        },
      },
    };
  });
}

export function visit(item: Omit<RecentItem, 'at'>) {
  progressStore.set((s) => ({
    ...s,
    recent: [{ ...item, at: Date.now() }, ...s.recent.filter((r) => r.key !== item.key)].slice(0, 12),
  }));
}

/** Aktivita bez hodnotenia (napr. písanie) – počíta sa do dnešnej aktivity a série dní. */
export function recordPractice(key: string) {
  progressStore.set((s) => {
    const today = dayKey();
    return {
      ...s,
      days: { ...s.days, [today]: (s.days[today] ?? 0) + 1 },
      seen: { ...s.seen, [key]: Date.now() },
    };
  });
}

export function markSeen(key: string) {
  if (progressStore.get().seen[key]) return;
  progressStore.set((s) => ({ ...s, seen: { ...s.seen, [key]: Date.now() } }));
}

export function accuracy(c?: Counter): number | null {
  return c && c.t > 0 ? Math.round((c.c / c.t) * 100) : null;
}

export function streak(p: Progress): number {
  let n = 0;
  const d = new Date();
  // dnes sa ešte nemuselo cvičiť – séria sa tým nepreruší
  if (!p.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (p.days[dayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Zvuky zoradené od najslabšieho (aspoň `min` pokusov, úspešnosť pod 90 %). */
export function weakSounds(p: Progress, min = 3) {
  return Object.entries(p.sounds)
    .filter(([, c]) => c.t >= min)
    .map(([tag, c]) => ({ tag, acc: Math.round((c.c / c.t) * 100), total: c.t }))
    .filter((x) => x.acc < 90)
    .sort((a, b) => a.acc - b.acc);
}

export function topConfusions(p: Progress, filter?: (expected: string) => boolean, limit = 5) {
  return Object.entries(p.confusions)
    .map(([k, n]) => {
      const [expected, chosen] = k.split('>');
      return { expected, chosen, n };
    })
    .filter((x) => !filter || filter(x.expected))
    .sort((a, b) => b.n - a.n)
    .slice(0, limit);
}
