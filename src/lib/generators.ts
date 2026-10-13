import type {
  AssimExample,
  Content,
  HangulGroup,
  Lesson,
  ListeningExercise,
  ListeningLevel,
  MinimalSet,
  Word,
} from '../types';
import { contrastTag, similarity } from './hangul';
import type { Progress } from './progress';
import { pick, sample, shuffle, weightedSample } from './utils';

export interface QuizOption {
  value: string;
  label: string;
  /** Text pod možnosťou – vždy viditeľný. */
  sub?: string;
  /** Text, ktorý sa ukáže až po odpovedi (napr. preklad). */
  after?: string;
  tag?: string;
  /** Ak je zadané, po odpovedi sa dá možnosť prehrať (porovnanie). */
  audioText?: string;
  audio?: string;
}

export interface QuizQuestion {
  id: string;
  audioText: string;
  audio?: string;
  rate?: number;
  prompt: string;
  /** Veľký text nad možnosťami (napr. napísaná podoba slova). */
  showText?: string;
  showSub?: string;
  options: QuizOption[];
  answer: string;
  tag?: string;
  itemKey?: string;
  explain?: string;
  area?: import('./progress').Area;
}

const soundWeight = (progress: Progress | undefined, tag?: string) => {
  if (!progress || !tag) return 1;
  const c = progress.sounds[tag];
  if (!c || c.t === 0) return 1.5;
  return 1 + (1 - c.c / c.t) * 4;
};

/* ---------- Tréner výslovnosti ---------- */

export function lessonPool(lesson: Lesson): QuizQuestion[] {
  const pool: QuizQuestion[] = [];
  lesson.comparison.forEach((row, ri) =>
    row.syllables.forEach((s, ci) =>
      pool.push({
        id: `${lesson.id}-r${ri}-${ci}`,
        audioText: s,
        audio: row.audio?.[ci],
        prompt: 'Ktorú slabiku počuješ?',
        options: row.syllables.map((x, i) => ({
          value: x,
          label: x,
          sub: lesson.chars[i],
          tag: lesson.chars[i],
          audioText: x,
          audio: row.audio?.[i],
        })),
        answer: s,
        tag: lesson.chars[ci],
      }),
    ),
  );
  lesson.minimalSets.forEach((set, si) => pool.push(...setQuestions(set, `${lesson.id}-m${si}`)));
  return pool;
}

function setQuestions(set: MinimalSet, prefix: string): QuizQuestion[] {
  return set.items.map((it, ii) => ({
    id: `${prefix}-${ii}`,
    audioText: it.ko,
    audio: it.audio,
    prompt: 'Ktoré slovo počuješ?',
    options: set.items.map((x) => ({
      value: x.ko,
      label: x.ko,
      after: x.sk,
      tag: x.char,
      audioText: x.ko,
      audio: x.audio,
    })),
    answer: it.ko,
    tag: it.char,
    itemKey: `pair:${it.ko}`,
  }));
}

export function lessonQuiz(lesson: Lesson, n = 12, progress?: Progress): QuizQuestion[] {
  return weightedSample(lessonPool(lesson), n, (q) => soundWeight(progress, q.tag));
}

/* ---------- Hangul ---------- */

export function hangulQuiz(group: HangulGroup, n = 10): QuizQuestion[] {
  return sample(group.items, Math.min(n, group.items.length)).map((item) => {
    const others = shuffle(
      group.items.filter(
        (x) =>
          x.char !== item.char &&
          !item.quizExclude?.includes(x.char) &&
          !x.quizExclude?.includes(item.char) &&
          x.sound !== item.sound,
      ),
    ).slice(0, 3);
    return {
      id: `hangul-${item.char}`,
      audioText: item.sound,
      audio: item.audio,
      prompt: 'Ktoré písmeno počuješ?',
      options: shuffle([item, ...others]).map((x) => ({
        value: x.char,
        label: x.char,
        sub: x.rom,
        tag: x.char,
        audioText: x.sound,
        audio: x.audio,
      })),
      answer: item.char,
      tag: item.char,
      explain: `${item.char} (${item.name}) – ${item.slovak}`,
    };
  });
}

/* ---------- Asimilácia ---------- */

export function assimilationQuestion(ex: AssimExample, opts: { options?: number; showWritten?: boolean } = {}): QuizQuestion {
  const n = opts.options ?? 3;
  const choices = shuffle([ex.actual, ...ex.distractors.slice(0, Math.max(1, n - 1))]);
  return {
    id: `assim-${ex.written}`,
    audioText: ex.audioText ?? ex.written,
    audio: ex.audio,
    prompt: opts.showWritten === false ? 'Ako sa to vyslovuje? Vyber, čo počuješ.' : 'Napísané takto – ale ako to znie?',
    showText: opts.showWritten === false ? undefined : ex.written,
    showSub: opts.showWritten === false ? undefined : ex.meaning,
    options: choices.map((c) => ({ value: c, label: `[${c}]`, audioText: c })),
    answer: ex.actual,
    itemKey: `assim:${ex.written}`,
    explain: ex.explanation,
  };
}

export function assimilationQuiz(examples: AssimExample[], n = 8, opts?: { options?: number; showWritten?: boolean }) {
  return sample(examples, n).map((e) => assimilationQuestion(e, opts));
}

/* ---------- Slovná zásoba ---------- */

function distractorWords(word: Word, pool: Word[], n: number, mode: 'random' | 'similar' | 'mixed'): Word[] {
  const others = pool.filter((w) => w.ko !== word.ko && w.sk !== word.sk);
  if (mode === 'random') return sample(others, n);
  const sorted = [...others].sort((a, b) => similarity(word.ko, b.ko) - similarity(word.ko, a.ko));
  if (mode === 'similar') return sorted.slice(0, n);
  const half = Math.ceil(n / 2);
  const sim = sorted.slice(0, half);
  return [...sim, ...sample(others.filter((w) => !sim.includes(w)), n - sim.length)];
}

const modeFor = (levelId?: string) =>
  levelId === 'advanced' ? 'similar' : levelId === 'intermediate' ? 'mixed' : 'random';

export function meaningQuiz(words: Word[], n: number, options = 4, levelId?: string, pool = words): QuizQuestion[] {
  return sample(words, n).map((w) => {
    const ds = distractorWords(w, pool, options - 1, modeFor(levelId));
    return {
      id: `meaning-${w.ko}`,
      audioText: w.ko,
      audio: w.audio,
      prompt: 'Čo znamená slovo, ktoré počuješ?',
      options: shuffle([w, ...ds]).map((x) => ({ value: x.ko, label: x.sk, after: x.ko, audioText: x.ko, audio: x.audio })),
      answer: w.ko,
      itemKey: `word:${w.ko}`,
      explain: `${w.ko} [${w.pron}] – ${w.sk}`,
    };
  });
}

export function wordQuiz(words: Word[], n: number, options = 4, levelId?: string, pool = words): QuizQuestion[] {
  return sample(words, n).map((w) => {
    const ds = distractorWords(w, pool, options - 1, modeFor(levelId));
    return {
      id: `word-${w.ko}`,
      audioText: w.ko,
      audio: w.audio,
      prompt: 'Ktoré slovo počuješ?',
      options: shuffle([w, ...ds]).map((x) => ({ value: x.ko, label: x.ko, after: x.sk, audioText: x.ko, audio: x.audio })),
      answer: w.ko,
      itemKey: `word:${w.ko}`,
      explain: w.pron !== w.ko ? `Vyslovuje sa [${w.pron}].` : undefined,
    };
  });
}

/* ---------- Tréning počúvania ---------- */

export function soundSetQuestions(sets: string[][], n: number, progress?: Progress): QuizQuestion[] {
  const pool = sets.flatMap((set, si) =>
    set.map((s, i) => ({
      id: `snd-${si}-${i}`,
      audioText: s,
      prompt: 'Ktorú slabiku počuješ?',
      options: set.map((x) => ({ value: x, label: x, tag: contrastTag(set, x), audioText: x })),
      answer: s,
      tag: contrastTag(set, s),
    })),
  );
  return weightedSample(pool, n, (q) => soundWeight(progress, q.tag));
}

export function listeningQuiz(
  ex: ListeningExercise,
  level: ListeningLevel,
  content: Content,
  progress?: Progress,
): QuizQuestion[] {
  const n = level.questions;
  const words = content.vocabulary.categories
    .filter((c) => !ex.categories || ex.categories.includes(c.id))
    .flatMap((c) => c.words);
  let qs: QuizQuestion[] = [];

  switch (ex.type) {
    case 'sounds':
      qs = soundSetQuestions(content.listening.soundSets[level.id] ?? Object.values(content.listening.soundSets)[0], n, progress);
      break;
    case 'words':
      qs = wordQuiz(words, n, level.options, level.id);
      break;
    case 'meaning':
      qs = meaningQuiz(words, n, level.options, level.id);
      break;
    case 'pairs': {
      const pool = content.pronunciation.lessons
        .filter((l) => !ex.lessons || ex.lessons.includes(l.id))
        .flatMap((l) => l.minimalSets.flatMap((s, si) => setQuestions(s, `${l.id}-m${si}`)));
      qs = weightedSample(pool, n, (q) => soundWeight(progress, q.tag));
      // pokročilým sa zamieša poradie možností – nemôžu sa spoliehať na poradie ㄱ ㄲ ㅋ
      if (level.id === 'advanced') qs = qs.map((q) => ({ ...q, options: shuffle(q.options) }));
      break;
    }
    case 'assimilation': {
      const examples = content.assimilation.rules
        .filter((r) => !ex.rules || ex.rules.includes(r.id))
        .flatMap((r) => r.examples);
      qs = assimilationQuiz(examples, n, { options: level.options, showWritten: level.showWritten });
      break;
    }
  }
  return qs.map((q) => ({ ...q, rate: level.rate }));
}

/* ---------- Denný tréning ---------- */

export function dailyMix(content: Content, progress: Progress): QuizQuestion[] {
  const lessonQs = weightedSample(
    content.pronunciation.lessons.flatMap(lessonPool),
    7,
    (q) => soundWeight(progress, q.tag) ** 2,
  ).map((q) => ({ ...q, area: 'pronunciation' as const }));

  const assimExamples = content.assimilation.rules.flatMap((r) => r.examples);
  const assimQs = weightedSample(assimExamples, 3, (e) => {
    const c = progress.items[`assim:${e.written}`];
    return c ? 1 + (1 - c.c / c.t) * 3 : 2;
  }).map((e) => ({ ...assimilationQuestion(e, { options: 3 }), area: 'assimilation' as const }));

  const words = content.vocabulary.categories.flatMap((c) => c.words);
  const wordQs = meaningQuiz(
    weightedSample(words, 3, (w) => {
      const c = progress.items[`word:${w.ko}`];
      return c ? 1 + (1 - c.c / c.t) * 3 : 2;
    }),
    3,
    4,
    'intermediate',
    words,
  ).map((q) => ({ ...q, area: 'vocabulary' as const }));

  return shuffle([...lessonQs, ...assimQs, ...wordQs]);
}

/** Náhodný kontrolný pár pre cvičenie „rovnaké alebo rozdielne“. */
export function sameDifferentRound<T extends { text: string }>(groups: T[][]): { a: T; b: T; same: boolean } {
  const g = pick(groups.filter((x) => x.length >= 2));
  const a = pick(g);
  const same = Math.random() < 0.4;
  const b = same ? a : pick(g.filter((x) => x.text !== a.text));
  return { a, b, same };
}
