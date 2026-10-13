import { Link } from 'react-router-dom';
import { accText, PageHeader } from '../components/ui';
import { useContent } from '../lib/content';
import { useProgress } from '../lib/progress';

export default function Vocabulary() {
  const { vocabulary } = useContent();
  const p = useProgress();

  return (
    <div>
      <PageHeader
        title="Slovná zásoba"
        subtitle="Slová tu slúžia výslovnosti: pri každom vidíš, ako sa naozaj vyslovuje, a môžeš si ho vypočuť aj vo vete."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {vocabulary.categories.map((c) => {
          const s = p.sessions[`vocab:${c.id}`];
          const changed = c.words.filter((w) => w.pron !== w.ko).length;
          return (
            <Link key={c.id} to={`/slovicka/${c.id}`} className="card card-hover flex flex-col p-4 sm:p-5">
              <span className="text-4xl">{c.icon}</span>
              <span className="mt-3 font-bold">{c.title}</span>
              <span className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{c.description}</span>
              <span className="mt-auto pt-3 text-xs text-slate-400">
                {c.words.length} slov · {changed} so zmenou výslovnosti
                {s && (
                  <>
                    {' '}· <span className={accText(s.best)}>{s.best} %</span>
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
