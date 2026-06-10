import jwt from 'jsonwebtoken';
import connectDB from '../lib/mongodb';
import { PortfolioAsset } from '../models/PortfolioAsset';
import { config } from '../lib/config';

const JWT_SECRET = config.JWT_SECRET;

const authenticate = (req: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  return jwt.verify(token, JWT_SECRET) as any;
};

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  try {
    await connectDB();

    let user;
    try {
      user = authenticate(req);
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        try {
          const portfolio = await (PortfolioAsset as any).find({ userId: user.userId });
          return res.json(portfolio.map(p => ({ ...p.toObject(), id: p._id })));
        } catch (error) {
          return res.status(500).json({ error: 'Failed to fetch portfolio' });
        }
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Portfolio API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
