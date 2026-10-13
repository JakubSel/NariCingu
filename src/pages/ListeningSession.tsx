import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Quiz from '../components/Quiz';
import { PageHeader } from '../components/ui';
import { useContent } from '../lib/content';
import { listeningQuiz } from '../lib/generators';
import { progressStore, visit } from '../lib/progress';
import { useSettings } from '../lib/settings';
import NotFound from './NotFound';

export default function ListeningSession() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const content = useContent();
  const settings = useSettings();
  const navigate = useNavigate();
  const ex = content.listening.exercises.find((e) => e.id === id);
  const level =
    content.listening.levels.find((l) => l.id === (params.get('level') ?? settings.level)) ?? content.listening.levels[0];
  const [round, setRound] = useState(0);
  const questions = useMemo(() => (ex && level ? listeningQuiz(ex, level, content, progressStore.get()) : []), [ex, level, content, round]);

  useEffect(() => {
    if (ex && level)
      visit({ key: `listen:${ex.id}`, title: ex.title, subtitle: `Počúvanie – ${level.title}`, path: `/pocuvanie/${ex.id}?level=${level.id}` });
  }, [ex, level]);

  if (!ex || !level) return <NotFound />;

  return (
    <div>
      <PageHeader back="/pocuvanie" eyebrow={`Tréning počúvania · ${level.title}`} title={ex.title} subtitle={ex.description} />
      <Quiz
        key={`${ex.id}-${level.id}`}
        questions={questions}
        area="listening"
        sessionKey={`listen:${ex.id}:${level.id}`}
        sessionTitle={`${ex.title} (${level.title})`}
        intro={`${level.description} Zvuk sa prehrá automaticky – môžeš ho opakovať.`}
        onRestart={() => setRound((r) => r + 1)}
        onExit={() => navigate('/pocuvanie')}
        exitLabel="Iné cvičenie"
      />
    </div>
  );
}
