import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import GenerateReply from './pages/GenerateReply';
import EvaluationResults from './pages/EvaluationResults';
import HumanValidation from './pages/HumanValidation';

const NAV = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'generate', label: '✨ Generate Reply' },
  { id: 'evaluation', label: '📊 Evaluation' },
  { id: 'human', label: '🧑 Human Validation' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');

  const pages = {
    dashboard: <Dashboard />,
    generate: <GenerateReply />,
    evaluation: <EvaluationResults />,
    human: <HumanValidation />,
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)' }}>
              ✉
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">AI Email</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Response System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              id={`nav-${n.id}`}
              onClick={() => setPage(n.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: page === n.id ? 'var(--accent-dim)' : 'transparent',
                color: page === n.id ? 'var(--accent-light)' : 'var(--text-secondary)',
                borderLeft: page === n.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>RAG + Groq + Gemini</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>MongoDB Atlas</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {pages[page]}
        </div>
      </main>
    </div>
  );
}
