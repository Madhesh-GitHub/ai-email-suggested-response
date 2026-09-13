import mongoose from 'mongoose';

const humanValidationSchema = new mongoose.Schema({
  evaluationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evaluation' },
  incomingEmail: String,
  generatedReply: String,
  automatedScore: Number,
  humanScore: { type: Number, min: 1, max: 10 },
  createdAt: { type: Date, default: Date.now },
});

const HumanValidation = mongoose.model('HumanValidation', humanValidationSchema);
export default HumanValidation;
