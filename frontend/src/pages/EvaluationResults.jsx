import { useState, useEffect } from 'react';
import { api } from '../api';

function ScoreChip({ label, value }) {
  const color = value >= 7 ? '#10b981' : value >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="text-center">
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value?.toFixed(1)}</p>
    </div>
  );
}

function AvgBar({ label, value, weight }) {
  const color = value >= 7 ? '#10b981' : value >= 5 ? '#f59e0b' : '#ef4444';
  const pct = ((value / 10) * 100).toFixed(0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({weight})</span></span>
        <span style={{ color }} className="font-semibold">{value?.toFixed(2)}/10</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function EvaluationResults() {
  const [batchResult, setBatchResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEvalHistory().then(setHistory).catch(console.error);
  }, []);

  async function runBatch() {
    setRunning(true);
    setError('');
    setBatchResult(null);
    try {
      const result = await api.runBatch(batchSize);
      setBatchResult(result);
      // Refresh history
      const h = await api.getEvalHistory();
      setHistory(h);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Evaluation Results</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Run batch evaluation on the test dataset and view per-response and aggregate scores.</p>
      </div>

      {/* Batch run control */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4">🚀 Run Batch Evaluation</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Randomly selects N emails from the dataset, generates a reply, and evaluates it. This may take a few minutes.
        </p>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Number of emails:</label>
            <select
              id="batch-size-select"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button
            id="run-batch-btn"
            onClick={runBatch}
            disabled={running}
            className="px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: 'white' }}>
            {running ? `⏳ Running ${batchSize} evaluations…` : '▶ Run Batch Evaluation'}
          </button>
        </div>
        {running && (
          <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            Generating and evaluating replies — please wait…
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          ❌ {error}
        </div>
      )}

      {/* Batch summary */}
      {batchResult && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-6">📊 Batch Summary — {batchResult.successful}/{batchResult.total} successful</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Avg Overall', value: batchResult.averageScores.overall },
              { label: 'Avg Relevance', value: batchResult.averageScores.relevance },
              { label: 'Avg Helpfulness', value: batchResult.averageScores.helpfulness },
              { label: 'Avg Correctness', value: batchResult.averageScores.correctness },
              { label: 'Avg Completeness', value: batchResult.averageScores.completeness },
              { label: 'Avg Tone', value: batchResult.averageScores.professionalTone },
            ].map((s) => {
              const color = s.value >= 7 ? '#10b981' : s.value >= 5 ? '#f59e0b' : '#ef4444';
              return (
                <div key={s.label} className="text-center rounded-lg py-4"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-bold" style={{ color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-4">
            <AvgBar label="Relevance" value={batchResult.averageScores.relevance} weight="25%" />
            <AvgBar label="Correctness" value={batchResult.averageScores.correctness} weight="20%" />
            <AvgBar label="Completeness" value={batchResult.averageScores.completeness} weight="20%" />
            <AvgBar label="Helpfulness" value={batchResult.averageScores.helpfulness} weight="25%" />
            <AvgBar label="Professional Tone" value={batchResult.averageScores.professionalTone} weight="10%" />
          </div>

          {/* Per-response results */}
          <h3 className="font-medium mb-3 mt-6">Per-Response Results</h3>
          <div className="space-y-3">
            {batchResult.results?.filter(r => r.scores).map((r, i) => (
              <div key={i} className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm capitalize px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
                    {r.category}
                  </span>
                  <span className="text-xl font-bold" style={{ color: r.scores.overall >= 7 ? '#10b981' : r.scores.overall >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {r.scores.overall?.toFixed(1)}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <ScoreChip label="Relevance" value={r.scores.relevance} />
                  <ScoreChip label="Correct" value={r.scores.correctness} />
                  <ScoreChip label="Complete" value={r.scores.completeness} />
                  <ScoreChip label="Helpful" value={r.scores.helpfulness} />
                  <ScoreChip label="Tone" value={r.scores.professionalTone} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eval history */}
      {history.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4">📜 Per-Response Evaluation History ({history.length})</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {history.map((ev) => (
              <details key={ev._id} className="rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <summary className="px-4 py-3 cursor-pointer flex justify-between items-center text-sm">
                  <span className="line-clamp-1 flex-1 mr-4" style={{ color: 'var(--text-secondary)' }}>{ev.incomingEmail}</span>
                  <span className="font-bold flex-shrink-0" style={{ color: ev.scores?.overall >= 7 ? '#10b981' : ev.scores?.overall >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {ev.scores?.overall?.toFixed(1)}/10
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-2 space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    <ScoreChip label="Relevance" value={ev.scores?.relevance} />
                    <ScoreChip label="Correct" value={ev.scores?.correctness} />
                    <ScoreChip label="Complete" value={ev.scores?.completeness} />
                    <ScoreChip label="Helpful" value={ev.scores?.helpfulness} />
                    <ScoreChip label="Tone" value={ev.scores?.professionalTone} />
                  </div>
                  {ev.explanation && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ev.explanation}</p>
                  )}
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Generated Reply:</p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{ev.generatedReply}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
