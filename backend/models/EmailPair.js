import mongoose from 'mongoose';

const emailPairSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true },
  referenceReply: { type: String, required: true },
  category: {
    type: String,
    enum: ['billing', 'refund', 'account', 'subscription', 'delivery', 'complaint', 'product', 'technical', 'general'],
    required: true,
  },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Index for vector search — created via Atlas UI / script
const EmailPair = mongoose.model('EmailPair', emailPairSchema);
export default EmailPair;
