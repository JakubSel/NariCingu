import { useCallback, useEffect, useRef, useState } from 'react';
import { findActiveSegment } from '../lib/sync';
import type { Sentence } from '../types';

/**
 * Audio + timestamp synchronisation, independent of the UI.
 * The <audio> element is rendered by the caller and attached via `audioRef`.
 */
export function useStoryPlayer(sentences: Sentence[], rate: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [active, setActive] = useState(-1);
  const [activeWord, setActiveWord] = useState(-1);
  const [loop, setLoopState] = useState(false);
  const [ended, setEnded] = useState(0); // increments every time playback reaches the end

  const loopIndex = useRef(-1);
  const loopOn = useRef(false);
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  const sync = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const list = sentencesRef.current;
    let t = a.currentTime;
    if (loopOn.current && loopIndex.current >= 0 && !a.paused) {
      const s = list[loopIndex.current];
      const next = list[loopIndex.current + 1];
      const limit = Math.min(s.end + 0.35, next ? next.start - 0.02 : Infinity);
      if (t >= limit || t < s.start - 0.5) {
        a.currentTime = s.start;
        t = s.start;
      }
    }
    const idx = findActiveSegment(list, t);
    setActive(idx);
    const words = idx >= 0 ? list[idx].words : undefined;
    setActiveWord(words?.length ? findActiveSegment(words, t, 0.02) : -1);
    setTime((prev) => (Math.abs(prev - t) >= 0.1 ? t : prev));
  }, []);

  // Animation-frame loop while playing: smooth, precise highlighting.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      sync();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, sync]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.defaultPlaybackRate = rate;
    a.playbackRate = rate;
  }, [rate]);

  // Native audio events.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      sync();
    };
    const onEnded = () => {
      setPlaying(false);
      setEnded((n) => n + 1);
    };
    const onMeta = () => {
      setDuration(a.duration || 0);
      a.playbackRate = a.defaultPlaybackRate;
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('seeked', sync);
    if (a.readyState >= 1) onMeta();
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('seeked', sync);
    };
  }, [sync]);

  const play = useCallback(() => {
    void audioRef.current?.play().catch(() => setPlaying(false));
  }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) play();
    else a.pause();
  }, [play]);

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.max(0, Math.min(t, a.duration || t));
      sync();
    },
    [sync],
  );

  const seekToSentence = useCallback(
    (i: number, autoplay = true) => {
      const list = sentencesRef.current;
      if (i < 0 || i >= list.length) return;
      if (loopOn.current) loopIndex.current = i;
      seek(list[i].start);
      if (autoplay) play();
    },
    [seek, play],
  );

  const next = useCallback(() => {
    const i = findActiveSegment(sentencesRef.current, audioRef.current?.currentTime ?? 0);
    seekToSentence(Math.min(i + 1, sentencesRef.current.length - 1), !audioRef.current?.paused);
  }, [seekToSentence]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    const list = sentencesRef.current;
    const i = findActiveSegment(list, a?.currentTime ?? 0);
    // Like a music player: first press restarts the sentence, second goes back.
    const target = i >= 0 && (a?.currentTime ?? 0) - list[i].start > 1.2 ? i : i - 1;
    seekToSentence(Math.max(target, 0), !a?.paused);
  }, [seekToSentence]);

  const restart = useCallback(() => {
    loopIndex.current = loopOn.current ? 0 : -1;
    seek(0);
    play();
  }, [seek, play]);

  const setLoop = useCallback((on: boolean) => {
    loopOn.current = on;
    loopIndex.current = on ? Math.max(0, findActiveSegment(sentencesRef.current, audioRef.current?.currentTime ?? 0)) : -1;
    setLoopState(on);
  }, []);

  return {
    audioRef,
    playing,
    time,
    duration,
    active,
    activeWord,
    loop,
    ended,
    play,
    pause,
    toggle,
    seek,
    seekToSentence,
    next,
    prev,
    restart,
    setLoop,
  };
}

export type StoryPlayer = ReturnType<typeof useStoryPlayer>;
