import { useState, type ReactNode } from 'react';
import { play, playSequence, type PlayOptions } from '../lib/audio';
import { cn } from '../lib/utils';
import { VolumeIcon } from './Icons';

interface Props {
  text?: string;
  audio?: string;
  rate?: number;
  /** Ak je zadané, prehrá sa celá sekvencia. */
  sequence?: PlayOptions[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'soft' | 'ghost';
  label?: ReactNode;
  className?: string;
  title?: string;
  onPlayed?: () => void;
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-24 w-24',
};

const iconSizes = { sm: 16, md: 18, lg: 24, xl: 40 };

export default function PlayButton({
  text = '',
  audio,
  rate,
  sequence,
  size = 'md',
  variant = 'soft',
  label,
  className,
  title,
  onPlayed,
}: Props) {
  const [playing, setPlaying] = useState(false);

  async function handle(e: React.MouseEvent) {
    // tlačidlo môže byť vnorené v odkaze alebo karte – neaktivuj ich
    e.preventDefault();
    e.stopPropagation();
    setPlaying(true);
    try {
      if (sequence) await playSequence(sequence);
      else await play({ text, audio, rate });
    } finally {
      setPlaying(false);
      onPlayed?.();
    }
  }

  const styles = {
    solid: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25',
    soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-300',
  }[variant];

  if (label)
    return (
      <button
        type="button"
        onClick={handle}
        title={title ?? 'Prehrať'}
        className={cn('btn', styles, playing && 'ring-2 ring-indigo-400', className)}
      >
        <VolumeIcon width={16} height={16} className={playing ? 'animate-pulse' : ''} />
        {label}
      </button>
    );

  return (
    <button
      type="button"
      onClick={handle}
      title={title ?? 'Prehrať'}
      aria-label={title ?? `Prehrať ${text}`}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full transition active:scale-95',
        sizes[size],
        styles,
        playing && 'ring-4 ring-indigo-400/40',
        className,
      )}
    >
      <VolumeIcon width={iconSizes[size]} height={iconSizes[size]} className={playing ? 'animate-pulse' : ''} />
    </button>
  );
}
