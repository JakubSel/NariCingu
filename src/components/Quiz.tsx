import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { play, playSequence, stop } from '../lib/audio';
import type { QuizQuestion } from '../lib/generators';
import { recordAnswer, recordSession, type Area } from '../lib/progress';
import { useSettings } from '../lib/settings';
import { cn, shuffle } from '../lib/utils';
import { CheckIcon, ChevronRight, HeadphonesIcon, PlayIcon, RepeatIcon, XIcon } from './Icons';
import PlayButton from './PlayButton';
import { ProgressBar, Ring } from './ui';

interface Props {
  questions: QuizQuestion[];
  area: Area;
  sessionKey: string;
  sessionTitle: string;
  intro?: string;
  /** Vygeneruje nové kolo otázok. */
  onRestart?: () => void;
  onExit?: () => void;
  exitLabel?: string;
}

interface Result {
  q: QuizQuestion;
  chosen: string;
  correct: boolean;
}

export default function Quiz({ questions: initial, area, sessionKey, sessionTitle, intro, onRestart, onExit, exitLabel }: Props) {
  const settings = useSettings();
  const [questions, setQuestions] = useState(initial);
  const [phase, setPhase] = useState<'intro' | 'question' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [retry, setRetry] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // nové kolo zvonka (onRestart) – rovno pokračuj, používateľ už klikol
  const firstRender = useRef(true);
  useEffect(() => {
    setQuestions(initial);
    setIdx(0);
    setChosen(null);
    setResults([]);
    setRetry(false);
    setPhase(firstRender.current ? 'intro' : 'question');
    firstRender.current = false;
  }, [initial]);

  useEffect(() => () => stop(), []);

  const q = questions[idx];

  const playQuestion = useCallback(
    (slow = false) => {
      if (!q) return;
      play({ text: q.audioText, audio: q.audio, rate: (q.rate ?? 1) * (slow ? 0.65 : 1) });
    },
    [q],
  );

  useEffect(() => {
    if (phase !== 'question' || !settings.autoplay) return;
    const t = setTimeout(() => playQuestion(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, questions]);

  function answer(value: string) {
    if (chosen !== null || !q) return;
    const correct = value === q.answer;
    setChosen(value);
    recordAnswer({
      area: q.area ?? area,
      correct,
      expectedTag: q.tag,
      chosenTag: q.options.find((o) => o.value === value)?.tag,
      itemKey: q.itemKey,
    });
    setResults((r) => [...r, { q, chosen: value, correct }]);
    if (!correct) {
      // po chybe automaticky porovnaj: správna odpoveď vs. tvoja voľba
      const right = q.options.find((o) => o.value === q.answer);
      const wrong = q.options.find((o) => o.value === value);
      if (right?.audioText && wrong?.audioText && settings.autoplay)
        setTimeout(
          () =>
            playSequence([
              { text: right.audioText!, audio: right.audio, rate: q.rate },
              { text: wrong.audioText!, audio: wrong.audio, rate: q.rate },
            ], 600),
          350,
        );
    }
  }

  function next() {
    if (chosen === null) return;
    if (idx + 1 >= questions.length) {
      const correct = results.filter((r) => r.correct).length;
      if (!retry) recordSession(sessionKey, sessionTitle, correct, results.length);
      setPhase('done');
      stop();
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  function repeatMistakes() {
    const wrong = results.filter((r) => !r.correct).map((r) => ({ ...r.q, options: shuffle(r.q.options) }));
    setQuestions(shuffle(wrong));
    setIdx(0);
    setChosen(null);
    setResults([]);
    setRetry(true);
    setPhase('question');
  }

  // klávesové skratky
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (phase === 'intro' && e.key === 'Enter') {
        e.preventDefault();
        setPhase('question');
        return;
      }
      if (phase !== 'question' || !q) return;
      if (e.key === ' ' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        playQuestion();
      } else if (e.key.toLowerCase() === 's') {
        playQuestion(true);
      } else if (/^[1-9]$/.test(e.key)) {
        const opt = q.options[Number(e.key) - 1];
        if (opt) answer(opt.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const compact = useMemo(() => q && q.options.every((o) => [...o.label].length <= 4 && !o.sub?.includes(' ')), [q]);

  if (!questions.length)
    return <div className="card p-8 text-center text-slate-500">Pre toto cvičenie zatiaľ nie je dosť obsahu.</div>;

  /* ---------- úvod ---------- */
  if (phase === 'intro')
    return (
      <div ref={containerRef} className="card animate-fadein p-6 text-center sm:p-10">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <HeadphonesIcon width={32} height={32} />
        </div>
        <h2 className="text-xl font-bold">{sessionTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">
          {intro ?? 'Vypočuj si zvuk a vyber správnu odpoveď. Ak sa pomýliš, prehráme ti oba zvuky na porovnanie.'}
        </p>
        <p className="mt-1 text-sm text-slate-500">{questions.length} otázok</p>
        <button className="btn-primary mt-6 px-8 py-3 text-base" onClick={() => setPhase('question')}>
          <PlayIcon width={18} height={18} /> Začať
        </button>
        <p className="mt-5 hidden text-xs text-slate-400 sm:block">
          <span className="kbd">Medzera</span> prehrať · <span className="kbd">S</span> pomaly · <span className="kbd">1</span>–<span className="kbd">4</span> odpoveď ·{' '}
          <span className="kbd">Enter</span> ďalej
        </p>
      </div>
    );

  /* ---------- výsledky ---------- */
  if (phase === 'done') {
    const correct = results.filter((r) => r.correct).length;
    const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
    const wrong = results.filter((r) => !r.correct);
    const msg =
      pct === 100 ? 'Výborne! Bez jedinej chyby.' : pct >= 80 ? 'Skvelá práca!' : pct >= 60 ? 'Dobrý základ – opakuj chyby.' : 'Toto chce ešte tréning. Nevzdávaj sa!';
    return (
      <div className="card animate-fadein p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <Ring value={pct} size={112} stroke={10}>
            <span className="text-2xl">{pct}%</span>
          </Ring>
          <h2 className="mt-4 text-xl font-bold">{msg}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {correct} z {results.length} správne{retry && ' (opakovanie chýb)'}
          </p>
        </div>

        {wrong.length > 0 && (
          <div className="mt-6">
            <div className="label mb-2">Na zopakovanie</div>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {wrong.map((r, i) => {
                const right = r.q.options.find((o) => o.value === r.q.answer);
                const mine = r.q.options.find((o) => o.value === r.chosen);
                return (
                  <li key={i} className="flex items-center gap-3 p-3">
                    <PlayButton text={r.q.audioText} audio={r.q.audio} size="sm" />
                    <div className="min-w-0 flex-1 text-sm">
                      <span className="ko font-semibold text-emerald-600 dark:text-emerald-400">{right?.label}</span>
                      {right?.after && <span className="text-slate-500"> · {right.after}</span>}
                      <span className="mx-2 text-slate-400">≠</span>
                      <span className="ko text-rose-600 line-through dark:text-rose-400">{mine?.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {wrong.length > 0 && (
            <button className="btn-primary" onClick={repeatMistakes}>
              <RepeatIcon width={16} height={16} /> Zopakovať chyby ({wrong.length})
            </button>
          )}
          {onRestart && (
            <button className={wrong.length ? 'btn-secondary' : 'btn-primary'} onClick={onRestart}>
              Nové kolo
            </button>
          )}
          {onExit && (
            <button className="btn-ghost" onClick={onExit}>
              {exitLabel ?? 'Späť'}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---------- otázka ---------- */
  const answered = chosen !== null;
  const isCorrect = chosen === q.answer;
  const rightOpt = q.options.find((o) => o.value === q.answer);
  const myOpt = q.options.find((o) => o.value === chosen);

  return (
    <div ref={containerRef} className="card p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <ProgressBar value={((idx + (answered ? 1 : 0)) / questions.length) * 100} />
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
          {idx + 1}/{questions.length}
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        <p className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">{q.prompt}</p>
        <div className="flex items-center gap-3">
          <PlayButton text={q.audioText} audio={q.audio} rate={q.rate} size="xl" variant="solid" title="Prehrať (medzera)" />
          <button
            onClick={() => playQuestion(true)}
            className="btn-secondary h-10 rounded-full px-3 text-xs"
            title="Prehrať pomaly (S)"
          >
            🐢 pomaly
          </button>
        </div>
        {q.showText && (
          <div className="mt-5">
            <div className="ko text-3xl font-bold sm:text-4xl">{q.showText}</div>
            {q.showSub && <div className="mt-1 text-sm text-slate-500">{q.showSub}</div>}
          </div>
        )}
      </div>

      <div className={cn('mt-6 grid gap-2.5', compact ? (q.options.length === 2 ? 'grid-cols-2' : q.options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3') : 'grid-cols-1 sm:grid-cols-2')}>
        {q.options.map((o, i) => {
          const isAnswer = o.value === q.answer;
          const isMine = o.value === chosen;
          return (
            <div key={o.value} className="relative">
              <button
                onClick={() => answer(o.value)}
                disabled={answered}
                className={cn(
                  'group w-full rounded-2xl border-2 text-center transition disabled:cursor-default',
                  compact ? 'px-2 py-4' : 'px-4 py-3.5 text-left',
                  !answered && 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 active:scale-[.98] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10',
                  answered && isAnswer && 'animate-pop border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
                  answered && isMine && !isAnswer && 'animate-shake border-rose-500 bg-rose-50 dark:bg-rose-500/10',
                  answered && !isAnswer && !isMine && 'border-slate-200 opacity-60 dark:border-slate-800',
                )}
              >
                <span className="absolute left-2.5 top-2 hidden text-[10px] font-semibold text-slate-400 sm:block">{i + 1}</span>
                <span className={cn('ko block font-bold', compact ? 'text-3xl sm:text-4xl' : 'text-lg')}>{o.label}</span>
                {o.sub && <span className="mt-0.5 block text-xs text-slate-500">{o.sub}</span>}
                {answered && o.after && <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{o.after}</span>}
              </button>
              {answered && o.audioText && (
                <PlayButton
                  text={o.audioText}
                  audio={o.audio}
                  rate={q.rate}
                  size="sm"
                  variant="ghost"
                  className="absolute right-1.5 top-1.5"
                  title={`Prehrať ${o.label}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {answered && (
        <div
          className={cn(
            'mt-5 flex animate-fadein flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center',
            isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10',
          )}
        >
          <div className="flex flex-1 items-start gap-3">
            <span
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full text-white',
                isCorrect ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            >
              {isCorrect ? <CheckIcon width={18} height={18} /> : <XIcon width={18} height={18} />}
            </span>
            <div className="text-sm">
              <p className="font-semibold">
                {isCorrect ? 'Správne!' : (
                  <>
                    Správne je <span className="ko">{rightOpt?.label}</span>
                    {rightOpt?.after && ` (${rightOpt.after})`}
                  </>
                )}
              </p>
              {q.explain && <p className="mt-0.5 text-slate-600 dark:text-slate-300">{q.explain}</p>}
              {!isCorrect && rightOpt?.audioText && myOpt?.audioText && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Porovnaj:</span>
                  <PlayButton
                    sequence={[
                      { text: rightOpt.audioText, audio: rightOpt.audio, rate: q.rate },
                      { text: myOpt.audioText, audio: myOpt.audio, rate: q.rate },
                    ]}
                    label={
                      <span className="ko">
                        {rightOpt.label} → {myOpt.label}
                      </span>
                    }
                    className="px-3 py-1.5"
                  />
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary sm:ml-auto" onClick={next} autoFocus>
            {idx + 1 >= questions.length ? 'Výsledky' : 'Ďalej'} <ChevronRight width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
}
