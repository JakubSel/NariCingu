import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PlayButton from '../components/PlayButton';
import Quiz from '../components/Quiz';
import { accText, PageHeader, Tabs } from '../components/ui';
import { useContent } from '../lib/content';
import { assimilationQuiz } from '../lib/generators';
import { accuracy, useProgress, visit } from '../lib/progress';
import type { AssimExample } from '../types';
import NotFound from './NotFound';

function ExampleCard({ ex }: { ex: AssimExample }) {
  const p = useProgress();
  const acc = accuracy(p.items[`assim:${ex.written}`]);
  const audioText = ex.audioText ?? ex.written;
  // „naivné“ prečítanie po slabikách s pauzami – pre porovnanie so skutočnou výslovnosťou
  const syllables = [...ex.written.replace(/\s+/g, '')];

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div>
          <div className="label">Napísané</div>
          <div className="ko text-3xl font-bold">{ex.written}</div>
          <div className="text-sm text-slate-500">{ex.meaning}</div>
        </div>
        <div>
          <div className="label">Začiatočník čaká</div>
          <div className="mt-1.5 text-lg italic text-slate-400 line-through decoration-rose-400/60">{ex.naive}</div>
        </div>
        <div>
          <div className="label">Skutočne znie</div>
          <div className="ko text-3xl font-bold text-indigo-600 dark:text-indigo-400">[{ex.actual}]</div>
          <div className="text-sm text-slate-500">{ex.actualRom}</div>
        </div>
        {acc !== null && <span className={`chip ml-auto ${accText(acc)}`}>{acc} %</span>}
      </div>
      <p className="ko mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ex.explanation}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <PlayButton text={audioText} audio={ex.audio} label="Prirodzene" className="px-3 py-1.5" />
        <PlayButton text={audioText} audio={ex.audio} rate={0.55} label="🐢 Pomaly" variant="ghost" className="px-3 py-1.5" />
        {syllables.length > 1 && (
          <PlayButton
            sequence={syllables.map((s) => ({ text: s, rate: 0.8 }))}
            label="Po slabikách (ako sa píše)"
            variant="ghost"
            className="px-3 py-1.5"
            title="Každá slabika zvlášť – takto to NEZNIE v reči"
          />
        )}
      </div>
    </div>
  );
}

export default function AssimilationRule() {
  const { id } = useParams();
  const { assimilation } = useContent();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'quiz' ? 'quiz' : 'learn';
  const rule = assimilation.rules.find((r) => r.id === id);
  const [round, setRound] = useState(0);
  const questions = useMemo(() => (rule ? assimilationQuiz(rule.examples, Math.min(8, rule.examples.length), { options: 3 }) : []), [rule, round]);

  useEffect(() => {
    if (rule) visit({ key: `assim:${rule.id}`, title: rule.title, subtitle: `Asimilácia – ${rule.korean}`, path: `/asimilacia/${rule.id}` });
  }, [rule]);

  if (!rule) return <NotFound />;
  const i = assimilation.rules.indexOf(rule);
  const next = assimilation.rules[i + 1];

  return (
    <div>
      <PageHeader
        back="/asimilacia"
        eyebrow={`Pravidlo ${i + 1} z ${assimilation.rules.length}`}
        title={
          <>
            {rule.title} <span className="ko text-xl font-semibold text-slate-400">{rule.korean}</span>
          </>
        }
        subtitle={rule.short}
      />
      <Tabs
        tabs={[
          { id: 'learn', label: 'Vysvetlenie a príklady' },
          { id: 'quiz', label: 'Precvičiť' },
        ]}
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
      />

      {tab === 'learn' ? (
        <div className="space-y-4">
          <div className="card p-5">
            <p className="ko leading-relaxed text-slate-700 dark:text-slate-300">{rule.explanation}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {rule.pattern.map((pt) => (
                <div key={pt} className="ko rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200">
                  {pt}
                </div>
              ))}
            </div>
          </div>
          {rule.examples.map((ex) => (
            <ExampleCard key={ex.written} ex={ex} />
          ))}
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button className="btn-primary" onClick={() => setParams({ tab: 'quiz' }, { replace: true })}>
              Precvičiť toto pravidlo →
            </button>
            {next && (
              <Link to={`/asimilacia/${next.id}`} className="btn-ghost">
                Ďalej: {next.title}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <Quiz
          key={rule.id}
          questions={questions}
          area="assimilation"
          sessionKey={`assim:${rule.id}`}
          sessionTitle={`${rule.title} – precvičovanie`}
          intro="Uvidíš, ako sa slovo píše, a vypočuješ si ho. Vyber, ako sa naozaj vyslovuje."
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
    </div>
  );
}
