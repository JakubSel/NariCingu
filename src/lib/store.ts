import { useSyncExternalStore } from 'react';

/**
 * Jednoduchý reaktívny store perzistovaný v localStorage.
 * `merge` spojí predvolené hodnoty s uloženými (predvolene plytko) – nové polia tak dostanú
 * predvolenú hodnotu a staré uložené dáta ostanú zachované.
 */
export function createStore<T extends object>(
  key: string,
  initial: () => T,
  merge: (defaults: T, saved: Partial<T>) => T = (d, s) => ({ ...d, ...s }),
) {
  let state: T = load();
  const listeners = new Set<() => void>();

  function load(): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return merge(initial(), JSON.parse(raw));
    } catch {
      /* poškodené dáta alebo zablokovaný localStorage */
    }
    return initial();
  }

  function set(updater: (s: T) => T) {
    state = updater(state);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignoruj – napr. súkromné okno */
    }
    listeners.forEach((l) => l());
  }

  function subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }

  return {
    get: () => state,
    set,
    replace: (next: Partial<T>) => set(() => merge(initial(), next)),
    reset: () => set(initial),
    subscribe,
    use: (): T => useSyncExternalStore(subscribe, () => state),
  };
}
