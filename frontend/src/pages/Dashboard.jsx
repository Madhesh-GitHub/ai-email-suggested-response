import { useState, useEffect } from 'react';
import { api } from '../api';

function ScoreBar({ label, value }) {
  const color = value >= 7 ? '#10b981' : value >= 5 ? '#f59e0b' : '#ef4444';
  const pct = ((value / 10) * 100).toFixed(0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }} className="font-semibold">{value?.toFixed(1)}/10</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, color = '#6366f1' }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDatasetStats(), api.getEvalHistory()])
      .then(([s, h]) => { setStats(s); setHistory(h); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const avgOverall = history.length
    ? (history.reduce((s, e) => s + (e.scores?.overall || 0), 0) / history.length).toFixed(2)
    : '—';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>System overview and recent evaluation history.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Dataset Size" value={stats?.total ?? '—'} sub="email pairs" color="#6366f1" />
        <StatCard title="Evaluations Run" value={history.length} sub="individual" color="#10b981" />
        <StatCard title="Avg Overall Score" value={avgOverall} sub="out of 10" color="#f59e0b" />
        <StatCard title="Categories" value={stats?.byCategory?.length ?? '—'} sub="email types" color="#818cf8" />
      </div>

      {/* Category breakdown */}
      {stats?.byCategory && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4">Dataset by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.byCategory.map((c) => (
              <div key={c._id} className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <span className="capitalize text-sm">{c._id}</span>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent evaluations */}
      {history.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4">Recent Evaluations</h2>
          <div className="space-y-3">
            {history.slice(0, 5).map((ev) => (
              <div key={ev._id} className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-start gap-4">
                  <p className="text-sm line-clamp-2 flex-1" style={{ color: 'var(--text-secondary)' }}>{ev.incomingEmail}</p>
                  <span className="text-lg font-bold flex-shrink-0" style={{ color: ev.scores?.overall >= 7 ? '#10b981' : ev.scores?.overall >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {ev.scores?.overall?.toFixed(1)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {['relevance', 'correctness', 'completeness', 'helpfulness', 'professionalTone'].map((k) => (
                    <div key={k} className="text-center">
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{k === 'professionalTone' ? 'Tone' : k.charAt(0).toUpperCase() + k.slice(1)}</p>
                      <p className="text-sm font-semibold" style={{ color: ev.scores?.[k] >= 7 ? '#10b981' : ev.scores?.[k] >= 5 ? '#f59e0b' : '#ef4444' }}>
                        {ev.scores?.[k]?.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
