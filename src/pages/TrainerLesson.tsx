import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PlayButton from '../components/PlayButton';
import Quiz from '../components/Quiz';
import SameDifferent from '../components/SameDifferent';
import { accColor, accText, Dots, Empty, PageHeader, ProgressBar, Tabs } from '../components/ui';
import { useContent } from '../lib/content';
import { lessonQuiz } from '../lib/generators';
import { accuracy, progressStore, topConfusions, useProgress, visit } from '../lib/progress';
import type { Lesson } from '../types';
import NotFound from './NotFound';

type Tab = 'theory' | 'compare' | 'quiz' | 'pairs' | 'progress';

const TABS: { id: Tab; label: string }[] = [
  { id: 'theory', label: 'Teória' },
  { id: 'compare', label: 'Porovnanie' },
  { id: 'quiz', label: 'Kvíz' },
  { id: 'pairs', label: 'Min. páry' },
  { id: 'progress', label: 'Pokrok' },
];

function Theory({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-6">
      <div className={`grid gap-3 ${lesson.profiles.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {lesson.profiles.map((pr, i) => {
          const sample = lesson.comparison[0]?.syllables[i];
          return (
            <div key={pr.char} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="ko text-4xl font-bold">{pr.char}</span>
                {sample && <PlayButton text={sample} audio={lesson.comparison[0].audio?.[i]} />}
              </div>
              <div className="mt-2 font-semibold text-indigo-700 dark:text-indigo-300">{pr.label}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">≈ {pr.slovak}</div>
              <dl className="mt-3 space-y-1.5 text-xs">
                {pr.features.map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">{f.label}</dt>
                    <dd>
                      <Dots value={f.value} />
                    </dd>
                  </div>
                ))}
                {pr.pitch && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">Hlas na samohláske</dt>
                    <dd className="font-semibold">{pr.pitch === 'vysoko' ? '↗ vysoko' : '↘ nízko'}</dd>
                  </div>
                )}
              </dl>
            </div>
          );
        })}
      </div>

      <div className="card divide-y divide-slate-100 dark:divide-slate-800">
        {lesson.theory.map((t) => (
          <section key={t.heading} className="p-5">
            <h3 className="ko font-bold">{t.heading}</h3>
            <p className="ko mt-1.5 leading-relaxed text-slate-700 dark:text-slate-300">{t.text}</p>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
        <h3 className="mb-2 font-bold">🇸🇰 Tipy pre Slovákov</h3>
        <ul className="ko space-y-1.5 text-sm leading-relaxed">
          {lesson.tips.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-amber-500">•</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Compare({ lesson }: { lesson: Lesson }) {
  const [slow, setSlow] = useState(false);
  const rate = slow ? 0.6 : 1;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">Klikaj na slabiky a porovnávaj. Najprv po stĺpcoch, potom celé riadky.</p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
          🐢 Pomaly
        </label>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {lesson.chars.map((c, i) => (
                <th key={c} className="p-3 text-center">
                  <div className="ko text-2xl font-bold">{c}</div>
                  <div className="text-xs font-medium text-slate-500">{lesson.profiles[i]?.label}</div>
                </th>
              ))}
              <th className="w-24 p-3 text-xs font-medium text-slate-500">Celý riadok</th>
            </tr>
          </thead>
          <tbody>
            {lesson.comparison.map((row, ri) => (
              <tr key={ri} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                {row.syllables.map((s, i) => (
                  <td key={s} className="p-2 text-center">
                    <PlayButtonTile text={s} audio={row.audio?.[i]} rate={rate} />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <PlayButton sequence={row.syllables.map((t, i) => ({ text: t, audio: row.audio?.[i], rate }))} title="Prehrať celý riadok" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {lesson.chars.map((c, ci) => (
          <PlayButton
            key={c}
            label={<span className="ko">Celý stĺpec {c}</span>}
            variant="ghost"
            className="px-3 py-1.5"
            sequence={lesson.comparison.map((row) => ({ text: row.syllables[ci], audio: row.audio?.[ci], rate }))}
          />
        ))}
      </div>
    </div>
  );
}

function PlayButtonTile({ text, audio, rate }: { text: string; audio?: string; rate: number }) {
  return (
    <PlayButton
      text={text}
      audio={audio}
      rate={rate}
      variant="ghost"
      label={<span className="ko text-2xl font-bold text-slate-900 dark:text-slate-100">{text}</span>}
      className="w-full justify-center rounded-xl border border-slate-200 px-2 py-3 dark:border-slate-700"
    />
  );
}

function Pairs({ lesson }: { lesson: Lesson }) {
  const groups = useMemo(
    () => [
      ...lesson.comparison.map((r) => r.syllables.map((s, i) => ({ text: s, tag: lesson.chars[i], audio: r.audio?.[i] }))),
      ...lesson.minimalSets.map((m) => m.items.map((it) => ({ text: it.ko, tag: it.char, audio: it.audio }))),
    ],
    [lesson],
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {lesson.minimalSets.map((set, si) => (
          <div key={si} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="label">Pár {si + 1}</span>
              <PlayButton sequence={set.items.map((it) => ({ text: it.ko, audio: it.audio }))} size="sm" title="Prehrať všetky" />
            </div>
            <ul className="space-y-2">
              {set.items.map((it) => (
                <li key={it.ko} className="flex items-center gap-3">
                  <PlayButton text={it.ko} audio={it.audio} size="sm" />
                  <span className="ko text-xl font-bold">{it.ko}</span>
                  <span className="chip ko">{it.char}</span>
                  <span className="ml-auto text-right text-sm text-slate-600 dark:text-slate-400">{it.sk}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <SameDifferent groups={groups} area="pronunciation" sessionKey={`lesson-sd:${lesson.id}`} sessionTitle={`${lesson.title} – rovnaké/rozdielne`} />
    </div>
  );
}

function LessonProgress({ lesson }: { lesson: Lesson }) {
  const p = useProgress();
  const s = p.sessions[`lesson:${lesson.id}`];
  const sd = p.sessions[`lesson-sd:${lesson.id}`];
  const confusions = topConfusions(p, (e) => lesson.chars.includes(e), 6);
  const any = lesson.chars.some((c) => p.sounds[c]?.t);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Kvíz – najlepší výsledok</div>
          <div className={`text-2xl font-bold ${accText(s?.best ?? null)}`}>{s ? `${s.best} %` : '–'}</div>
          <div className="text-xs text-slate-400">{s ? `posledný ${s.last} % · ${s.attempts}× precvičené` : 'zatiaľ nespustené'}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Rovnaké / rozdielne – najlepšie</div>
          <div className={`text-2xl font-bold ${accText(sd?.best ?? null)}`}>{sd ? `${sd.best} %` : '–'}</div>
          <div className="text-xs text-slate-400">{sd ? `${sd.attempts}× precvičené` : 'zatiaľ nespustené'}</div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-bold">Úspešnosť podľa zvuku</h3>
        {!any ? (
          <Empty>Sprav kvíz a uvidíš, ktoré zvuky ti idú a ktoré nie.</Empty>
        ) : (
          <ul className="space-y-3">
            {lesson.chars.map((c) => {
              const cnt = p.sounds[c];
              const acc = accuracy(cnt);
              return (
                <li key={c} className="flex items-center gap-3">
                  <span className="ko w-8 text-2xl font-bold">{c}</span>
                  <ProgressBar value={acc ?? 0} color={accColor(acc)} />
                  <span className={`w-24 shrink-0 text-right text-sm tabular-nums ${accText(acc)}`}>
                    {acc === null ? '–' : `${acc} %`} <span className="text-xs text-slate-400">({cnt?.t ?? 0})</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {confusions.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-1 font-bold">Čo si zamieňaš</h3>
          <p className="mb-3 text-sm text-slate-500">Počul si prvý zvuk, ale vybral si druhý.</p>
          <ul className="space-y-2">
            {confusions.map((c) => (
              <li key={c.expected + c.chosen} className="flex items-center gap-3 rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
                <span className="ko text-xl font-bold">{c.expected}</span>
                <span className="text-slate-400">→</span>
                <span className="ko text-xl font-bold text-rose-600 dark:text-rose-400">{c.chosen}</span>
                <span className="ml-auto text-sm text-slate-500">{c.n}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function TrainerLesson() {
  const { id } = useParams();
  const { pronunciation } = useContent();
  const [params, setParams] = useSearchParams();
  const lesson = pronunciation.lessons.find((l) => l.id === id);
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'theory') as Tab;
  const [round, setRound] = useState(0);
  // váhovanie podľa slabých zvukov – čítame aktuálny stav bez odberu zmien
  const questions = useMemo(() => (lesson ? lessonQuiz(lesson, 12, progressStore.get()) : []), [lesson, round]);

  useEffect(() => {
    if (lesson) visit({ key: `lesson:${lesson.id}`, title: lesson.title, subtitle: `Tréner – ${lesson.subtitle}`, path: `/trener/${lesson.id}` });
  }, [lesson]);

  if (!lesson) return <NotFound />;

  const idx = pronunciation.lessons.indexOf(lesson);
  const nextLesson = pronunciation.lessons[idx + 1];

  return (
    <div>
      <PageHeader back="/trener" eyebrow="Tréner výslovnosti" title={<span className="ko tracking-wider">{lesson.title}</span>} subtitle={lesson.summary} />
      <Tabs tabs={TABS} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />

      {tab === 'theory' && <Theory lesson={lesson} />}
      {tab === 'compare' && <Compare lesson={lesson} />}
      {tab === 'quiz' && (
        <Quiz
          key={lesson.id}
          questions={questions}
          area="pronunciation"
          sessionKey={`lesson:${lesson.id}`}
          sessionTitle={`Kvíz ${lesson.title}`}
          onRestart={() => setRound((r) => r + 1)}
        />
      )}
      {tab === 'pairs' && <Pairs lesson={lesson} />}
      {tab === 'progress' && <LessonProgress lesson={lesson} />}

      {(tab === 'theory' || tab === 'compare') && (
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <button className="btn-primary" onClick={() => setParams({ tab: tab === 'theory' ? 'compare' : 'quiz' }, { replace: true })}>
            {tab === 'theory' ? 'Ďalej: porovnanie zvukov →' : 'Ďalej: kvíz →'}
          </button>
          {nextLesson && (
            <Link to={`/trener/${nextLesson.id}`} className="btn-ghost">
              Ďalšia lekcia: <span className="ko">{nextLesson.title}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
