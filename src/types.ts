// Typy zodpovedajú štruktúre JSON súborov v public/data/.
// Voliteľné pole `audio` = cesta k nahrávke (napr. "audio/ga.mp3"). Ak chýba, použije sa syntéza reči.

export interface Example {
  ko: string;
  rom?: string;
  sk: string;
  audio?: string;
}

export interface HangulItem {
  char: string;
  name: string;
  nameRom?: string;
  rom: string;
  sound: string;
  audio?: string;
  explanation: string;
  slovak: string;
  tip?: string;
  quizExclude?: string[];
  examples: Example[];
}

export interface HangulGroup {
  id: string;
  title: string;
  description: string;
  items: HangulItem[];
}

export interface HangulData {
  groups: HangulGroup[];
}

export interface Feature {
  label: string;
  value: number; // 0–3
}

export interface SoundProfile {
  char: string;
  label: string;
  slovak: string;
  pitch?: string;
  features: Feature[];
}

export interface TheorySection {
  heading: string;
  text: string;
}

export interface ComparisonRow {
  syllables: string[];
  audio?: string[];
}

export interface PairItem {
  ko: string;
  sk: string;
  char: string;
  audio?: string;
}

export interface MinimalSet {
  items: PairItem[];
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  chars: string[];
  summary: string;
  theory: TheorySection[];
  profiles: SoundProfile[];
  tips: string[];
  comparison: ComparisonRow[];
  minimalSets: MinimalSet[];
}

export interface PronunciationData {
  lessons: Lesson[];
}

export interface AssimExample {
  written: string;
  meaning: string;
  naive: string;
  actual: string;
  actualRom: string;
  explanation: string;
  distractors: string[];
  audioText?: string;
  audio?: string;
}

export interface AssimRule {
  id: string;
  title: string;
  korean: string;
  short: string;
  explanation: string;
  pattern: string[];
  examples: AssimExample[];
}

export interface AssimilationData {
  intro: string;
  rules: AssimRule[];
}

export interface Word {
  ko: string;
  sk: string;
  pron: string;
  rom: string;
  audio?: string;
  note?: string;
  example: { ko: string; sk: string; audio?: string };
}

export interface VocabCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  words: Word[];
}

export interface VocabularyData {
  categories: VocabCategory[];
}

export interface ListeningLevel {
  id: string;
  title: string;
  description: string;
  options: number;
  rate: number;
  questions: number;
  showWritten: boolean;
}

export type ExerciseType = 'sounds' | 'words' | 'meaning' | 'pairs' | 'assimilation';

export interface ListeningExercise {
  id: string;
  type: ExerciseType;
  title: string;
  description: string;
  icon: string;
  /** Voliteľné obmedzenie na kategórie slovnej zásoby (pre typ words/meaning). */
  categories?: string[];
  /** Voliteľné obmedzenie na pravidlá asimilácie. */
  rules?: string[];
  /** Voliteľné obmedzenie na lekcie trénera (pre typ pairs). */
  lessons?: string[];
}

export interface ListeningData {
  levels: ListeningLevel[];
  exercises: ListeningExercise[];
  soundSets: Record<string, string[][]>;
}

export interface Content {
  hangul: HangulData;
  pronunciation: PronunciationData;
  assimilation: AssimilationData;
  vocabulary: VocabularyData;
  listening: ListeningData;
}
