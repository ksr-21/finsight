import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  notes: { type: String },
  receiptUrl: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  isSplit: { type: Boolean, default: false },
  splitCount: { type: Number },
  splitWith: [{ type: String }],
}, { timestamps: true });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export default Transaction;
