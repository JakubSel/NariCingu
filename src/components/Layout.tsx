import { useEffect, useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { koreanVoices, onVoicesChanged, ttsSupported, voicesReady } from '../lib/audio';
import { streak, useProgress } from '../lib/progress';
import { updateSettings, useSettings } from '../lib/settings';
import { cn } from '../lib/utils';
import { BookIcon, FlameIcon, HanIcon, HeadphonesIcon, HomeIcon, MoonIcon, PenIcon, SlidersIcon, SunIcon, TargetIcon, WavesIcon, XIcon } from './Icons';

const NAV: { to: string; label: string; short: string; icon: ComponentType<{ className?: string }>; end?: boolean }[] = [
  { to: '/', label: 'Prehľad', short: 'Domov', icon: HomeIcon, end: true },
  { to: '/hangul', label: 'Hangul', short: 'Hangul', icon: HanIcon },
  { to: '/trener', label: 'Tréner výslovnosti', short: 'Tréner', icon: TargetIcon },
  { to: '/asimilacia', label: 'Asimilácia', short: 'Zmeny', icon: WavesIcon },
  { to: '/pocuvanie', label: 'Tréning počúvania', short: 'Počúvanie', icon: HeadphonesIcon },
  { to: '/pisanie', label: 'Písanie', short: 'Písanie', icon: PenIcon },
  { to: '/slovicka', label: 'Slovná zásoba', short: 'Slová', icon: BookIcon },
];

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function useThemeEffect() {
  const { theme } = useSettings();
  useEffect(() => {
    const mq = darkQuery();
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#4f46e5');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

function ThemeToggle() {
  const { theme } = useSettings();
  const isDark = theme === 'dark' || (theme === 'system' && darkQuery().matches);
  return (
    <button
      className="btn-ghost h-10 w-10 p-0"
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      title={isDark ? 'Svetlý režim' : 'Tmavý režim'}
      aria-label="Prepnúť tmavý režim"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function VoiceBanner() {
  const [state, setState] = useState<'ok' | 'missing' | 'unsupported' | 'loading'>('loading');
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('voice-banner') === '1');

  useEffect(() => {
    if (!ttsSupported) return setState('unsupported');
    const check = () => {
      if (koreanVoices().length) setState('ok');
      else if (voicesReady()) setState('missing');
    };
    check();
    const off = onVoicesChanged(check);
    const t = setTimeout(check, 1700);
    return () => {
      off();
      clearTimeout(t);
    };
  }, []);

  if (dismissed || state === 'ok' || state === 'loading') return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <span className="text-lg">🔈</span>
      <div className="flex-1">
        {state === 'unsupported' ? (
          <p>Tento prehliadač nepodporuje syntézu reči. Skús Chrome, Edge alebo Safari.</p>
        ) : (
          <p>
            <b>Nenašiel sa kórejský hlas.</b> Zvuk nemusí znieť správne. Najlepšie funguje Chrome alebo Edge. Na Windowse pridaj hlas cez{' '}
            <i>Nastavenia → Čas a jazyk → Reč → Pridať hlasy → Kórejčina</i>, na iPhone cez <i>Nastavenia → Prístupnosť → Hovorený obsah → Hlasy</i>, na Androide
            nainštaluj kórejčinu v <i>Google prevod textu na reč</i>.
          </p>
        )}
      </div>
      <button
        className="rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20"
        onClick={() => {
          sessionStorage.setItem('voice-banner', '1');
          setDismissed(true);
        }}
        aria-label="Zavrieť"
      >
        <XIcon width={16} height={16} />
      </button>
    </div>
  );
}

function StreakBadge() {
  const p = useProgress();
  const s = streak(p);
  if (!s) return null;
  return (
    <span className="chip bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" title="Dni v rade">
      <FlameIcon width={14} height={14} /> {s}
    </span>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useThemeEffect();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen md:flex">
      {/* Bočný panel – desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2.5 px-3">
          <span className="ko grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">소</span>
          <span>
            <span className="block font-bold leading-tight">NariCingu</span>
            <span className="block text-xs text-slate-500">kórejská výslovnosť</span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-slate-200 px-1 pt-3 dark:border-slate-800">
          <NavLink
            to="/nastavenia"
            className={({ isActive }) => cn('btn-ghost px-3', isActive && 'text-indigo-600 dark:text-indigo-300')}
          >
            <SlidersIcon width={18} height={18} /> Nastavenia
          </NavLink>
          <ThemeToggle />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Horná lišta – mobil */}
        <header className="safe-top sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 md:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="ko grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 font-bold text-white">소</span>
              <span className="font-bold">NariCingu</span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <StreakBadge />
              <ThemeToggle />
              <Link to="/nastavenia" className="btn-ghost h-10 w-10 p-0" aria-label="Nastavenia">
                <SlidersIcon />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-8 lg:px-8">
          <VoiceBanner />
          <Outlet />
        </main>

        {/* Spodná navigácia – mobil */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <div className="grid grid-cols-7">
            {NAV.map(({ to, short, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-col items-center gap-0.5 truncate py-2 text-[10px] font-medium',
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {short}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
