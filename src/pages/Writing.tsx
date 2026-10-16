import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, EyeIcon, RepeatIcon } from '../components/Icons';
import PlayButton from '../components/PlayButton';
import WritingCanvas, { type WritingCanvasHandle } from '../components/WritingCanvas';
import { PageHeader, Tabs } from '../components/ui';
import { play, stop } from '../lib/audio';
import { useContent } from '../lib/content';
import { dayKey, recordPractice, useProgress, visit } from '../lib/progress';
import { useSettings } from '../lib/settings';
import { cn, shuffle } from '../lib/utils';
import type { Word } from '../types';

type Mode = 'dictation' | 'phonetic';

const MODES: { id: Mode; label: string; intro: string }[] = [
  {
    id: 'dictation',
    label: 'Diktát',
    intro: 'Vypočuj si slovo a napíš ho v Hangule tak, ako si myslíš, že sa píše. Potom sa na pozadí ukáže správny tvar.',
  },
  {
    id: 'phonetic',
    label: 'Z výslovnosti',
    intro: 'Uvidíš, ako sa slovo vyslovuje latinkou. Napíš ho v Hangule podľa seba – potom sa na pozadí ukáže, ako sa naozaj píše.',
  },
];

export default function Writing() {
  const { vocabulary } = useContent();
  const settings = useSettings();
  const p = useProgress();
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get('mode') === 'phonetic' ? 'phonetic' : 'dictation';
  const catId = params.get('cat') ?? 'all';

  const pool = useMemo(
    () => vocabulary.categories.filter((c) => catId === 'all' || c.id === catId).flatMap((c) => c.words),
    [vocabulary, catId],
  );
  const [queue, setQueue] = useState<Word[]>(() => shuffle(pool));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [guide, setGuide] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const canvas = useRef<WritingCanvasHandle>(null);

  useEffect(() => {
    setQueue(shuffle(pool));
    setIdx(0);
    setRevealed(false);
  }, [pool]);

  useEffect(() => {
    visit({ key: 'writing', title: 'Písanie', subtitle: MODES.find((m) => m.id === mode)!.label, path: `/pisanie?mode=${mode}` });
  }, [mode]);

  const word = queue[idx % Math.max(1, queue.length)];

  // v diktáte prehraj slovo automaticky
  useEffect(() => {
    if (mode !== 'dictation' || !word || !settings.autoplay) return;
    const t = setTimeout(() => play({ text: word.ko, audio: word.audio }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, mode]);

  useEffect(() => () => stop(), []);

  const writtenToday = Object.entries(p.seen).filter(([k, t]) => k.startsWith('write:') && dayKey(new Date(t)) === dayKey()).length;

  if (!word) return null;

  function reveal() {
    setRevealed(true);
    recordPractice(`write:${word.ko}`);
  }

  function next() {
    canvas.current?.clear();
    setRevealed(false);
    setShowMeaning(false);
    if (idx + 1 >= queue.length) {
      setQueue(shuffle(pool));
      setIdx(0);
    } else setIdx(idx + 1);
  }

  const set = (patch: Record<string, string>) => setParams({ mode, cat: catId, ...patch }, { replace: true });

  return (
    <div>
      <PageHeader
        title="Písanie"
        subtitle="Precvič si písanie rukou. Nič sa nehodnotí – porovnaj svoj tvar so správnym a pokračuj."
        right={
          <div className="text-right">
            <div className="text-xs text-slate-500">Dnes napísaných</div>
            <div className="text-2xl font-bold tabular-nums">{writtenToday}</div>
          </div>
        }
      />

      <Tabs tabs={MODES.map((m) => ({ id: m.id, label: m.label }))} value={mode} onChange={(m) => set({ mode: m })} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">{MODES.find((m) => m.id === mode)!.intro}</p>
        <select
          value={catId}
          onChange={(e) => set({ cat: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          aria-label="Kategória slov"
        >
          <option value="all">Všetky kategórie</option>
          {vocabulary.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="card p-4 sm:p-6">
        {/* zadanie */}
        <div className="mb-5 flex flex-col items-center text-center">
          {mode === 'dictation' ? (
            <div className="flex items-center gap-3">
              <PlayButton text={word.ko} audio={word.audio} size="lg" variant="solid" title="Prehrať slovo" />
              <PlayButton text={word.ko} audio={word.audio} rate={0.6} label="🐢 pomaly" variant="ghost" className="px-3 py-1.5" />
            </div>
          ) : (
            <>
              <div className="label">Vyslovuje sa</div>
              <div className="mt-1 text-3xl font-bold tracking-wide sm:text-4xl">{word.rom}</div>
              <PlayButton text={word.ko} audio={word.audio} label="Vypočuť" variant="ghost" className="mt-2 px-3 py-1.5" />
            </>
          )}
          <div className="mt-3 min-h-6 text-sm">
            {showMeaning || revealed ? (
              <span className="text-slate-600 dark:text-slate-300">„{word.sk}“</span>
            ) : (
              <button className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400" onClick={() => setShowMeaning(true)}>
                <EyeIcon width={14} height={14} /> Ukázať význam
              </button>
            )}
          </div>
        </div>

        <WritingCanvas ref={canvas} answer={word.ko} revealed={revealed} guide={guide} onStrokesChange={setStrokes} />
        <p className="mt-2 text-center text-xs text-slate-400">
          {[...word.ko.replace(/\s+/g, '')].length} {[...word.ko.replace(/\s+/g, '')].length === 1 ? 'slabika' : 'slabík(y)'} – jedno políčko na slabiku
        </p>

        {/* ovládanie */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button className="btn-secondary" onClick={() => canvas.current?.undo()} disabled={!strokes}>
            ↶ Späť
          </button>
          <button className="btn-secondary" onClick={() => canvas.current?.clear()} disabled={!strokes}>
            <RepeatIcon width={16} height={16} /> Vymazať
          </button>
          {!revealed && (
            <label className="btn-ghost cursor-pointer">
              <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
              Vodítko
            </label>
          )}
        </div>

        {!revealed ? (
          <div className="mt-5 flex justify-center">
            <button className="btn-primary px-6 py-3 text-base" onClick={reveal}>
              <EyeIcon width={18} height={18} /> Ukázať správne
            </button>
          </div>
        ) : (
          <div className="mt-5 flex animate-fadein flex-col items-center gap-4 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-500/10 sm:flex-row">
            <div className="flex flex-1 items-center gap-3">
              <PlayButton text={word.ko} audio={word.audio} />
              <div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="ko text-2xl font-bold">{word.ko}</span>
                  <span className={cn('ko text-sm', word.pron !== word.ko ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}>
                    [{word.pron}]
                  </span>
                  <span className="text-sm text-slate-400">{word.rom}</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{word.sk}</div>
                {word.pron !== word.ko && (
                  <div className="mt-1 text-xs text-slate-500">Pozor: píše sa inak, ako sa vyslovuje.</div>
                )}
              </div>
            </div>
            <button className="btn-primary" onClick={next} autoFocus>
              Ďalšie slovo <ChevronRight width={16} height={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
