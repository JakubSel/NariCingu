import { useEffect, useState } from 'react';
import { playSequence, stop } from '../lib/audio';
import { sameDifferentRound } from '../lib/generators';
import { recordAnswer, recordSession, type Area } from '../lib/progress';
import { useSettings } from '../lib/settings';
import { cn } from '../lib/utils';
import { RepeatIcon } from './Icons';
import PlayButton from './PlayButton';
import { ProgressBar } from './ui';

export interface SDItem {
  text: string;
  label?: string;
  tag?: string;
  audio?: string;
}

interface Props {
  groups: SDItem[][];
  rounds?: number;
  area: Area;
  sessionKey: string;
  sessionTitle: string;
}

type Round = { a: SDItem; b: SDItem; same: boolean };

export default function SameDifferent({ groups, rounds = 10, area, sessionKey, sessionTitle }: Props) {
  const settings = useSettings();
  const [started, setStarted] = useState(false);
  const [n, setN] = useState(0);
  const [round, setRound] = useState<Round>(() => sameDifferentRound(groups));
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const playPair = (r: Round = round) =>
    playSequence([{ text: r.a.text, audio: r.a.audio }, { text: r.b.text, audio: r.b.audio }], 700);

  useEffect(() => {
    if (started && !done && settings.autoplay) {
      const t = setTimeout(() => playPair(), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, started, done]);

  useEffect(() => () => stop(), []);

  function choose(same: boolean) {
    if (answer !== null) return;
    const correct = same === round.same;
    setAnswer(same);
    if (correct) setScore((s) => s + 1);
    recordAnswer({
      area,
      correct,
      // pri rozdielnych zvukoch: ak ich používateľ nerozlíšil, zaznamenaj zámenu
      expectedTag: round.same ? undefined : round.b.tag,
      chosenTag: !correct && !round.same ? round.a.tag : undefined,
    });
  }

  function next() {
    if (n + 1 >= rounds) {
      recordSession(sessionKey, sessionTitle, score, rounds);
      setDone(true);
      return;
    }
    setN(n + 1);
    setAnswer(null);
    setRound(sameDifferentRound(groups));
  }

  function restart() {
    setN(0);
    setScore(0);
    setAnswer(null);
    setDone(false);
    setRound(sameDifferentRound(groups));
  }

  if (!started)
    return (
      <div className="card p-6 text-center">
        <h3 className="text-lg font-bold">Rovnaké alebo rozdielne?</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Zaznejú dva zvuky za sebou. Povedz, či sú rovnaké. Najlepší spôsob, ako naučiť ucho počuť drobné rozdiely.
        </p>
        <button className="btn-primary mt-4" onClick={() => setStarted(true)}>
          Začať ({rounds} kôl)
        </button>
      </div>
    );

  if (done)
    return (
      <div className="card p-6 text-center">
        <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
          {score}/{rounds}
        </div>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {score === rounds ? 'Perfektné ucho!' : score >= rounds * 0.8 ? 'Výborne!' : 'Skús to znova – ucho sa učí opakovaním.'}
        </p>
        <button className="btn-primary mt-4" onClick={restart}>
          <RepeatIcon width={16} height={16} /> Znova
        </button>
      </div>
    );

  const correct = answer !== null && answer === round.same;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <ProgressBar value={((n + (answer !== null ? 1 : 0)) / rounds) * 100} />
        <span className="text-xs font-semibold tabular-nums text-slate-500">
          {n + 1}/{rounds}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <PlayButton sequence={[{ text: round.a.text, audio: round.a.audio }, { text: round.b.text, audio: round.b.audio }]} size="xl" variant="solid" title="Prehrať dvojicu" />
        <p className="mt-3 text-sm text-slate-500">Zaznejú dva zvuky</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            disabled={answer !== null}
            onClick={() => choose(v)}
            className={cn(
              'rounded-2xl border-2 px-4 py-4 text-base font-bold transition',
              answer === null && 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:bg-indigo-500/10',
              answer !== null && v === round.same && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
              answer === v && v !== round.same && 'border-rose-500 bg-rose-50 dark:bg-rose-500/10',
              answer !== null && answer !== v && v !== round.same && 'border-slate-200 opacity-50 dark:border-slate-800',
            )}
          >
            {v ? '= Rovnaké' : '≠ Rozdielne'}
          </button>
        ))}
      </div>
      {answer !== null && (
        <div className={cn('mt-4 flex animate-fadein flex-wrap items-center gap-3 rounded-xl p-3', correct ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10')}>
          <span className="font-semibold">{correct ? 'Správne!' : 'Nesprávne.'}</span>
          <span className="ko flex items-center gap-2 text-lg">
            <PlayButton text={round.a.text} audio={round.a.audio} size="sm" /> {round.a.label ?? round.a.text}
            <span className="text-slate-400">{round.same ? '=' : '≠'}</span>
            <PlayButton text={round.b.text} audio={round.b.audio} size="sm" /> {round.b.label ?? round.b.text}
          </span>
          <button className="btn-primary ml-auto" onClick={next} autoFocus>
            Ďalej
          </button>
        </div>
      )}
    </div>
  );
}
