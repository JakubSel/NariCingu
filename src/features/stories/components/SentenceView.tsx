import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Sentence } from '../types';

interface Props {
  sentence: Sentence;
  index: number;
  active: boolean;
  /** index into sentence.words, only meaningful for the active sentence */
  activeWord: number;
  showTranslation: boolean;
  showPronunciation: boolean;
  translationLang: string;
  ruleNames: Record<string, string>;
  /** rule → in-app path explaining it (e.g. /asimilacia/nasalization) */
  ruleLinks: Record<string, string>;
  ruleLinkTitle: (name: string) => string;
  onSelect: (index: number) => void;
}

function SentenceViewImpl({
  sentence,
  index,
  active,
  activeWord,
  showTranslation,
  showPronunciation,
  translationLang,
  ruleNames,
  ruleLinks,
  ruleLinkTitle,
  onSelect,
}: Props) {
  const translation = sentence.translations?.[translationLang] ?? Object.values(sentence.translations ?? {})[0];
  const words = sentence.words?.length ? sentence.words : null;
  // Plain linking/final-consonant changes are already visible in the [pronunciation]
  // line, so the list only explains the less obvious sound changes.
  const notes = (sentence.assimilation ?? []).filter((n) => (n.rules ?? ['other']).some((r) => r !== 'liaison' && r !== 'final'));
  const showNotes = showPronunciation && notes.length > 0;
  const hasGrammar = !!sentence.grammar?.length;

  return (
    // Only the sentence itself is the (seek) button; notes below hold links, which must not sit inside a button.
    <div className="-mx-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface">
      <button
        type="button"
        id={`s-${index}`}
        data-active={active}
        aria-current={active ? 'true' : undefined}
        onClick={() => onSelect(index)}
        className="block w-full cursor-pointer rounded-lg text-left"
      >
        <span lang="ko" className="ko block text-[1.45rem] leading-[1.9] sm:text-[1.6rem]">
          {words ? (
            words.map((w, i) => (
              <span key={i}>
                {i > 0 && ' '}
                <span className="word-marker" data-on={active && i === activeWord}>
                  {w.text}
                </span>
              </span>
            ))
          ) : (
            <span className="marker" data-on={active}>
              {sentence.text}
            </span>
          )}
        </span>

        {showPronunciation && sentence.pronunciation && (
          <span lang="ko" className="ko mt-0.5 block text-lg text-plum">
            [{sentence.pronunciation}]
          </span>
        )}

        {showTranslation && translation && <span className="mt-0.5 block text-[1.02rem] text-muted">{translation}</span>}
      </button>

      {showNotes && (
        <ul className="mt-1.5 space-y-1 text-[0.9rem] leading-snug">
          {notes.map((n, i) => (
            <li key={i}>
              <span lang="ko" className="ko">
                {n.text}
              </span>
              <span className="text-muted"> → </span>
              <span lang="ko" className="ko text-plum">
                {n.pronunciation}
              </span>
              {n.rules?.length ? (
                <span className="ml-2">
                  {n.rules.map((r, ri) => {
                    const name = ruleNames[r] ?? r;
                    const to = ruleLinks[r];
                    return (
                      <span key={r}>
                        {ri > 0 && ', '}
                        {to ? (
                          <Link to={to} title={ruleLinkTitle(name)} className="text-celadon underline decoration-celadon/40 underline-offset-2 hover:decoration-celadon">
                            {name}
                          </Link>
                        ) : (
                          <span className="text-celadon">{name}</span>
                        )}
                      </span>
                    );
                  })}
                  <span className="text-celadon">:</span>
                </span>
              ) : null}
              {n.note && <span className="text-muted"> {n.note}</span>}
            </li>
          ))}
        </ul>
      )}

      {hasGrammar && (
        <ul className="mt-2 space-y-1 border-l-2 border-celadon pl-3 text-[0.92rem]">
          {sentence.grammar!.map((g, i) => (
            <li key={i}>
              {g.text && (
                <span lang="ko" className="ko mr-1.5 font-bold">
                  {g.text}
                </span>
              )}
              {g.note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const SentenceView = memo(SentenceViewImpl);
