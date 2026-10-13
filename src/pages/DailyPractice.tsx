import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import { PageHeader } from '../components/ui';
import { useContent } from '../lib/content';
import { dailyMix } from '../lib/generators';
import { progressStore, visit } from '../lib/progress';

export default function DailyPractice() {
  const content = useContent();
  const navigate = useNavigate();
  // otázky sa generujú raz – nie pri každej zmene pokroku
  const [questions, setQuestions] = useState(() => dailyMix(content, progressStore.get()));

  useEffect(() => {
    visit({ key: 'daily', title: 'Denný tréning', subtitle: 'Mix podľa tvojich slabých miest', path: '/denny-trening' });
  }, []);

  return (
    <div>
      <PageHeader
        back="/"
        title="Denný tréning"
        subtitle="Mix zvukov, asimilácie a slov. Zvuky, ktoré ti robia problém, sa objavujú častejšie."
      />
      <Quiz
        questions={questions}
        area="listening"
        sessionKey="daily"
        sessionTitle="Denný tréning"
        intro="Asi 13 otázok naprieč celou aplikáciou. Zameriame sa na zvuky a slová, pri ktorých sa najčastejšie mýliš."
        onRestart={() => setQuestions(dailyMix(content, progressStore.get()))}
        onExit={() => navigate('/')}
        exitLabel="Na prehľad"
      />
    </div>
  );
}
