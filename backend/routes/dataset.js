import express from 'express';
import EmailPair from '../models/EmailPair.js';
import { generateEmbedding } from '../services/embedding.js';

const router = express.Router();

// GET /api/dataset — list all email pairs (without embeddings)
router.get('/', async (_req, res) => {
  try {
    const pairs = await EmailPair.find({}, { embedding: 0 }).sort({ createdAt: -1 });
    res.json({ count: pairs.length, data: pairs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dataset/stats
router.get('/stats', async (_req, res) => {
  try {
    const total = await EmailPair.countDocuments();
    const byCategory = await EmailPair.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    res.json({ total, byCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dataset/add — add a single new email pair with embedding
router.post('/add', async (req, res) => {
  try {
    const { customerEmail, referenceReply, category } = req.body;
    if (!customerEmail || !referenceReply || !category)
      return res.status(400).json({ error: 'Missing required fields' });

    const embeddingInput = `${customerEmail} ${referenceReply}`;
    const embedding = await generateEmbedding(embeddingInput);

    const pair = await EmailPair.create({ customerEmail, referenceReply, category, embedding });
    res.json({ message: 'Email pair added', id: pair._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
