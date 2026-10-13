import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckIcon, XIcon } from '../components/Icons';
import PlayButton from '../components/PlayButton';
import Quiz from '../components/Quiz';
import { PageHeader, Tabs } from '../components/ui';
import { play } from '../lib/audio';
import { useContent } from '../lib/content';
import { hangulQuiz } from '../lib/generators';
import { markSeen, useProgress, visit } from '../lib/progress';
import { cn } from '../lib/utils';
import type { HangulItem } from '../types';

function Detail({ item, onClose }: { item: HangulItem; onClose: () => void }) {
  useEffect(() => {
    markSeen(`hangul:${item.char}`);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${item.char} – ${item.name}`}
        className="safe-bottom max-h-[90vh] w-full max-w-lg animate-fadein overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="ko grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-6xl font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {item.char}
          </div>
          <div className="min-w-0 flex-1">
            <div className="ko text-xl font-bold">{item.name}</div>
            {item.nameRom && <div className="text-sm text-slate-500">{item.nameRom}</div>}
            <div className="mt-2 flex flex-wrap gap-2">
              <PlayButton text={item.sound} audio={item.audio} label={<span className="ko">{item.sound}</span>} className="px-3 py-1.5" />
              {item.name !== item.sound && <PlayButton text={item.name} label="Názov" variant="ghost" className="px-3 py-1.5" />}
            </div>
          </div>
          <button className="btn-ghost h-9 w-9 p-0" onClick={onClose} aria-label="Zavrieť">
            <XIcon />
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <div className="label text-amber-700 dark:text-amber-300">Po slovensky približne</div>
          <div className="mt-0.5 font-semibold">{item.slovak}</div>
        </div>

        <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">{item.explanation}</p>
        {item.tip && <p className="mt-3 rounded-xl border-l-4 border-indigo-400 bg-indigo-50/60 p-3 text-sm dark:bg-indigo-500/10">💡 {item.tip}</p>}

        <div className="mt-5">
          <div className="label mb-2">Príklady</div>
          <ul className="space-y-2">
            {item.examples.map((ex) => (
              <li key={ex.ko} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <PlayButton text={ex.ko} audio={ex.audio} size="sm" />
                <span className="ko text-lg font-semibold">{ex.ko}</span>
                {ex.rom && <span className="text-sm text-slate-500">{ex.rom}</span>}
                <span className="ml-auto text-right text-sm text-slate-600 dark:text-slate-300">{ex.sk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Hangul() {
  const { hangul } = useContent();
  const p = useProgress();
  const [params, setParams] = useSearchParams();
  const groupId = params.get('g') ?? hangul.groups[0]?.id;
  const mode = params.get('mode') === 'quiz' ? 'quiz' : 'learn';
  const group = hangul.groups.find((g) => g.id === groupId) ?? hangul.groups[0];
  const [open, setOpen] = useState<HangulItem | null>(null);
  const [round, setRound] = useState(0);
  const questions = useMemo(() => (group ? hangulQuiz(group, 10) : []), [group, round]);

  useEffect(() => {
    visit({ key: 'hangul', title: 'Hangul', subtitle: group?.title, path: `/hangul?g=${group?.id}` });
  }, [group]);

  if (!group) return null;
  const set = (patch: Record<string, string>) => setParams({ g: group.id, mode, ...patch }, { replace: true });

  return (
    <div>
      <PageHeader
        title="Hangul"
        subtitle="Kórejské písmo z pohľadu slovenčiny. Klikni na znak – uvidíš výslovnosť, slovenský ekvivalent a príklady."
        right={
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            {(['learn', 'quiz'] as const).map((m) => (
              <button
                key={m}
                onClick={() => set({ mode: m })}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-semibold',
                  mode === m ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-500',
                )}
              >
                {m === 'learn' ? 'Učiť sa' : 'Kvíz'}
              </button>
            ))}
          </div>
        }
      />

      <Tabs
        tabs={hangul.groups.map((g) => ({ id: g.id, label: g.title }))}
        value={group.id}
        onChange={(g) => set({ g })}
      />

      {mode === 'learn' ? (
        <>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{group.description}</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {group.items.map((item) => {
              const seen = !!p.seen[`hangul:${item.char}`];
              return (
                <div key={item.char} className="card card-hover group relative">
                  <button
                    onClick={() => {
                      setOpen(item);
                      play({ text: item.sound, audio: item.audio });
                    }}
                    className="flex w-full flex-col items-center px-2 pb-3 pt-4"
                  >
                    <span className="ko text-4xl font-bold">{item.char}</span>
                    <span className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{item.rom}</span>
                    <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{item.slovak}</span>
                  </button>
                  {seen && (
                    <span className="absolute right-2 top-2 text-emerald-500" title="Preskúmané">
                      <CheckIcon width={14} height={14} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <Quiz
          key={group.id}
          questions={questions}
          area="hangul"
          sessionKey={`hangul:${group.id}`}
          sessionTitle={`Hangul – ${group.title}`}
          intro="Zaznie zvuk – vyber písmeno, ktoré mu zodpovedá."
          onRestart={() => setRound((r) => r + 1)}
        />
      )}

      {open && <Detail item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
