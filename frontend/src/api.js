const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Dataset
  getDataset: () => request('/dataset'),
  getDatasetStats: () => request('/dataset/stats'),

  // Generate
  generateReply: (incomingEmail) =>
    request('/generate', { method: 'POST', body: JSON.stringify({ incomingEmail }) }),

  // Evaluate
  evaluateReply: (payload) =>
    request('/evaluate', { method: 'POST', body: JSON.stringify(payload) }),
  getEvalHistory: () => request('/evaluate/history'),

  // Batch
  runBatch: (limit = 5) =>
    request('/batch/run', { method: 'POST', body: JSON.stringify({ limit }) }),
  getBatchResults: () => request('/batch/results'),

  // Human validation
  getHumanSamples: () => request('/human/samples'),
  submitHumanRating: (evaluationId, humanScore) =>
    request('/human/rate', { method: 'POST', body: JSON.stringify({ evaluationId, humanScore }) }),
  getCorrelation: () => request('/human/correlation'),
};
