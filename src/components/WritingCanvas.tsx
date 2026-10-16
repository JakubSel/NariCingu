import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '../lib/utils';

/** Bod ťahu v relatívnych súradniciach 0–1, aby ťahy prežili zmenu veľkosti okna. */
type Point = [number, number];

export interface WritingCanvasHandle {
  undo: () => void;
  clear: () => void;
  isEmpty: () => boolean;
}

interface Props {
  /** Správne napísané slovo – zobrazí sa na pozadí po odhalení. */
  answer: string;
  revealed: boolean;
  /** Slabé vodítko počas písania (obťahovanie). */
  guide?: boolean;
  onStrokesChange?: (count: number) => void;
}

const MAX_CELL = 220;

/** Plocha na písanie rukou: jedno políčko na každú slabiku, správny tvar sa ukáže na pozadí. */
const WritingCanvas = forwardRef<WritingCanvasHandle, Props>(function WritingCanvas({ answer, revealed, guide, onStrokesChange }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const current = useRef<Point[] | null>(null);
  const [width, setWidth] = useState(0);

  const syllables = [...answer.replace(/\s+/g, '')];
  const n = Math.max(1, syllables.length);
  const cell = width ? Math.min(width / n, MAX_CELL) : 0;
  const height = cell;
  const lineWidth = Math.max(3, cell / 16);

  // sledovanie šírky kontajnera
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = c.width / dpr;
    const H = c.height / dpr;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = getComputedStyle(c).color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes.current) {
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)));
      if (s.length === 1) ctx.lineTo(s[0][0] * W + 0.1, s[0][1] * H);
      ctx.stroke();
    }
  }, [lineWidth]);

  // veľkosť plátna podľa kontajnera (ostré aj na retina displejoch)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    redraw();
  }, [width, height, redraw]);

  // nové slovo = čisté plátno
  useEffect(() => {
    strokes.current = [];
    onStrokesChange?.(0);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  // prekresli pri zmene témy (iná farba pera)
  useEffect(() => {
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, [redraw]);

  useImperativeHandle(ref, () => ({
    undo() {
      strokes.current.pop();
      onStrokesChange?.(strokes.current.length);
      redraw();
    },
    clear() {
      strokes.current = [];
      onStrokesChange?.(0);
      redraw();
    },
    isEmpty: () => strokes.current.length === 0,
  }));

  function pos(e: React.PointerEvent): Point {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }

  function onDown(e: React.PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    current.current = [pos(e)];
    strokes.current.push(current.current);
    redraw();
  }

  function onMove(e: React.PointerEvent) {
    if (!current.current) return;
    e.preventDefault();
    current.current.push(pos(e));
    redraw();
  }

  function onUp() {
    if (!current.current) return;
    current.current = null;
    onStrokesChange?.(strokes.current.length);
  }

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border-2 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        style={{ width: cell * n || '100%', height: height || 200 }}
      >
        {/* políčka pre slabiky s pomocnými čiarami */}
        <div className="absolute inset-0 flex">
          {syllables.map((s, i) => (
            <div key={i} className="relative h-full flex-1 border-slate-200 dark:border-slate-700 [&:not(:last-child)]:border-r-2">
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-800" />
              <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-200 dark:border-slate-800" />
              <div
                className={cn(
                  'ko absolute inset-0 grid select-none place-items-center font-bold leading-none transition-opacity duration-500',
                  revealed ? 'text-indigo-500 opacity-40 dark:text-indigo-400' : guide ? 'text-slate-400 opacity-20' : 'opacity-0',
                )}
                style={{ fontSize: cell * 0.78 }}
                aria-hidden={!revealed}
              >
                {s}
              </div>
            </div>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none text-slate-900 dark:text-slate-100"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label="Plocha na písanie"
        />
      </div>
    </div>
  );
});

export default WritingCanvas;
