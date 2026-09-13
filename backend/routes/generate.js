import express from 'express';
import EmailPair from '../models/EmailPair.js';
import { generateEmbedding } from '../services/embedding.js';
import { generateReply } from '../services/llm.js';

const router = express.Router();

/**
 * Cosine similarity between two vectors (fallback when Atlas vector search unavailable).
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

/**
 * Retrieve top-K similar email pairs using Atlas vector search or cosine fallback.
 */
async function retrieveSimilar(queryEmbedding, topK = 3) {
  try {
    // Try Atlas Vector Search (requires index named "vector_index" on "embedding" field)
    const results = await EmailPair.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: topK,
        },
      },
      { $project: { customerEmail: 1, referenceReply: 1, category: 1, score: { $meta: 'vectorSearchScore' } } },
    ]);
    if (results.length > 0) return results;
  } catch (_) {
    // Atlas vector index not yet created — fall back to cosine scan
  }

  // Fallback: load all, compute cosine similarity in memory
  const all = await EmailPair.find({});
  const scored = all.map((doc) => ({
    _id: doc._id,
    customerEmail: doc.customerEmail,
    referenceReply: doc.referenceReply,
    category: doc.category,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// POST /api/generate
router.post('/', async (req, res) => {
  try {
    const { incomingEmail } = req.body;
    if (!incomingEmail) return res.status(400).json({ error: 'incomingEmail is required' });

    // 1. Generate embedding
    const queryEmbedding = await generateEmbedding(incomingEmail);

    // 2. Retrieve similar examples
    const examples = await retrieveSimilar(queryEmbedding, 3);

    // 3. Generate reply
    const generatedReply = await generateReply(incomingEmail, examples);

    res.json({ generatedReply, retrievedExamples: examples });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
