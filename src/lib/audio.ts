import { settingsStore } from './settings';

type Listener = () => void;
const listeners = new Set<Listener>();
let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function refreshVoices() {
  if (!ttsSupported) return;
  voices = window.speechSynthesis.getVoices();
  if (voices.length) voicesLoaded = true;
  listeners.forEach((l) => l());
}

if (ttsSupported) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  // niektoré prehliadače udalosť voiceschanged nevyvolajú
  setTimeout(() => {
    voicesLoaded = true;
    refreshVoices();
  }, 1500);
}

export function onVoicesChanged(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function koreanVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));
}

export function voicesReady() {
  return voicesLoaded;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const ko = koreanVoices();
  const wanted = settingsStore.get().voiceURI;
  return (
    ko.find((v) => v.voiceURI === wanted) ??
    ko.find((v) => /google|natural|neural|online/i.test(v.name)) ??
    ko[0]
  );
}

let currentAudio: HTMLAudioElement | null = null;
/** Každé nové prehrávanie zvýši token – staršie prehrávania sa tak zrušia. */
let token = 0;

export function stop() {
  token++;
  currentAudio?.pause();
  currentAudio = null;
  if (ttsSupported) window.speechSynthesis.cancel();
}

export interface PlayOptions {
  text: string;
  audio?: string;
  /** Násobok globálnej rýchlosti z nastavení. */
  rate?: number;
}

function resolveAudio(src: string) {
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  return import.meta.env.BASE_URL + src.replace(/^\//, '');
}

function playOne({ text, audio, rate = 1 }: PlayOptions, my: number): Promise<void> {
  const speed = settingsStore.get().rate * rate;
  if (audio) {
    return new Promise((resolve) => {
      const el = new Audio(resolveAudio(audio));
      currentAudio = el;
      el.playbackRate = Math.min(Math.max(speed, 0.5), 2);
      const fallback = () => (my === token ? speak(text, speed, my).then(resolve) : resolve());
      el.onended = () => resolve();
      el.onerror = fallback;
      el.play().catch(fallback);
    });
  }
  return speak(text, speed, my);
}

function speak(text: string, rate: number, my: number): Promise<void> {
  if (!ttsSupported) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = Math.min(Math.max(rate, 0.3), 2);
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    u.onend = finish;
    u.onerror = finish;
    // poistka – niektoré prehliadače onend nevyvolajú
    setTimeout(finish, 1500 + (text.length * 500) / u.rate);
    // Chrome potrebuje po cancel() krátku pauzu
    setTimeout(() => {
      if (my === token) window.speechSynthesis.speak(u);
      else finish();
    }, 60);
  });
}

/** Prehrá nahrávku (ak je k dispozícii) alebo kórejskú syntézu reči. */
export function play(opts: PlayOptions): Promise<void> {
  stop();
  return playOne(opts, token);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Prehrá viac položiek za sebou. Ak sa medzitým spustí iné prehrávanie, sekvencia sa ukončí. */
export async function playSequence(items: PlayOptions[], gapMs = 450): Promise<void> {
  stop();
  const my = token;
  for (let i = 0; i < items.length; i++) {
    if (my !== token) return;
    await playOne(items[i], my);
    if (i < items.length - 1) await wait(gapMs);
  }
}
