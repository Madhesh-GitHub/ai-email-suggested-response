import express from 'express';
import Evaluation from '../models/Evaluation.js';
import { evaluateReply } from '../services/evaluator.js';

const router = express.Router();

// POST /api/evaluate — evaluate a single generated reply
router.post('/', async (req, res) => {
  try {
    const { incomingEmail, generatedReply, retrievedExamples } = req.body;
    if (!incomingEmail || !generatedReply)
      return res.status(400).json({ error: 'incomingEmail and generatedReply are required' });

    const scores = await evaluateReply(incomingEmail, generatedReply);

    const evaluation = await Evaluation.create({
      incomingEmail,
      generatedReply,
      retrievedExamples: retrievedExamples || [],
      scores,
      explanation: scores.explanation,
    });

    res.json({ evaluationId: evaluation._id, scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evaluate/history — last 20 evaluations
router.get('/history', async (_req, res) => {
  try {
    const evals = await Evaluation.find({ isBatchResult: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .select({ embedding: 0 });
    res.json(evals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
