import { createStore } from './store';

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  rate: number;
  voiceURI: string;
  autoplay: boolean;
  level: string;
}

export const settingsStore = createStore<Settings>('naricingu:settings', () => ({
  theme: 'system',
  rate: 0.9,
  voiceURI: '',
  autoplay: true,
  level: 'beginner',
}));

export const useSettings = settingsStore.use;

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((s) => ({ ...s, ...patch }));
}
