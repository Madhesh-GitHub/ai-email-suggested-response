import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import datasetRoutes from './routes/dataset.js';
import generateRoutes from './routes/generate.js';
import evaluateRoutes from './routes/evaluate.js';
import batchRoutes from './routes/batch.js';
import humanRoutes from './routes/human.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect MongoDB
mongoose
  .connect(process.env.MongoDB)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/dataset', datasetRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/evaluate', evaluateRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/human', humanRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
