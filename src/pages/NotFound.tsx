import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <div className="ko text-6xl font-bold text-indigo-500">어?</div>
      <h1 className="mt-4 text-xl font-bold">Stránka sa nenašla</h1>
      <p className="mt-1 text-slate-500">Možno bola lekcia premenovaná alebo odstránená z obsahu.</p>
      <Link to="/" className="btn-primary mt-6">
        Na prehľad
      </Link>
    </div>
  );
}
