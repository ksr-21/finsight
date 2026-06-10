import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: String, required: true },
  category: { type: String },
}, { timestamps: true });

export const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
export default Goal;
