import { Link } from 'react-router-dom';
import { ChevronRight } from '../components/Icons';
import PlayButton from '../components/PlayButton';
import { accColor, accText, PageHeader, ProgressBar } from '../components/ui';
import { useContent } from '../lib/content';
import { accuracy, useProgress } from '../lib/progress';

export default function TrainerList() {
  const { pronunciation } = useContent();
  const p = useProgress();

  return (
    <div>
      <PageHeader
        title="Tréner výslovnosti"
        subtitle="Jadro aplikácie. Každá lekcia: jednoduchá teória z pohľadu slovenčiny, porovnanie zvukov, kvíz počúvania a minimálne páry."
      />

      <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-sm leading-relaxed dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <b>Prečo je to pre Slovákov ťažké?</b> Slovenčina rozlišuje <i>znelé a neznelé</i> zvuky (g – k, d – t). Kórejčina rozlišuje niečo úplne
        iné: <i>jemné, napäté a s výdychom</i> (ㄱ – ㄲ – ㅋ). Naše ucho to spočiatku nepočuje, lebo to nikdy nepotrebovalo. Dobrá správa: dá sa to
        naučiť – opakovaným počúvaním.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pronunciation.lessons.map((l) => {
          const s = p.sessions[`lesson:${l.id}`];
          const charAcc = l.chars.map((c) => ({ c, acc: accuracy(p.sounds[c]) }));
          const tested = charAcc.filter((x) => x.acc !== null);
          const avg = tested.length ? Math.round(tested.reduce((a, x) => a + x.acc!, 0) / tested.length) : null;
          return (
            <Link key={l.id} to={`/trener/${l.id}`} className="card card-hover block p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="ko text-3xl font-bold tracking-wider">{l.title}</div>
                  <div className="mt-0.5 font-semibold text-slate-700 dark:text-slate-300">{l.subtitle}</div>
                </div>
                <div>
                  <PlayButton sequence={l.comparison[0]?.syllables.map((t, i) => ({ text: t, audio: l.comparison[0].audio?.[i] }))} title="Vypočuť" />
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{l.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {charAcc.map(({ c, acc }) => (
                  <span key={c} className="chip">
                    <span className="ko font-bold">{c}</span>
                    <span className={accText(acc)}>{acc === null ? '–' : `${acc}%`}</span>
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={s?.best ?? 0} color={accColor(s ? s.best : null)} />
                <span className="shrink-0 text-xs text-slate-500">{s ? `najlepšie ${s.best} %` : avg !== null ? `${avg} %` : 'nezačaté'}</span>
                <ChevronRight width={16} height={16} className="shrink-0 text-slate-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
