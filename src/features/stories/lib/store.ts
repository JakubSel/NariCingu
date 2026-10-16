import { createStore } from '../../../lib/store';
import { STORIES_STORAGE_KEY } from '../config';

// Everything the learner owns in the reader lives in localStorage: favorites, progress, prefs.
// Theme comes from the app settings, so it is not stored here.
// Uses the app's shared createStore, so backup/restore/reset in Settings covers stories too.

export interface Prefs {
  showTranslation: boolean;
  showPronunciation: boolean;
  rate: number;
}

export interface Progress {
  /** furthest sentence index reached */
  furthest: number;
  /** last audio position in seconds */
  position: number;
  completed: boolean;
  updatedAt: number;
}

export interface AppState {
  favorites: string[];
  progress: Record<string, Progress>;
  prefs: Prefs;
}

const defaults = (): AppState => ({
  favorites: [],
  progress: {},
  prefs: { showTranslation: true, showPronunciation: false, rate: 1 },
});

export const storiesStore = createStore<AppState>(STORIES_STORAGE_KEY, defaults, (d, saved) => ({
  favorites: Array.isArray(saved.favorites) ? saved.favorites : d.favorites,
  progress: saved.progress && typeof saved.progress === 'object' ? saved.progress : d.progress,
  // prefs sa spájajú do hĺbky, aby nová predvoľba dostala predvolenú hodnotu
  prefs: { ...d.prefs, ...(saved.prefs ?? {}) },
}));

export const useAppState = storiesStore.use;
export const getState = storiesStore.get;

export function toggleFavorite(id: string) {
  storiesStore.set((s) => ({
    ...s,
    favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
  }));
}

export function setPrefs(patch: Partial<Prefs>) {
  storiesStore.set((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
}

export function updateProgress(id: string, patch: Partial<Progress>) {
  storiesStore.set((s) => {
    const prev = s.progress[id] ?? { furthest: -1, position: 0, completed: false, updatedAt: 0 };
    const next: Progress = {
      ...prev,
      ...patch,
      furthest: Math.max(prev.furthest, patch.furthest ?? -1),
      completed: prev.completed || !!patch.completed,
      updatedAt: Date.now(),
    };
    return { ...s, progress: { ...s.progress, [id]: next } };
  });
}
