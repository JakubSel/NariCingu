import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EyeIcon } from '../components/Icons';
import PlayButton from '../components/PlayButton';
import Quiz from '../components/Quiz';
import { accText, PageHeader, Tabs } from '../components/ui';
import { useContent } from '../lib/content';
import { meaningQuiz, wordQuiz } from '../lib/generators';
import { accuracy, useProgress, visit } from '../lib/progress';
import { shuffle } from '../lib/utils';
import type { Word } from '../types';
import NotFound from './NotFound';

type Mode = 'list' | 'meaning' | 'words';

function WordCard({ w, hide }: { w: Word; hide: boolean }) {
  const p = useProgress();
  const [revealed, setRevealed] = useState(false);
  const acc = accuracy(p.items[`word:${w.ko}`]);
  const hidden = hide && !revealed;
  useEffect(() => {
    setRevealed(false);
  }, [hide]);

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <PlayButton text={w.ko} audio={w.audio} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="ko text-2xl font-bold">{w.ko}</span>
            <span className={`ko text-sm ${w.pron !== w.ko ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>[{w.pron}]</span>
            <span className="text-sm text-slate-400">{w.rom}</span>
          </div>
          {hidden ? (
            <button className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400" onClick={() => setRevealed(true)}>
              <EyeIcon width={14} height={14} /> Ukázať preklad
            </button>
          ) : (
            <div className="mt-0.5 font-medium text-slate-700 dark:text-slate-300">{w.sk}</div>
          )}
        </div>
        {acc !== null && <span className={`chip ${accText(acc)}`}>{acc} %</span>}
      </div>
      {w.note && <p className="ko mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">💡 {w.note}</p>}
      <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <PlayButton text={w.example.ko} audio={w.example.audio} size="sm" variant="ghost" />
        <div className="text-sm">
          <div className="ko font-medium">{w.example.ko}</div>
          {!hidden && <div className="text-slate-500">{w.example.sk}</div>}
        </div>
      </div>
    </div>
  );
}

export default function VocabularyCategory() {
  const { id } = useParams();
  const { vocabulary } = useContent();
  const [params, setParams] = useSearchParams();
  const mode = (['list', 'meaning', 'words'].includes(params.get('mode') ?? '') ? params.get('mode') : 'list') as Mode;
  const cat = vocabulary.categories.find((c) => c.id === id);
  const [hide, setHide] = useState(false);
  const [round, setRound] = useState(0);
  const allWords = useMemo(() => vocabulary.categories.flatMap((c) => c.words), [vocabulary]);

  const questions = useMemo(() => {
    if (!cat) return [];
    const n = Math.min(10, cat.words.length);
    // zradné možnosti berieme aj z iných kategórií, aby ich bolo dosť
    return mode === 'words' ? wordQuiz(cat.words, n, 4, 'intermediate', allWords) : meaningQuiz(cat.words, n, 4, 'beginner', cat.words.length >= 6 ? cat.words : allWords);
  }, [cat, mode, round, allWords]);

  const order = useMemo(() => (cat ? (hide ? shuffle(cat.words) : cat.words) : []), [cat, hide]);

  useEffect(() => {
    if (cat) visit({ key: `vocab:${cat.id}`, title: `${cat.icon} ${cat.title}`, subtitle: 'Slovná zásoba', path: `/slovicka/${cat.id}` });
  }, [cat]);

  if (!cat) return <NotFound />;

  return (
    <div>
      <PageHeader back="/slovicka" eyebrow="Slovná zásoba" title={`${cat.icon} ${cat.title}`} subtitle={cat.description} />
      <Tabs
        tabs={[
          { id: 'list', label: 'Slová' },
          { id: 'meaning', label: 'Počúvaj a prelož' },
          { id: 'words', label: 'Ktoré slovo?' },
        ]}
        value={mode}
        onChange={(m) => setParams({ mode: m }, { replace: true })}
      />

      {mode === 'list' ? (
        <>
          <div className="mb-4 flex justify-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
              Skryť preklady (samotest)
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {order.map((w) => (
              <WordCard key={w.ko} w={w} hide={hide} />
            ))}
          </div>
        </>
      ) : (
        <Quiz
          key={`${cat.id}-${mode}`}
          questions={questions}
          area="vocabulary"
          sessionKey={`vocab:${cat.id}`}
          sessionTitle={`${cat.title} – ${mode === 'words' ? 'ktoré slovo?' : 'počúvaj a prelož'}`}
          intro={mode === 'words' ? 'Vypočuj si slovo a nájdi ho medzi podobnými.' : 'Vypočuj si slovo a vyber jeho slovenský význam.'}
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
    </div>
  );
}
