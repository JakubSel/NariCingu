import { useEffect, useRef, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '../components/Icons';
import PlayButton from '../components/PlayButton';
import { PageHeader } from '../components/ui';
import { koreanVoices, onVoicesChanged, ttsSupported } from '../lib/audio';
import { progressStore, type Progress } from '../lib/progress';
import { updateSettings, useSettings, type Theme } from '../lib/settings';
import { cn } from '../lib/utils';

function useKoreanVoices() {
  const [voices, setVoices] = useState(koreanVoices);
  useEffect(() => onVoicesChanged(() => setVoices(koreanVoices())), []);
  return voices;
}

export default function Settings() {
  const s = useSettings();
  const voices = useKoreanVoices();
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportProgress() {
    const blob = new Blob([JSON.stringify(progressStore.get(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `naricingu-pokrok-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importProgress(file: File) {
    try {
      const data = JSON.parse(await file.text()) as Progress;
      if (data?.v !== 1 || typeof data.sounds !== 'object') throw new Error();
      progressStore.replace(data);
      setMsg('Pokrok bol úspešne načítaný.');
    } catch {
      setMsg('Súbor sa nepodarilo načítať – nie je to záloha z NariCingu.');
    }
  }

  const themes: { id: Theme; label: string; icon: JSX.Element }[] = [
    { id: 'light', label: 'Svetlý', icon: <SunIcon /> },
    { id: 'dark', label: 'Tmavý', icon: <MoonIcon /> },
    { id: 'system', label: 'Podľa systému', icon: <MonitorIcon /> },
  ];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nastavenia" subtitle="Všetko sa ukladá len v tvojom prehliadači." />

      <section className="card mb-4 p-5">
        <h2 className="mb-3 font-bold">Vzhľad</h2>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSettings({ theme: t.id })}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition',
                s.theme === t.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card mb-4 space-y-5 p-5">
        <h2 className="font-bold">Zvuk</h2>
        {!ttsSupported && <p className="text-sm text-rose-600">Tento prehliadač nepodporuje syntézu reči.</p>}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <label htmlFor="rate" className="font-medium">
              Rýchlosť reči
            </label>
            <span className="tabular-nums text-slate-500">{s.rate.toFixed(2)}×</span>
          </div>
          <input
            id="rate"
            type="range"
            min={0.5}
            max={1.3}
            step={0.05}
            value={s.rate}
            onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>pomaly</span>
            <span>prirodzene</span>
          </div>
        </div>

        <div>
          <label htmlFor="voice" className="mb-2 block text-sm font-medium">
            Kórejský hlas
          </label>
          <div className="flex gap-2">
            <select
              id="voice"
              value={s.voiceURI}
              onChange={(e) => updateSettings({ voiceURI: e.target.value })}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Automaticky</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} {v.localService ? '' : '(online)'}
                </option>
              ))}
            </select>
            <PlayButton text="안녕하세요. 가, 까, 카." title="Vyskúšať hlas" />
          </div>
          {voices.length === 0 && ttsSupported && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Nenašiel sa žiadny kórejský hlas. Najlepšie funguje Chrome alebo Edge.</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Rozdiel ㄱ / ㄲ / ㅋ je najlepšie počuť pri kvalitných hlasoch (Google, Microsoft „Natural“/„Online“).
          </p>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium">Automatické prehrávanie</span>
            <span className="block text-xs text-slate-500">V kvízoch prehrať zvuk hneď pri novej otázke a po chybe porovnať zvuky.</span>
          </span>
          <input type="checkbox" checked={s.autoplay} onChange={(e) => updateSettings({ autoplay: e.target.checked })} className="h-5 w-5 accent-indigo-600" />
        </label>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-bold">Pokrok</h2>
        <p className="mb-4 text-sm text-slate-500">Pokrok sa ukladá v localStorage tohto prehliadača. Zálohu si môžeš stiahnuť a preniesť do iného zariadenia.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportProgress}>
            Stiahnuť zálohu
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Načítať zálohu
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importProgress(f);
              e.target.value = '';
            }}
          />
          {!confirmReset ? (
            <button className="btn-ghost text-rose-600 dark:text-rose-400" onClick={() => setConfirmReset(true)}>
              Vymazať pokrok
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-1.5 text-sm dark:bg-rose-500/10">
              Naozaj vymazať všetko?
              <button
                className="btn bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                onClick={() => {
                  progressStore.reset();
                  setConfirmReset(false);
                  setMsg('Pokrok bol vymazaný.');
                }}
              >
                Áno
              </button>
              <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirmReset(false)}>
                Nie
              </button>
            </span>
          )}
        </div>
        {msg && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">
        NariCingu · obsah sa načítava zo súborov <code>data/*.json</code>
      </p>
    </div>
  );
}
