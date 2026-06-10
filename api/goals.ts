import jwt from 'jsonwebtoken';
import connectDB from '../lib/mongodb';
import { Goal } from '../models/Goal';

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
        const goals = await (Goal as any).find({ userId: user.userId });
        res.json(goals.map(g => ({ ...g.toObject(), id: g._id })));
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' });
      }
      break;
    case 'POST':
      try {
        const newGoal = new Goal({ ...req.body, userId: user.userId });
        await newGoal.save();
        res.status(201).json({ ...newGoal.toObject(), id: newGoal._id });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create goal' });
      }
      break;
    case 'PUT':
      try {
        const updatedGoal = await (Goal as any).findOneAndUpdate(
          { _id: id, userId: user.userId },
          req.body,
          { new: true }
        );
        if (updatedGoal) {
          res.json({ ...updatedGoal.toObject(), id: updatedGoal._id });
        } else {
          res.status(404).json({ error: 'Goal not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to update goal' });
      }
      break;
    case 'DELETE':
      try {
        const result = await (Goal as any).findOneAndDelete({ _id: id, userId: user.userId });
        if (result) {
          res.status(204).send();
        } else {
          res.status(404).json({ error: 'Goal not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete goal' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
  } catch (error: any) {
    console.error('Goals API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
