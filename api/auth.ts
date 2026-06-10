import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '../lib/mongodb';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export default async function handler(req: any, res: any) {
  // Always set JSON content-type first so Vercel never returns HTML error pages
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log(`Auth API: ${req.method} ${req.url}`);

    if (!process.env.MONGODB_URI) {
      console.error('CRITICAL: MONGODB_URI is missing');
      return res.status(500).json({
        error: 'Database configuration missing',
        details: 'MONGODB_URI environment variable is not set.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET is missing, using fallback (not recommended for production)');
    }

    await connectDB();

    const { method } = req;
    const url = req.url || '';

    if (method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required and must be JSON' });
    }

    // --- SIGNUP ---
    if (url.includes('/signup')) {
      const { email, password, displayName } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await (User as any).findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword, displayName });
      await user.save();

      const userIdStr = user._id.toString();
      const token = jwt.sign({ userId: userIdStr, email: user.email }, JWT_SECRET);
      return res.status(201).json({
        token,
        user: { uid: userIdStr, email: user.email, displayName: user.displayName }
      });
    }

    // --- LOGIN ---
    if (url.includes('/login')) {
      const { email, password } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await (User as any).findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const userIdStr = user._id.toString();
      const token = jwt.sign({ userId: userIdStr, email: user.email }, JWT_SECRET);
      return res.json({
        token,
        user: { uid: userIdStr, email: user.email, displayName: user.displayName }
      });
    }

    return res.status(404).json({ error: `Auth endpoint not found: ${url}` });

  } catch (error: any) {
    console.error('Auth API Error:', error.message);
    // Always return JSON, never let Vercel serve its HTML error page
    return res.status(500).json({
      error: error.message?.includes('connect') || error.message?.includes('mongo')
        ? 'Database connection failed. Please try again.'
        : 'Internal server error',
      details: error.message
    });
  }
}
