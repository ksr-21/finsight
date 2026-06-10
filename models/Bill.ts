import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  isPaid: { type: Boolean, default: false },
  category: { type: String, required: true },
}, { timestamps: true });

export const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
export default Bill;
