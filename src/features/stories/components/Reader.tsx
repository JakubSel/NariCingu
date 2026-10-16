import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../../../lib/content';
import { recordPractice, visit } from '../../../lib/progress';
import { RULE_TO_ASSIMILATION } from '../config';
import { useStoryPlayer } from '../hooks/useStoryPlayer';
import { fetchStory, storyAudio } from '../lib/api';
import { useT } from '../lib/i18n';
import { getState, setPrefs, toggleFavorite, updateProgress, useAppState } from '../lib/store';
import { formatTime } from '../lib/sync';
import type { Sentence, Story } from '../types';
import { BackIcon, StarIcon } from './Icons';
import { PlayerBar } from './PlayerBar';
import { SentenceView } from './SentenceView';

// Full-bleed on phones (cancels the px-4/pt-5 of <main> in Layout.tsx), a rounded panel from sm up.
const panel = 'ilgi-reader -mx-4 -mt-5 min-h-[calc(100dvh-3.5rem)] bg-paper sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:border-line';

export function Reader() {
  const { id = '' } = useParams();
  const t = useT();
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setStory(null);
    setError(null);
    fetchStory(id)
      .then((s) => alive && setStory(s))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);

  if (error)
    return (
      <div className={`${panel} px-4 py-10 sm:px-8`}>
        <Link to="/pribehy" className="text-celadon underline">
          {t.back}
        </Link>
        <h1 className="mt-6 text-2xl font-bold">{t.storyError}</h1>
        <p className="mt-2 text-muted">{error}</p>
      </div>
    );
  if (!story) return <div className={panel} aria-busy="true" />;
  return <StoryView key={story.id} story={story} />;
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        on ? 'border-celadon bg-celadon-soft text-ink' : 'border-line text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function isTyping(el: EventTarget | null) {
  const h = el as HTMLElement | null;
  return !!h && (h.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName));
}

function StoryView({ story }: { story: Story }) {
  const t = useT();
  const { prefs, favorites } = useAppState();
  const player = useStoryPlayer(story.sentences, prefs.rate);
  const { active, playing, audioRef } = player;
  const [resumeNote, setResumeNote] = useState<string | null>(null);
  const lastManualScroll = useRef(0);
  const fav = favorites.includes(story.id);
  const lang = 'sk';
  const titleTr = story.titleTranslations?.[lang];
  const { assimilation } = useContent();

  // Pravidlá z poznámok → stránka s vysvetlením v sekcii Asimilácia (len tie, ktoré v obsahu existujú).
  const ruleLinks = useMemo(() => {
    const ids = new Set(assimilation.rules.map((r) => r.id));
    return Object.fromEntries(
      Object.entries(RULE_TO_ASSIMILATION)
        .filter(([, id]) => ids.has(id))
        .map(([rule, id]) => [rule, `/asimilacia/${id}`]),
    );
  }, [assimilation]);

  // Prepojenie s prehľadom: „Nedávno precvičované“ / „Pokračovať“ a séria dní.
  useEffect(() => {
    visit({ key: `story:${story.id}`, title: story.title, subtitle: `Príbeh${titleTr ? ` – ${titleTr}` : ''}`, path: `/pribehy/${story.id}` });
  }, [story.id, story.title, titleTr]);

  const counted = useRef(false);
  useEffect(() => {
    // jedno započítanie za otvorenie príbehu, až keď sa naozaj počúva
    if (playing && !counted.current) {
      counted.current = true;
      recordPractice(`story:${story.id}`);
    }
  }, [playing, story.id]);

  // Resume where the learner stopped last time.
  useEffect(() => {
    const a = audioRef.current;
    const saved = getState().progress[story.id];
    if (!a || !saved || saved.completed || saved.position < 2) return;
    const apply = () => {
      a.currentTime = saved.position;
      setResumeNote(t.resume(formatTime(saved.position)));
    };
    if (a.readyState >= 1) apply();
    else a.addEventListener('loadedmetadata', apply, { once: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);

  useEffect(() => {
    if (playing) setResumeNote(null);
  }, [playing]);

  // Progress: furthest sentence, position every few seconds, completion.
  useEffect(() => {
    if (active >= 0) updateProgress(story.id, { furthest: active });
  }, [active, story.id]);

  useEffect(() => {
    const save = () => {
      const a = audioRef.current;
      if (a && a.currentTime > 0 && !a.ended) updateProgress(story.id, { position: a.currentTime });
    };
    if (!playing) {
      save();
      return;
    }
    const iv = window.setInterval(save, 3000);
    return () => window.clearInterval(iv);
  }, [playing, story.id, audioRef]);

  useEffect(() => {
    if (player.ended > 0) updateProgress(story.id, { completed: true, position: 0, furthest: story.sentences.length - 1 });
  }, [player.ended, story.id, story.sentences.length]);

  // Auto-scroll to the active sentence, unless the learner is scrolling by hand.
  useEffect(() => {
    const mark = () => (lastManualScroll.current = Date.now());
    window.addEventListener('wheel', mark, { passive: true });
    window.addEventListener('touchmove', mark, { passive: true });
    return () => {
      window.removeEventListener('wheel', mark);
      window.removeEventListener('touchmove', mark);
    };
  }, []);

  useEffect(() => {
    if (active < 0 || Date.now() - lastManualScroll.current < 4000) return;
    const el = document.getElementById(`s-${active}`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top > vh * 0.2 && r.bottom < vh * 0.62) return; // already comfortably visible
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [active]);

  // Keyboard shortcuts (only while this page is mounted).
  const playerRef = useRef(player);
  playerRef.current = player;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (e.key === ' ' || e.code === 'Space') {
        if (target?.closest('button, a')) return;
        e.preventDefault();
        player.toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        player.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        player.prev();
      } else if (e.key === 'r' || e.key === 'R') {
        player.setLoop(!player.loop);
      } else if (e.key === 't' || e.key === 'T') {
        setPrefs({ showTranslation: !getState().prefs.showTranslation });
      } else if (e.key === 'p' || e.key === 'P') {
        setPrefs({ showPronunciation: !getState().prefs.showPronunciation });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const paragraphs = useMemo(() => {
    const groups: { sentence: Sentence; index: number }[][] = [];
    let last: number | undefined;
    story.sentences.forEach((sentence, index) => {
      const p = sentence.paragraph ?? 0;
      if (!groups.length || p !== last) groups.push([]);
      groups[groups.length - 1].push({ sentence, index });
      last = p;
    });
    return groups;
  }, [story.sentences]);

  const hasPronunciation = story.sentences.some((s) => s.pronunciation || s.assimilation?.length);
  const hasTranslation = story.sentences.some((s) => s.translations && Object.keys(s.translations).length);
  const isDemo = story.tags?.includes('demo');

  return (
    <div className={panel}>
      <audio ref={audioRef} src={storyAudio(story)} preload="auto" />

      {/* Sticks under the app's mobile header (h-14 + safe area); on desktop there is none. */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80 sm:rounded-t-2xl md:top-0">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2.5">
          <Link to="/pribehy" className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-muted hover:text-ink">
            <BackIcon width={20} height={20} />
            <span className="sr-only sm:not-sr-only">{t.back}</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {hasTranslation && (
              <Toggle on={prefs.showTranslation} label={t.translation} onClick={() => setPrefs({ showTranslation: !prefs.showTranslation })} />
            )}
            {hasPronunciation && (
              <Toggle
                on={prefs.showPronunciation}
                label={t.pronunciation}
                onClick={() => setPrefs({ showPronunciation: !prefs.showPronunciation })}
              />
            )}
            <button
              type="button"
              onClick={() => toggleFavorite(story.id)}
              aria-pressed={fav}
              aria-label={fav ? t.favoriteRemove : t.favoriteAdd}
              title={fav ? t.favoriteRemove : t.favoriteAdd}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-celadon-soft ${fav ? 'text-celadon' : 'text-muted'}`}
            >
              <StarIcon filled={fav} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-56 pt-8 sm:pt-12">
        <h1 lang="ko" className="ko text-[2.2rem] font-bold leading-tight sm:text-[2.6rem]">
          {story.title}
        </h1>
        {titleTr && <p className="mt-1 text-lg text-muted">{titleTr}</p>}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="rounded bg-celadon-soft px-1.5 font-bold text-ink">{story.level}</span>
          {story.duration ? <span>{formatTime(story.duration)}</span> : null}
          <span>{t.sentences(story.sentences.length)}</span>
          {isDemo && <span className="text-plum">{t.demo}</span>}
        </p>

        <div className="mt-8 space-y-7">
          {paragraphs.map((group, gi) => (
            <section key={gi} className="space-y-0.5">
              {group.map(({ sentence, index }) => (
                <SentenceView
                  key={sentence.id ?? index}
                  sentence={sentence}
                  index={index}
                  active={index === active}
                  activeWord={index === active ? player.activeWord : -1}
                  showTranslation={prefs.showTranslation}
                  showPronunciation={prefs.showPronunciation}
                  translationLang={lang}
                  ruleNames={t.rules}
                  ruleLinks={ruleLinks}
                  ruleLinkTitle={t.ruleLink}
                  onSelect={player.seekToSentence}
                />
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 hidden text-sm text-muted sm:block">{t.shortcuts}</p>
      </div>

      <PlayerBar player={player} rate={prefs.rate} total={story.sentences.length} note={resumeNote} />
    </div>
  );
}
