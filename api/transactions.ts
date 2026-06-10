import jwt from 'jsonwebtoken';
import connectDB from '../lib/mongodb';
import { Transaction } from '../models/Transaction';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

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

    const { method, query } = req;
    const id = Array.isArray(query.path) ? query.path[0] : query.path;

    switch (method) {
      case 'GET':
        try {
          const transactions = await (Transaction as any).find({ userId: user.userId }).sort({ date: -1 });
          return res.json(transactions.map((t: any) => ({ ...t.toObject(), id: t._id })));
        } catch (error) {
          return res.status(500).json({ error: 'Failed to fetch transactions' });
        }
      case 'POST':
        try {
          const newTransaction = new Transaction({ ...req.body, userId: user.userId });
          await newTransaction.save();
          return res.status(201).json({ ...newTransaction.toObject(), id: newTransaction._id });
        } catch (error) {
          return res.status(500).json({ error: 'Failed to create transaction' });
        }
      case 'PUT':
        try {
          if (!id) return res.status(400).json({ error: 'ID is required' });
          const updatedTransaction = await (Transaction as any).findOneAndUpdate(
            { _id: id, userId: user.userId },
            req.body,
            { new: true }
          );
          if (updatedTransaction) {
            return res.json({ ...(updatedTransaction as any).toObject(), id: (updatedTransaction as any)._id });
          } else {
            return res.status(404).json({ error: 'Transaction not found' });
          }
        } catch (error) {
          return res.status(500).json({ error: 'Failed to update transaction' });
        }
      case 'DELETE':
        try {
          if (!id) return res.status(400).json({ error: 'ID is required' });
          const result = await (Transaction as any).findOneAndDelete({ _id: id, userId: user.userId });
          if (result) {
            return res.status(204).end();
          } else {
            return res.status(404).json({ error: 'Transaction not found' });
          }
        } catch (error) {
          return res.status(500).json({ error: 'Failed to delete transaction' });
        }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Transactions API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
