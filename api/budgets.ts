import jwt from 'jsonwebtoken';
import connectDB from '../lib/mongodb';
import { Budget } from '../models/Budget';

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
          const budgets = await (Budget as any).find({ userId: user.userId });
          return res.json(budgets.map(b => ({ ...b.toObject(), id: b._id })));
        } catch (error) {
          return res.status(500).json({ error: 'Failed to fetch budgets' });
        }
      case 'POST':
        try {
          const newBudget = new Budget({ ...req.body, userId: user.userId });
          await newBudget.save();
          return res.status(201).json({ ...newBudget.toObject(), id: newBudget._id });
        } catch (error) {
          return res.status(500).json({ error: 'Failed to create budget' });
        }
      case 'PUT':
        try {
          if (!id) return res.status(400).json({ error: 'ID is required' });
          const updatedBudget = await (Budget as any).findOneAndUpdate(
            { _id: id, userId: user.userId },
            req.body,
            { new: true }
          );
          if (updatedBudget) {
            return res.json({ ...updatedBudget.toObject(), id: updatedBudget._id });
          } else {
            return res.status(404).json({ error: 'Budget not found' });
          }
        } catch (error) {
          return res.status(500).json({ error: 'Failed to update budget' });
        }
      case 'DELETE':
        try {
          if (!id) return res.status(400).json({ error: 'ID is required' });
          const result = await (Budget as any).findOneAndDelete({ _id: id, userId: user.userId });
          if (result) {
            return res.status(204).end();
          } else {
            return res.status(404).json({ error: 'Budget not found' });
          }
        } catch (error) {
          return res.status(500).json({ error: 'Failed to delete budget' });
        }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Budgets API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
