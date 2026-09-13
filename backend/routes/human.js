import express from 'express';
import HumanValidation from '../models/HumanValidation.js';
import Evaluation from '../models/Evaluation.js';

const router = express.Router();

// GET /api/human/samples — get sample evaluations for human rating
router.get('/samples', async (_req, res) => {
  try {
    // Get evaluations that don't have a human rating yet
    const rated = await HumanValidation.distinct('evaluationId');
    const samples = await Evaluation.find({ _id: { $nin: rated } })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(samples);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/human/rate — submit a human rating
router.post('/rate', async (req, res) => {
  try {
    const { evaluationId, humanScore } = req.body;
    if (!evaluationId || humanScore == null)
      return res.status(400).json({ error: 'evaluationId and humanScore are required' });

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) return res.status(404).json({ error: 'Evaluation not found' });

    const existing = await HumanValidation.findOne({ evaluationId });
    if (existing) {
      existing.humanScore = humanScore;
      await existing.save();
      return res.json({ message: 'Rating updated', id: existing._id });
    }

    const hv = await HumanValidation.create({
      evaluationId,
      incomingEmail: evaluation.incomingEmail,
      generatedReply: evaluation.generatedReply,
      automatedScore: evaluation.scores.overall,
      humanScore,
    });

    res.json({ message: 'Rating submitted', id: hv._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/human/correlation — compute correlation between human and automated scores
router.get('/correlation', async (_req, res) => {
  try {
    const ratings = await HumanValidation.find({ humanScore: { $exists: true } });

    if (ratings.length < 2) {
      return res.json({ count: ratings.length, correlation: null, ratings });
    }

    const x = ratings.map((r) => r.automatedScore);
    const y = ratings.map((r) => r.humanScore);

    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    const num = x.reduce((s, xi, i) => s + (xi - meanX) * (y[i] - meanY), 0);
    const den = Math.sqrt(
      x.reduce((s, xi) => s + (xi - meanX) ** 2, 0) *
      y.reduce((s, yi) => s + (yi - meanY) ** 2, 0)
    );

    const correlation = den === 0 ? 0 : +(num / den).toFixed(4);

    res.json({ count: n, correlation, ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
