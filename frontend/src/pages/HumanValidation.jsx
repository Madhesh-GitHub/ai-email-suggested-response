import { useState, useEffect } from 'react';
import { api } from '../api';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className="text-xl transition-transform hover:scale-110"
          style={{ color: n <= display ? '#f59e0b' : 'var(--border)' }}>
          ★
        </button>
      ))}
    </div>
  );
}

function CorrelationGauge({ value }) {
  if (value === null) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Rate at least 2 samples to see correlation.</p>;
  const abs = Math.abs(value);
  const quality = abs >= 0.8 ? { label: 'Strong', color: '#10b981' } : abs >= 0.5 ? { label: 'Moderate', color: '#f59e0b' } : { label: 'Weak', color: '#ef4444' };
  return (
    <div className="flex items-center gap-6">
      <div>
        <p className="text-4xl font-bold" style={{ color: quality.color }}>{value.toFixed(3)}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pearson r</p>
      </div>
      <div>
        <p className="text-lg font-semibold" style={{ color: quality.color }}>{quality.label} Correlation</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {value >= 0 ? 'Positive' : 'Negative'} — automated scores {abs >= 0.6 ? 'align well' : 'partially align'} with human judgment
        </p>
      </div>
    </div>
  );
}

export default function HumanValidation() {
  const [samples, setSamples] = useState([]);
  const [ratings, setRatings] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getHumanSamples(), api.getCorrelation()])
      .then(([s, c]) => { setSamples(s); setCorrelation(c); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function submitRating(evaluationId) {
    const score = ratings[evaluationId];
    if (!score) return;
    try {
      await api.submitHumanRating(evaluationId, score);
      setSubmitted((p) => ({ ...p, [evaluationId]: true }));
      // Refresh correlation
      const c = await api.getCorrelation();
      setCorrelation(c);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Human Validation</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Rate AI-generated replies yourself, then compare with automated scores to measure alignment.</p>
      </div>

      {/* Correlation Panel */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4">📈 Human vs Automated Correlation</h2>
        <div className="mb-4">
          <CorrelationGauge value={correlation?.correlation ?? null} />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Total ratings: {correlation?.count ?? 0} | Pearson correlation measures how well automated scores predict human scores (1.0 = perfect, 0 = no relationship).
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          ❌ {error}
        </div>
      )}

      {samples.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-lg mb-2">No samples to rate yet.</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Generate and evaluate some replies first, then come back here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold">🧑 Rate These Responses ({samples.length} available)</h2>
          {samples.map((ev) => (
            <div key={ev._id} className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: submitted[ev._id] ? 0.6 : 1 }}>
              {submitted[ev._id] && (
                <div className="mb-3 text-sm px-3 py-2 rounded-lg inline-block" style={{ background: 'var(--green-dim)', color: '#10b981' }}>
                  ✅ Rating submitted
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>CUSTOMER EMAIL</p>
                  <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {ev.incomingEmail}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>AI GENERATED REPLY</p>
                  <div className="rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {ev.generatedReply}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Automated Overall Score: <strong style={{ color: 'var(--text-primary)' }}>{ev.scores?.overall?.toFixed(1)}/10</strong></p>
                  <div>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Your Rating (1–10):</p>
                    <StarRating
                      value={ratings[ev._id] ?? 0}
                      onChange={(v) => setRatings((p) => ({ ...p, [ev._id]: v }))}
                    />
                  </div>
                </div>
                <button
                  id={`submit-rating-${ev._id}`}
                  onClick={() => submitRating(ev._id)}
                  disabled={!ratings[ev._id] || submitted[ev._id]}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  Submit Rating{ratings[ev._id] ? ` (${ratings[ev._id]}/10)` : ''}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All ratings */}
      {correlation?.ratings?.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4">📊 All Human Ratings vs Automated</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 pr-4" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left py-2 pr-4" style={{ color: 'var(--text-muted)' }}>Email Preview</th>
                  <th className="text-center py-2 pr-4" style={{ color: 'var(--text-muted)' }}>Automated</th>
                  <th className="text-center py-2 pr-4" style={{ color: 'var(--text-muted)' }}>Human</th>
                  <th className="text-center py-2" style={{ color: 'var(--text-muted)' }}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {correlation.ratings.map((r, i) => {
                  const diff = (r.humanScore - r.automatedScore).toFixed(1);
                  const diffColor = Math.abs(diff) <= 1 ? '#10b981' : Math.abs(diff) <= 2 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2 pr-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="py-2 pr-4 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{r.incomingEmail}</td>
                      <td className="py-2 pr-4 text-center font-semibold" style={{ color: '#6366f1' }}>{r.automatedScore?.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-center font-semibold" style={{ color: '#f59e0b' }}>{r.humanScore}</td>
                      <td className="py-2 text-center font-semibold" style={{ color: diffColor }}>{diff > 0 ? '+' : ''}{diff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
