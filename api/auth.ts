import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '../lib/mongodb';
import { User } from '../models/User';
import { config } from '../lib/config';

const JWT_SECRET = config.JWT_SECRET;

export default async function handler(req: any, res: any) {
  // Always set JSON content-type first
  res.setHeader('Content-Type', 'application/json');

  // Basic CORS support for serverless functions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`Auth API: ${req.method} ${req.url}`);

    if (!process.env.MONGODB_URI) {
      console.error('CRITICAL: MONGODB_URI is missing');
      return res.status(500).json({
        error: 'Database configuration missing',
        details: 'MONGODB_URI environment variable is not set.'
      });
    }

    await connectDB();

    const { method, query } = req;
    const url = req.url || '';

    // Determine the action (login or signup) from the URL path or query parameters
    const isSignup = url.includes('/signup') || query.path === 'signup' || (Array.isArray(query.path) && query.path.includes('signup'));
    const isLogin = url.includes('/login') || query.path === 'login' || (Array.isArray(query.path) && query.path.includes('login'));

    if (method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required and must be JSON' });
    }

    // --- SIGNUP ---
    if (isSignup) {
      const { email, password, displayName } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await (User as any).findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName: displayName || email.split('@')[0]
      });
      await user.save();

      const userIdStr = user._id.toString();
      const token = jwt.sign({ userId: userIdStr, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: { uid: userIdStr, email: user.email, displayName: user.displayName }
      });
    }

    // --- LOGIN ---
    if (isLogin) {
      const { email, password } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await (User as any).findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const userIdStr = user._id.toString();
      const token = jwt.sign({ userId: userIdStr, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: { uid: userIdStr, email: user.email, displayName: user.displayName }
      });
    }

    return res.status(404).json({
      error: `Auth endpoint not found`,
      path: url,
      hint: 'Expected /api/auth/login or /api/auth/signup'
    });

  } catch (error: any) {
    console.error('Auth API Error:', error.message);
    return res.status(500).json({
      error: error.message?.includes('connect') || error.message?.includes('mongo')
        ? 'Database connection failed'
        : 'Internal server error',
      details: error.message
    });
  }
}
