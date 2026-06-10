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
        const budgets = await (Budget as any).find({ userId: user.userId });
        res.json(budgets.map(b => ({ ...b.toObject(), id: b._id })));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch budgets' });
      }
      break;
    case 'POST':
      try {
        const newBudget = new Budget({ ...req.body, userId: user.userId });
        await newBudget.save();
        res.status(201).json({ ...newBudget.toObject(), id: newBudget._id });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create budget' });
      }
      break;
    case 'PUT':
      try {
        const updatedBudget = await (Budget as any).findOneAndUpdate(
          { _id: id, userId: user.userId },
          req.body,
          { new: true }
        );
        if (updatedBudget) {
          res.json({ ...updatedBudget.toObject(), id: updatedBudget._id });
        } else {
          res.status(404).json({ error: 'Budget not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to update budget' });
      }
      break;
    case 'DELETE':
      try {
        const result = await (Budget as any).findOneAndDelete({ _id: id, userId: user.userId });
        if (result) {
          res.status(204).send();
        } else {
          res.status(404).json({ error: 'Budget not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete budget' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
  } catch (error: any) {
    console.error('Budgets API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
