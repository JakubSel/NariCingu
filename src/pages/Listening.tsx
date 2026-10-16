import { Link } from 'react-router-dom';
import { ChevronRight } from '../components/Icons';
import { accColor, accText, PageHeader, ProgressBar } from '../components/ui';
import { useContent } from '../lib/content';
import { accuracy, useProgress } from '../lib/progress';
import { updateSettings, useSettings } from '../lib/settings';
import { cn } from '../lib/utils';

export default function Listening() {
  const { listening } = useContent();
  const p = useProgress();
  const { level: saved } = useSettings();
  const level = listening.levels.find((l) => l.id === saved) ?? listening.levels[0];
  const acc = accuracy(p.areas.listening);

  return (
    <div>
      <PageHeader
        title="Tréning počúvania"
        subtitle="Žiadne vizuálne nápovedy – len tvoje ucho. Vyber si úroveň a typ cvičenia."
        right={
          <div className="text-right">
            <div className="text-xs text-slate-500">Celková presnosť</div>
            <div className={`text-2xl font-bold ${accText(acc)}`}>{acc === null ? '–' : `${acc} %`}</div>
          </div>
        }
      />

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        {listening.levels.map((lv) => (
          <button
            key={lv.id}
            onClick={() => updateSettings({ level: lv.id })}
            className={cn(
              'rounded-2xl border-2 p-4 text-left transition',
              lv.id === level.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900',
            )}
          >
            <div className="font-bold">{lv.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{lv.description}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {listening.exercises.map((ex) => {
          const s = p.sessions[`listen:${ex.id}:${level.id}`];
          return (
            <Link key={ex.id} to={`/pocuvanie/${ex.id}?level=${level.id}`} className="card card-hover p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">{ex.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{ex.title}</div>
                  <p className="ko mt-0.5 text-sm text-slate-600 dark:text-slate-400">{ex.description}</p>
                </div>
                <ChevronRight className="shrink-0 text-slate-400" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={s?.best ?? 0} color={accColor(s ? s.best : null)} />
                <span className="shrink-0 text-xs text-slate-500">{s ? `najlepšie ${s.best} % · ${s.attempts}×` : 'nezačaté'}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm leading-relaxed text-slate-600 dark:bg-slate-900 dark:text-slate-400">
        <b>Tip:</b> Pri každej chybe ti prehráme správny zvuk a tvoj výber za sebou. Práve toto porovnávanie trénuje ucho najviac. Cvič radšej
        každý deň 5 minút ako raz týždenne hodinu.
      </div>
    </div>
  );
}
