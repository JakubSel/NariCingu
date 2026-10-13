import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Content } from '../types';

const FILES = ['hangul', 'pronunciation', 'assimilation', 'vocabulary', 'listening'] as const;

async function loadJson(name: string) {
  // no-cache: úpravy JSON sa prejavia bez nového buildu
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Nepodarilo sa načítať data/${name}.json (${res.status})`);
  return res.json();
}

const Ctx = createContext<Content | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(FILES.map(loadJson))
      .then((parts) => setContent(Object.fromEntries(FILES.map((f, i) => [f, parts[i]])) as unknown as Content))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold">Obsah sa nepodarilo načítať</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button className="btn-primary mt-4" onClick={() => location.reload()}>
            Skúsiť znova
          </button>
        </div>
      </div>
    );

  if (!content)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="ko animate-pulse text-5xl font-bold text-indigo-500">소리</div>
          <p className="text-sm">Načítavam…</p>
        </div>
      </div>
    );

  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export function useContent(): Content {
  const c = useContext(Ctx);
  if (!c) throw new Error('useContent mimo ContentProvider');
  return c;
}
