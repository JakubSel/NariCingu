// Story format written by Korean Story Lab (schema version 1, docs/STORY_FORMAT.md there).
// Every optional field is optional on purpose: older or hand-written stories still load.

/** Anything with a time range in the audio. Sentences and words share this, so the
 *  same sync code can drive sentence highlighting and karaoke-style word highlighting. */
export interface Segment {
  start: number;
  end: number;
}

/** Future: word-level timing (karaoke mode, vocabulary extraction). */
export interface WordTiming extends Segment {
  text: string;
  /** dictionary form, for vocabulary lists */
  lemma?: string;
  pronunciation?: string;
}

/** One sound change in one word, e.g. 걷는 → 건는 (nasalization). */
export interface AssimilationNote {
  text: string;
  pronunciation: string;
  rules?: string[];
  note?: string;
}

export interface GrammarNote {
  note: string;
  /** the part of the sentence the note is about (optional) */
  text?: string;
}

export interface Sentence extends Segment {
  id: number;
  paragraph?: number;
  text: string;
  translations?: Record<string, string>;
  pronunciation?: string;
  assimilation?: AssimilationNote[];
  grammar?: GrammarNote[];
  words?: WordTiming[];
}

export interface Story {
  version?: number;
  id: string;
  title: string;
  titleTranslations?: Record<string, string>;
  level: string;
  language?: string;
  audio: string;
  duration?: number;
  voice?: { engine?: string; model?: string; speaker?: string };
  tags?: string[];
  created?: string;
  /** last text-only edit (audio unchanged) */
  updated?: string;
  sentences: Sentence[];
}

export interface StoryIndexEntry {
  id: string;
  file: string;
  title: string;
  titleTranslations?: Record<string, string>;
  level: string;
  duration: number;
  sentenceCount: number;
  tags?: string[];
  created?: string;
}

export interface StoryIndex {
  version: number;
  stories: StoryIndexEntry[];
}
