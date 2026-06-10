import jwt from 'jsonwebtoken';
import connectDB from '../lib/mongodb';
import { PortfolioAsset } from '../models/PortfolioAsset';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

const authenticate = (req: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  return jwt.verify(token, JWT_SECRET) as any;
};

export default async function handler(req: any, res: any) {
  try {
  await connectDB();

  let user;
  try {
    user = authenticate(req);
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, query } = req;
  const id = query.path ? query.path[0] : null;

  switch (method) {
    case 'GET':
      try {
        const portfolio = await (PortfolioAsset as any).find({ userId: user.userId });
        res.json(portfolio.map(p => ({ ...p.toObject(), id: p._id })));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch portfolio' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
  } catch (error: any) {
    console.error('Portfolio API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
