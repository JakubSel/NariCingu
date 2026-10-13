import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ContentProvider } from './lib/content';
import AssimilationList from './pages/AssimilationList';
import AssimilationRule from './pages/AssimilationRule';
import DailyPractice from './pages/DailyPractice';
import Dashboard from './pages/Dashboard';
import Hangul from './pages/Hangul';
import Listening from './pages/Listening';
import ListeningSession from './pages/ListeningSession';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import TrainerLesson from './pages/TrainerLesson';
import TrainerList from './pages/TrainerList';
import Vocabulary from './pages/Vocabulary';
import VocabularyCategory from './pages/VocabularyCategory';

// HashRouter: na GitHub Pages funguje bez presmerovaní (žiadne 404 pri obnovení stránky).
export default function App() {
  return (
    <ContentProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="denny-trening" element={<DailyPractice />} />
            <Route path="hangul" element={<Hangul />} />
            <Route path="trener" element={<TrainerList />} />
            <Route path="trener/:id" element={<TrainerLesson />} />
            <Route path="asimilacia" element={<AssimilationList />} />
            <Route path="asimilacia/:id" element={<AssimilationRule />} />
            <Route path="pocuvanie" element={<Listening />} />
            <Route path="pocuvanie/:id" element={<ListeningSession />} />
            <Route path="slovicka" element={<Vocabulary />} />
            <Route path="slovicka/:id" element={<VocabularyCategory />} />
            <Route path="nastavenia" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ContentProvider>
  );
}
