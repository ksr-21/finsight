import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, default: 'monthly' },
}, { timestamps: true });

export const Budget = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
export default Budget;
