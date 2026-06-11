import mongoose from 'mongoose';

const DebtSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  person: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Borrowed', 'Lent'], required: true },
  date: { type: String, required: true },
  dueDate: { type: String },
  remainingAmount: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  notes: { type: String },
  paymentMode: { type: String, enum: ['Cash', 'Online'], required: true }
}, { timestamps: true });

export const Debt = mongoose.models.Debt || mongoose.model('Debt', DebtSchema);
export default Debt;
