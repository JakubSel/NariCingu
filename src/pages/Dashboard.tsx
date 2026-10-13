import { Link } from 'react-router-dom';
import { ChevronRight, FlameIcon, PlayIcon, SparkIcon } from '../components/Icons';
import { accColor, accText, ProgressBar, Ring } from '../components/ui';
import { useContent } from '../lib/content';
import { accuracy, dayKey, streak, topConfusions, useProgress, weakSounds, type Progress } from '../lib/progress';
import { useSettings } from '../lib/settings';
import type { Content } from '../types';

interface Suggestion {
  title: string;
  reason: string;
  path: string;
  icon: string;
}

function buildPlan(content: Content, p: Progress, level: string): Suggestion[] {
  const out: Suggestion[] = [];
  const lessons = content.pronunciation.lessons;

  const weak = weakSounds(p).find((w) => lessons.some((l) => l.chars.includes(w.tag)));
  if (weak) {
    const l = lessons.find((x) => x.chars.includes(weak.tag))!;
    out.push({ icon: '🎯', title: `Precvič ${weak.tag} v lekcii ${l.title}`, reason: `Tvoja úspešnosť pri ${weak.tag} je ${weak.acc} %.`, path: `/trener/${l.id}?tab=quiz` });
  } else {
    const l = lessons.find((x) => (p.sessions[`lesson:${x.id}`]?.best ?? 0) < 80) ?? lessons[0];
    if (l)
      out.push({
        icon: '🎯',
        title: `Tréner: ${l.title}`,
        reason: p.sessions[`lesson:${l.id}`] ? `Najlepší výsledok ${p.sessions[`lesson:${l.id}`].best} % – cieľ je 80 %.` : l.subtitle,
        path: `/trener/${l.id}`,
      });
  }

  const rules = content.assimilation.rules;
  const rule =
    rules.find((r) => !p.sessions[`assim:${r.id}`]) ??
    [...rules].sort((a, b) => (p.sessions[`assim:${a.id}`]?.best ?? 0) - (p.sessions[`assim:${b.id}`]?.best ?? 0))[0];
  if (rule)
    out.push({
      icon: '🌊',
      title: `Asimilácia: ${rule.title}`,
      reason: p.sessions[`assim:${rule.id}`] ? `Najlepší výsledok ${p.sessions[`assim:${rule.id}`].best} %.` : rule.short,
      path: `/asimilacia/${rule.id}`,
    });

  const exs = content.listening.exercises;
  const ex =
    exs.find((e) => !p.sessions[`listen:${e.id}:${level}`]) ??
    [...exs].sort((a, b) => (p.sessions[`listen:${a.id}:${level}`]?.best ?? 0) - (p.sessions[`listen:${b.id}:${level}`]?.best ?? 0))[0];
  if (ex) out.push({ icon: ex.icon, title: `Počúvanie: ${ex.title}`, reason: ex.description, path: `/pocuvanie/${ex.id}?level=${level}` });

  return out;
}

const AREAS: { id: string; label: string; path: string }[] = [
  { id: 'pronunciation', label: 'Výslovnosť', path: '/trener' },
  { id: 'listening', label: 'Počúvanie', path: '/pocuvanie' },
  { id: 'assimilation', label: 'Asimilácia', path: '/asimilacia' },
  { id: 'vocabulary', label: 'Slovná zásoba', path: '/slovicka' },
  { id: 'hangul', label: 'Hangul', path: '/hangul' },
];

function timeAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'práve teraz';
  if (m < 60) return `pred ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `pred ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'včera' : `pred ${d} dňami`;
}

export default function Dashboard() {
  const content = useContent();
  const p = useProgress();
  const { level } = useSettings();

  const lessons = content.pronunciation.lessons;
  const rules = content.assimilation.rules;
  const hangulTotal = content.hangul.groups.reduce((s, g) => s + g.items.length, 0);
  const hangulSeen = content.hangul.groups.flatMap((g) => g.items).filter((i) => p.seen[`hangul:${i.char}`]).length;
  const cats = content.vocabulary.categories;
  const exs = content.listening.exercises;

  const mastered = lessons.filter((l) => (p.sessions[`lesson:${l.id}`]?.best ?? 0) >= 80).length;
  const rulesDone = rules.filter((r) => (p.sessions[`assim:${r.id}`]?.best ?? 0) >= 70).length;
  const catsDone = cats.filter((c) => (p.sessions[`vocab:${c.id}`]?.best ?? 0) >= 70).length;
  const exDone = exs.filter((e) => content.listening.levels.some((lv) => (p.sessions[`listen:${e.id}:${lv.id}`]?.best ?? 0) >= 70)).length;

  const parts = [
    { label: 'Tréner výslovnosti', done: mastered, total: lessons.length, path: '/trener', hint: 'lekcií zvládnutých (≥ 80 %)' },
    { label: 'Asimilácia', done: rulesDone, total: rules.length, path: '/asimilacia', hint: 'pravidiel precvičených' },
    { label: 'Hangul', done: hangulSeen, total: hangulTotal, path: '/hangul', hint: 'znakov preskúmaných' },
    { label: 'Tréning počúvania', done: exDone, total: exs.length, path: '/pocuvanie', hint: 'typov cvičení zvládnutých' },
    { label: 'Slovná zásoba', done: catsDone, total: cats.length, path: '/slovicka', hint: 'kategórií precvičených' },
  ];
  const overall = Math.round((parts.reduce((s, x) => s + x.done / Math.max(1, x.total), 0) / parts.length) * 100);

  const today = p.days[dayKey()] ?? 0;
  const st = streak(p);
  const totalAcc = accuracy(
    Object.values(p.areas).reduce((s, c) => ({ c: s.c + c.c, t: s.t + c.t }), { c: 0, t: 0 }),
  );
  const plan = buildPlan(content, p, level);
  const weak = weakSounds(p).slice(0, 5);
  const confusions = topConfusions(p, undefined, 4);
  const last = p.recent[0];
  const lessonOf = (tag: string) => lessons.find((l) => l.chars.includes(tag));

  return (
    <div className="space-y-6">
      {/* Úvod */}
      <section className="relative animate-fadein overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/20 sm:p-8">
        <div className="ko pointer-events-none absolute -right-4 -top-6 select-none text-[9rem] font-black leading-none text-white/10 sm:text-[12rem]">
          소리
        </div>
        <div className="relative">
          <p className="ko text-sm font-medium text-indigo-100">안녕하세요!</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Trénuj ucho, nie len slovíčka.</h1>
          <p className="mt-2 max-w-lg text-indigo-100">
            Nauč sa počuť rozdiel medzi ㄱ ㄲ ㅋ, pochop, prečo 한국말 znie ako [한궁말], a rozumej skutočnej kórejčine.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/denny-trening" className="btn bg-white text-indigo-700 hover:bg-indigo-50">
              <PlayIcon width={16} height={16} /> Denný tréning
            </Link>
            {last ? (
              <Link to={last.path} className="btn bg-white/15 text-white hover:bg-white/25">
                Pokračovať: {last.title} <ChevronRight width={16} height={16} />
              </Link>
            ) : (
              <Link to="/trener/k" className="btn bg-white/15 text-white hover:bg-white/25">
                Začni s ㄱ ㄲ ㅋ <ChevronRight width={16} height={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Rýchle čísla */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card flex items-center gap-3 p-4">
          <Ring value={overall} size={52} stroke={6}>
            <span className="text-xs">{overall}%</span>
          </Ring>
          <div>
            <div className="text-xs text-slate-500">Celkový pokrok</div>
            <div className="font-semibold">kurz</div>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Dnes</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{today}</div>
          <div className="text-xs text-slate-500">odpovedí</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Séria</div>
          <div className="mt-1 flex items-center gap-1 text-2xl font-bold tabular-nums">
            <FlameIcon className={st ? 'text-orange-500' : 'text-slate-300 dark:text-slate-700'} /> {st}
          </div>
          <div className="text-xs text-slate-500">dní v rade</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Úspešnosť</div>
          <div className={`mt-1 text-2xl font-bold tabular-nums ${accText(totalAcc)}`}>{totalAcc === null ? '–' : `${totalAcc} %`}</div>
          <div className="text-xs text-slate-500">všetky odpovede</div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Denný plán */}
        <section className="card p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <SparkIcon className="text-indigo-500" /> Návrh na dnes
            </h2>
            <Link to="/denny-trening" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              Spustiť mix →
            </Link>
          </div>
          <ul className="space-y-2">
            {plan.map((s) => (
              <li key={s.path}>
                <Link
                  to={s.path}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-500/5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">{s.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="ko block truncate font-semibold">{s.title}</span>
                    <span className="block truncate text-sm text-slate-500">{s.reason}</span>
                  </span>
                  <ChevronRight className="shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Problematické zvuky */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold">Problematické zvuky</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-slate-500">
              Zatiaľ žiadne. Po niekoľkých kvízoch tu uvidíš zvuky, ktoré ti robia problém – a aplikácia ti ich bude dávať častejšie.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {weak.map((w) => {
                const l = lessonOf(w.tag);
                const row = (
                  <>
                    <span className="ko w-8 text-2xl font-bold">{w.tag}</span>
                    <div className="flex-1">
                      <ProgressBar value={w.acc} color={accColor(w.acc)} />
                    </div>
                    <span className={`w-12 text-right text-sm font-semibold tabular-nums ${accText(w.acc)}`}>{w.acc} %</span>
                  </>
                );
                return (
                  <li key={w.tag}>
                    {l ? (
                      <Link to={`/trener/${l.id}?tab=quiz`} className="flex items-center gap-3 rounded-lg hover:opacity-80">
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">{row}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {confusions.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="label mb-2">Najčastejšie zámeny</div>
              <div className="flex flex-wrap gap-2">
                {confusions.map((c) => (
                  <span key={c.expected + c.chosen} className="chip ko">
                    {c.expected} → {c.chosen} <span className="text-slate-400">{c.n}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pokrok */}
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Pokrok vo výučbe</h2>
          <ul className="space-y-4">
            {parts.map((x) => (
              <li key={x.label}>
                <Link to={x.path} className="block hover:opacity-80">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{x.label}</span>
                    <span className="tabular-nums text-slate-500">
                      {x.done}/{x.total}
                    </span>
                  </div>
                  <ProgressBar value={(x.done / Math.max(1, x.total)) * 100} />
                  <div className="mt-1 text-xs text-slate-400">{x.hint}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Štatistiky podľa kategórií */}
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Štatistiky podľa kategórií</h2>
          <div className="grid grid-cols-2 gap-3">
            {AREAS.map((a) => {
              const c = p.areas[a.id];
              const acc = accuracy(c);
              return (
                <Link key={a.id} to={a.path} className="rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                  <div className="text-xs text-slate-500">{a.label}</div>
                  <div className={`text-xl font-bold tabular-nums ${accText(acc)}`}>{acc === null ? '–' : `${acc} %`}</div>
                  <div className="text-xs text-slate-400">{c?.t ?? 0} odpovedí</div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Nedávno precvičované */}
      <section className="card p-5">
        <h2 className="mb-3 font-bold">Nedávno precvičované</h2>
        {p.recent.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ešte si nič neprecvičoval. Odporúčame začať lekciou{' '}
            <Link to="/trener/k" className="ko font-semibold text-indigo-600 dark:text-indigo-400">
              ㄱ ㄲ ㅋ
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {p.recent.slice(0, 6).map((r) => (
              <li key={r.key}>
                <Link to={r.path} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <span className="min-w-0 flex-1">
                    <span className="ko block truncate font-medium">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(r.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
