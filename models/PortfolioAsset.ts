import mongoose from 'mongoose';

const PortfolioAssetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  averagePrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  type: { type: String, enum: ['stock', 'crypto', 'mutual_fund'], required: true },
}, { timestamps: true });

export const PortfolioAsset = mongoose.models.PortfolioAsset || mongoose.model('PortfolioAsset', PortfolioAssetSchema);
export default PortfolioAsset;
