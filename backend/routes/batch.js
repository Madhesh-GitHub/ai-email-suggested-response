import express from 'express';
import EmailPair from '../models/EmailPair.js';
import Evaluation from '../models/Evaluation.js';
import { generateEmbedding } from '../services/embedding.js';
import { generateReply } from '../services/llm.js';
import { evaluateReply } from '../services/evaluator.js';

const router = express.Router();

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

async function retrieveSimilar(queryEmbedding, topK = 3) {
  try {
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
      { $project: { customerEmail: 1, referenceReply: 1, category: 1 } },
    ]);
    if (results.length > 0) return results;
  } catch (_) {}

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

// POST /api/batch/run — run batch evaluation on N random test emails
router.post('/run', async (req, res) => {
  try {
    const limit = Math.min(req.body.limit || 10, 20);
    const testEmails = await EmailPair.aggregate([{ $sample: { size: limit } }]);

    const results = [];

    for (const pair of testEmails) {
      try {
        const qEmbed = await generateEmbedding(pair.customerEmail);
        const examples = await retrieveSimilar(qEmbed, 3);
        const generatedReply = await generateReply(pair.customerEmail, examples);
        const scores = await evaluateReply(pair.customerEmail, generatedReply, pair.referenceReply);

        const evaluation = await Evaluation.create({
          incomingEmail: pair.customerEmail,
          generatedReply,
          retrievedExamples: examples,
          scores,
          explanation: scores.explanation,
          isBatchResult: true,
        });

        results.push({ evaluationId: evaluation._id, category: pair.category, scores });
      } catch (err) {
        results.push({ error: err.message, category: pair.category });
      }
    }

    // Aggregate stats
    const valid = results.filter((r) => r.scores);
    const avg = (key) => valid.length
      ? +(valid.reduce((s, r) => s + (r.scores[key] || 0), 0) / valid.length).toFixed(2)
      : 0;

    const summary = {
      total: results.length,
      successful: valid.length,
      averageScores: {
        relevance: avg('relevance'),
        correctness: avg('correctness'),
        completeness: avg('completeness'),
        helpfulness: avg('helpfulness'),
        professionalTone: avg('professionalTone'),
        overall: avg('overall'),
      },
      best: valid.sort((a, b) => b.scores.overall - a.scores.overall)[0] || null,
      worst: valid.sort((a, b) => a.scores.overall - b.scores.overall)[0] || null,
      results,
    };

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/batch/results — fetch past batch results
router.get('/results', async (_req, res) => {
  try {
    const results = await Evaluation.find({ isBatchResult: true })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
