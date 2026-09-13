import { useState } from 'react';
import { api } from '../api';

function ScoreRow({ label, value }) {
  const color = value >= 7 ? '#10b981' : value >= 5 ? '#f59e0b' : '#ef4444';
  const pct = ((value / 10) * 100).toFixed(0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color }} className="font-semibold">{value?.toFixed(1)}/10</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const SAMPLE_EMAILS = [
  "Hi, I was charged twice for my subscription this month - $29.99 appeared twice. Please help.",
  "My order #5522 hasn't arrived in 2 weeks. Tracking shows it's been stuck in the warehouse.",
  "I can't log into my account. The password reset isn't working. I need urgent access.",
  "I'd like to cancel my subscription and get a refund for this month since I barely used it.",
  "Your app keeps crashing on my iPhone every time I try to export a report. This is unacceptable.",
];

export default function GenerateReply() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    setEvaluation(null);
    setError('');
    try {
      const data = await api.generateReply(email);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!result) return;
    setEvaluating(true);
    setError('');
    try {
      const data = await api.evaluateReply({
        incomingEmail: email,
        generatedReply: result.generatedReply,
        retrievedExamples: result.retrievedExamples,
      });
      setEvaluation(data.scores);
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Generate Reply</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Enter a customer email to generate an AI reply using RAG + Groq LLM.</p>
      </div>

      {/* Sample emails */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Quick samples:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_EMAILS.map((s, i) => (
            <button key={i} onClick={() => setEmail(s)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Customer Email</label>
        <textarea
          id="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          rows={6}
          placeholder="Paste or type the incoming customer email here..."
          className="w-full rounded-lg px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          id="generate-btn"
          onClick={handleGenerate}
          disabled={loading || !email.trim()}
          className="mt-4 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: 'white' }}>
          {loading ? '⏳ Generating…' : '✨ Generate Reply'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Retrieved Examples */}
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-4">📂 Retrieved Similar Examples ({result.retrievedExamples?.length})</h2>
            <div className="space-y-3">
              {result.retrievedExamples?.map((ex, i) => (
                <details key={i} className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <summary className="px-4 py-3 text-sm cursor-pointer flex justify-between items-center">
                    <span>Example {i + 1} — <span className="capitalize" style={{ color: 'var(--accent-light)' }}>{ex.category}</span></span>
                    {ex.score && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>similarity: {ex.score?.toFixed(3)}</span>}
                  </summary>
                  <div className="px-4 pb-4 pt-2 grid md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Customer Email:</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{ex.customerEmail}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Reference Reply:</p>
                      <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{ex.referenceReply}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Generated Reply */}
          <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">🤖 Generated Reply</h2>
              <button
                id="evaluate-btn"
                onClick={handleEvaluate}
                disabled={evaluating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'var(--green-dim)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                {evaluating ? '⏳ Evaluating…' : '📊 Evaluate this Reply'}
              </button>
            </div>
            <div className="rounded-lg px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {result.generatedReply}
            </div>
          </div>

          {/* Evaluation Scores */}
          {evaluation && (
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">📊 Evaluation Scores</h2>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: evaluation.overall >= 7 ? '#10b981' : evaluation.overall >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {evaluation.overall?.toFixed(1)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall / 10</p>
                </div>
              </div>
              <div className="mb-6">
                <ScoreRow label="Relevance (25%)" value={evaluation.relevance} />
                <ScoreRow label="Correctness (20%)" value={evaluation.correctness} />
                <ScoreRow label="Completeness (20%)" value={evaluation.completeness} />
                <ScoreRow label="Helpfulness (25%)" value={evaluation.helpfulness} />
                <ScoreRow label="Professional Tone (10%)" value={evaluation.professionalTone} />
              </div>
              {evaluation.explanation && (
                <div className="rounded-lg px-4 py-3 text-sm leading-relaxed"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>💬 Explanation</p>
                  {evaluation.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
