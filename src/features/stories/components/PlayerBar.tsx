import type { StoryPlayer } from '../hooks/useStoryPlayer';
import { useT } from '../lib/i18n';
import { setPrefs } from '../lib/store';
import { formatTime } from '../lib/sync';
import { LoopIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, RestartIcon } from './Icons';

const SPEEDS = [0.75, 1, 1.25];

const iconBtn =
  'inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-celadon-soft disabled:opacity-40';

export function PlayerBar({ player, rate, total, note }: { player: StoryPlayer; rate: number; total: number; note?: string | null }) {
  const t = useT();
  const { playing, time, duration, active, loop } = player;

  return (
    // md:left-64 leaves the app's desktop sidebar (Layout.tsx) uncovered.
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85 md:left-64">
      <div className="mx-auto max-w-3xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex items-center gap-3 text-sm tabular-nums text-muted">
          <span className="w-10 text-right">{formatTime(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label={t.seek}
            className="h-1.5 min-w-0 flex-1 cursor-pointer"
          />
          <span className="w-10">{formatTime(duration)}</span>
          <span className="hidden w-12 text-right sm:inline" aria-hidden>
            {active >= 0 ? active + 1 : 0}/{total}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className={iconBtn} onClick={player.restart} title={t.restart} aria-label={t.restart}>
              <RestartIcon />
            </button>
            <button
              type="button"
              className={`${iconBtn} ${loop ? 'bg-celadon-soft text-celadon' : ''}`}
              onClick={() => player.setLoop(!loop)}
              aria-pressed={loop}
              title={t.loop}
              aria-label={t.loop}
            >
              <LoopIcon />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button type="button" className={iconBtn} onClick={player.prev} title={t.prev} aria-label={t.prev}>
              <PrevIcon />
            </button>
            <button
              type="button"
              onClick={player.toggle}
              aria-label={playing ? t.pause : t.play}
              title={playing ? t.pause : t.play}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-celadon text-celadon-ink shadow-sm transition-transform active:scale-95"
            >
              {playing ? <PauseIcon width={26} height={26} /> : <PlayIcon width={26} height={26} />}
            </button>
            <button type="button" className={iconBtn} onClick={player.next} title={t.next} aria-label={t.next}>
              <NextIcon />
            </button>
          </div>

          {/* Phones: one button that cycles the speed. Wider screens: all three visible. */}
          <button
            type="button"
            onClick={() => setPrefs({ rate: SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length] ?? 1 })}
            aria-label={`${t.speed}: ${rate}×`}
            className="w-14 rounded-full border border-line py-2 text-sm tabular-nums sm:hidden"
          >
            {rate}×
          </button>
          <div role="group" aria-label={t.speed} className="hidden rounded-full border border-line p-0.5 text-sm sm:flex">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={rate === s}
                onClick={() => setPrefs({ rate: s })}
                className={`rounded-full px-2 py-1.5 tabular-nums transition-colors sm:px-2.5 ${
                  rate === s ? 'bg-celadon text-celadon-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
        {note && (
          <p className="pt-1 text-center text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
