import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/ui';
import { fetchIndex } from '../lib/api';
import { useT } from '../lib/i18n';
import { toggleFavorite, useAppState } from '../lib/store';
import { formatTime } from '../lib/sync';
import type { StoryIndexEntry } from '../types';
import { StarIcon } from './Icons';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function Library() {
  const t = useT();
  const { favorites, progress } = useAppState();
  const [stories, setStories] = useState<StoryIndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<string>('all');
  const [onlyFav, setOnlyFav] = useState(false);

  useEffect(() => {
    fetchIndex()
      .then((i) => setStories(i.stories))
      .catch((e: Error) => setError(e.message));
  }, []);

  const levels = useMemo(() => {
    const present = new Set((stories ?? []).map((s) => s.level));
    return [...present].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  }, [stories]);

  const visible = useMemo(() => {
    return (stories ?? [])
      .filter((s) => level === 'all' || s.level === level)
      .filter((s) => !onlyFav || favorites.includes(s.id))
      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || (a.created ?? '').localeCompare(b.created ?? ''));
  }, [stories, level, onlyFav, favorites]);

  return (
    <div>
      <PageHeader eyebrow={<span lang="ko">읽기 · Ilgi</span>} title={t.title} subtitle={t.tagline} />

      <div className="ilgi-reader -mx-4 bg-paper px-4 py-5 sm:mx-0 sm:rounded-2xl sm:border sm:border-line sm:px-6">
        {stories && stories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label={t.levelFilter} className="flex flex-wrap gap-1 rounded-full border border-line p-1">
              {['all', ...levels].map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    level === l ? 'bg-celadon text-celadon-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {l === 'all' ? t.all : l}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={onlyFav}
              onClick={() => setOnlyFav(!onlyFav)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                onlyFav ? 'border-celadon bg-celadon-soft text-ink' : 'border-line text-muted hover:text-ink'
              }`}
            >
              <StarIcon width={16} height={16} filled={onlyFav} />
              {t.favorites}
            </button>
          </div>
        )}

        <div className="mt-5">
          {!stories && !error && (
            <p className="py-6 text-muted" aria-busy="true">
              {t.loading}
            </p>
          )}

          {error && (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="font-bold">{t.loadError}</h2>
              <p className="mt-1 text-muted">{error}</p>
            </div>
          )}

          {stories && stories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line p-8">
              <h2 className="text-xl font-bold">{t.emptyTitle}</h2>
              <p className="mt-2 max-w-prose text-muted">{t.emptyBody}</p>
            </div>
          )}

          {stories && stories.length > 0 && visible.length === 0 && <p className="py-10 text-muted">{t.noMatch}</p>}

          {visible.length > 0 && (
            <ul className="divide-y divide-line border-t border-line">
              {visible.map((s) => {
                const p = progress[s.id];
                const pct = p?.completed ? 100 : p ? Math.round(((p.furthest + 1) / Math.max(1, s.sentenceCount)) * 100) : 0;
                const fav = favorites.includes(s.id);
                return (
                  <li key={s.id} className="flex items-start gap-3">
                    <Link to={`/pribehy/${encodeURIComponent(s.id)}`} className="group min-w-0 flex-1 py-5">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span lang="ko" className="ko text-2xl font-bold group-hover:text-celadon">
                          {s.title}
                        </span>
                        {s.titleTranslations?.sk && <span className="text-muted">{s.titleTranslations.sk}</span>}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="rounded bg-celadon-soft px-1.5 font-bold text-ink">{s.level}</span>
                        <span>{formatTime(s.duration)}</span>
                        <span>{t.sentences(s.sentenceCount)}</span>
                        {s.tags?.includes('demo') && <span className="text-plum">{t.demo}</span>}
                        <span className={p?.completed ? 'text-celadon' : ''}>
                          {p?.completed ? t.completed : pct > 0 ? `${pct} %` : t.notStarted}
                        </span>
                      </span>
                      {pct > 0 && (
                        <span className="mt-3 block h-1 max-w-xs overflow-hidden rounded-full bg-line" aria-hidden>
                          <span className="block h-full rounded-full bg-celadon" style={{ width: `${pct}%` }} />
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(s.id)}
                      aria-pressed={fav}
                      aria-label={fav ? t.favoriteRemove : t.favoriteAdd}
                      title={fav ? t.favoriteRemove : t.favoriteAdd}
                      className={`mt-5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-celadon-soft ${
                        fav ? 'text-celadon' : 'text-muted'
                      }`}
                    >
                      <StarIcon filled={fav} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
