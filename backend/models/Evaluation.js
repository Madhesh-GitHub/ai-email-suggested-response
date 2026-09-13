import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  incomingEmail: { type: String, required: true },
  generatedReply: { type: String, required: true },
  retrievedExamples: { type: [Object], default: [] },
  scores: {
    relevance: Number,
    correctness: Number,
    completeness: Number,
    helpfulness: Number,
    professionalTone: Number,
    overall: Number,
  },
  explanation: String,
  isBatchResult: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
