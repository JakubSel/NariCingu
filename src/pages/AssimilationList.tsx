import { Link } from 'react-router-dom';
import { ChevronRight } from '../components/Icons';
import PlayButton from '../components/PlayButton';
import { accText, PageHeader } from '../components/ui';
import { useContent } from '../lib/content';
import { useProgress } from '../lib/progress';

export default function AssimilationList() {
  const { assimilation } = useContent();
  const p = useProgress();
  const firstExamples = assimilation.rules.map((r) => r.examples[0]).filter(Boolean);

  return (
    <div>
      <PageHeader title="Asimilácia a zvukové zmeny" subtitle="Prečo kórejčina neznie tak, ako sa píše – a ako sa v tom vyznať." />

      <div className="card mb-6 overflow-hidden">
        <div className="p-5">
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">{assimilation.intro}</p>
        </div>
        <div className="flex gap-3 overflow-x-auto border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          {firstExamples.map((ex) => (
            <div key={ex.written} className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
              <PlayButton text={ex.audioText ?? ex.written} audio={ex.audio} size="sm" />
              <span className="ko font-semibold">{ex.written}</span>
              <span className="text-slate-400">→</span>
              <span className="ko font-semibold text-indigo-600 dark:text-indigo-400">[{ex.actual}]</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {assimilation.rules.map((r, i) => {
          const s = p.sessions[`assim:${r.id}`];
          return (
            <Link key={r.id} to={`/asimilacia/${r.id}`} className="card card-hover flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-bold">{r.title}</span>
                  <span className="ko text-sm text-slate-500">{r.korean}</span>
                </span>
                <span className="ko block truncate text-sm text-slate-600 dark:text-slate-400">{r.short}</span>
                <span className="mt-1 block text-xs text-slate-400">
                  {r.examples.length} príkladov ·{' '}
                  {s ? <span className={accText(s.best)}>najlepšie {s.best} %</span> : 'nezačaté'}
                </span>
              </span>
              <ChevronRight className="shrink-0 text-slate-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
