import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs/promises';
import Parser from 'rss-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from './lib/mongodb';
import { config } from './lib/config';
import { User } from './models/User';
import { Transaction } from './models/Transaction';
import { Budget } from './models/Budget';
import { Goal } from './models/Goal';
import { Bill } from './models/Bill';
import { PortfolioAsset } from './models/PortfolioAsset';

const JWT_SECRET = config.JWT_SECRET;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    try {
      if (!config.MONGODB_URI) {
        console.error('CRITICAL: MONGODB_URI is missing');
        return res.status(500).json({
          error: 'Database configuration missing',
          details: 'MONGODB_URI environment variable is not set.'
        });
      }
      await connectDB();
      next();
    } catch (error: any) {
      console.error('Database connection failed:', error.message);
      res.status(500).json({
        error: error.message?.includes('connect') || error.message?.includes('mongo')
          ? 'Database connection failed'
          : 'Internal server error',
        details: error.message
      });
    }
  } else {
    next();
  }
});

async function loadData() {
  const defaultData: any = {
    users: [],
    transactions: [],
    budgets: [],
    goals: [],
    bills: [
      { id: '1', name: 'Electricity Bill', amount: 1200, dueDate: '2026-04-05', isPaid: false, category: 'Utilities' },
      { id: '2', name: 'Internet', amount: 800, dueDate: '2026-04-10', isPaid: true, category: 'Utilities' },
    ],
    portfolio: [
      { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 10, averagePrice: 2400, currentPrice: 2850, type: 'stock' },
      { id: '2', symbol: 'BTC', name: 'Bitcoin', quantity: 0.05, averagePrice: 45000, currentPrice: 65000, type: 'crypto' },
    ]
  };

  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      ...defaultData,
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      bills: Array.isArray(parsed.bills) ? parsed.bills : defaultData.bills,
      portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : defaultData.portfolio,
    };
  } catch (error) {
    return defaultData;
  }
}

async function saveData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await (User as any).findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      displayName: displayName || normalizedEmail.split('@')[0]
    });
    await user.save();

    const userIdStr = user._id.toString();
    const token = jwt.sign({ userId: userIdStr, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        uid: userIdStr,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await (User as any).findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });

    const userIdStr = user._id.toString();
    const token = jwt.sign({ userId: userIdStr, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        uid: userIdStr,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Transactions API
app.get('/api/transactions', authenticateToken, async (req: any, res) => {
  try {
    const transactions = await (Transaction as any).find({ userId: req.user.userId }).sort({ date: -1 });
    res.json(transactions.map((t: any) => ({ ...t.toObject(), id: t._id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', authenticateToken, async (req: any, res) => {
  try {
    const newTransaction = new Transaction({ ...req.body, userId: req.user.userId });
    await newTransaction.save();
    res.status(201).json({ ...newTransaction.toObject(), id: newTransaction._id });
  } catch (error: any) {
    console.error('Create transaction error:', error.message, error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = await (Transaction as any).findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (updatedTransaction) {
      res.json({ ...updatedTransaction.toObject(), id: updatedTransaction._id });
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const result = await (Transaction as any).findOneAndDelete({ _id: id, userId: req.user.userId });
    if (result) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Budgets API
app.get('/api/budgets', authenticateToken, async (req: any, res) => {
  try {
    const budgets = await (Budget as any).find({ userId: req.user.userId });
    res.json(budgets.map(b => ({ ...b.toObject(), id: b._id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

app.post('/api/budgets', authenticateToken, async (req: any, res) => {
  try {
    const newBudget = new Budget({ ...req.body, userId: req.user.userId });
    await newBudget.save();
    res.status(201).json({ ...newBudget.toObject(), id: newBudget._id });
  } catch (error: any) {
    console.error('Create budget error:', error.message, error);
    res.status(500).json({ error: 'Failed to create budget', details: error.message });
  }
});

app.put('/api/budgets/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updatedBudget = await (Budget as any).findOneAndUpdate(
      { _id: id, userId: req.user.userId },
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
});

app.delete('/api/budgets/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const result = await (Budget as any).findOneAndDelete({ _id: id, userId: req.user.userId });
    if (result) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Budget not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Goals API
app.get('/api/goals', authenticateToken, async (req: any, res) => {
  try {
    const goals = await (Goal as any).find({ userId: req.user.userId });
    res.json(goals.map(g => ({ ...g.toObject(), id: g._id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', authenticateToken, async (req: any, res) => {
  try {
    const newGoal = new Goal({ ...req.body, userId: req.user.userId });
    await newGoal.save();
    res.status(201).json({ ...newGoal.toObject(), id: newGoal._id });
  } catch (error: any) {
    console.error('Create goal error:', error.message, error);
    res.status(500).json({ error: 'Failed to create goal', details: error.message });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updatedGoal = await (Goal as any).findOneAndUpdate(
      { _id: id, userId: req.user.userId },
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
});

app.delete('/api/goals/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const result = await (Goal as any).findOneAndDelete({ _id: id, userId: req.user.userId });
    if (result) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Goal not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Bills API
app.get('/api/bills', authenticateToken, async (req: any, res) => {
  try {
    const bills = await (Bill as any).find({ userId: req.user.userId });
    res.json(bills.map(b => ({ ...b.toObject(), id: b._id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Portfolio API
app.get('/api/portfolio', authenticateToken, async (req: any, res) => {
  try {
    const portfolio = await (PortfolioAsset as any).find({ userId: req.user.userId });
    res.json(portfolio.map(p => ({ ...p.toObject(), id: p._id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// News API with Caching
const parser = new Parser();
let newsCache: { data: any, timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const NEWS_SOURCES = [
  { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', defaultCategory: 'Global' },
  { name: 'CNN Business', url: 'http://rss.cnn.com/rss/money_latest.rss', defaultCategory: 'Economy' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', defaultCategory: 'Markets' },
  { name: 'Google News Finance', url: 'https://news.google.com/rss/search?q=finance+markets+crypto+startups&hl=en-US&gl=US&ceid=US:en', defaultCategory: 'General' }
];

app.get('/api/news', async (req, res) => {
  try {
    if (newsCache && (Date.now() - newsCache.timestamp < CACHE_DURATION)) {
      return res.json(newsCache.data);
    }

    const feedPromises = NEWS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.contentSnippet || item.content,
          source: source.name,
          category: source.defaultCategory,
          guid: item.guid || item.link
        }));
      } catch (error) {
        console.error(`Error fetching feed from ${source.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    let allNews = results.flat();

    allNews.sort((a, b) => {
      return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
    });

    allNews = allNews.map(item => {
      const text = (item.title + ' ' + (item.content || '')).toLowerCase();
      if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('binance') || text.includes('coinbase')) {
        item.category = 'Crypto';
      } else if (text.includes('startup') || text.includes('venture capital') || text.includes('funding round') || text.includes('ipo ') || text.includes('unicorn') || text.includes('founder')) {
        item.category = 'Startups';
      } else if (text.includes('tech') || text.includes('apple') || text.includes('google') || text.includes('microsoft') || text.includes('ai ') || text.includes('nvidia') || text.includes('software')) {
        item.category = 'Technology';
      } else if (text.includes('market') || text.includes('stock') || text.includes('nasdaq') || text.includes('sp 500') || text.includes('dow jones') || text.includes('equities') || text.includes('trading')) {
        item.category = 'Markets';
      } else if (text.includes('economy') || text.includes('inflation') || text.includes('fed ') || text.includes('interest rate') || text.includes('recession') || text.includes('gdp') || text.includes('fiscal')) {
        item.category = 'Economy';
      }
      return item;
    });

    newsCache = {
      data: allNews,
      timestamp: Date.now()
    };

    res.json(allNews);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// AI Features
app.post('/api/ai/forecast', (req, res) => {
  const { history } = req.body;
  const forecast = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    amount: 100 + Math.random() * 50
  }));
  res.json({ forecast });
});

app.get('/api/ai/health-score', (req, res) => {
  res.json({
    score: 78,
    breakdown: {
      savings: 85,
      spending: 70,
      investments: 65,
      debt: 90
    },
    suggestions: [
      "You can save ₹2,000 more this month by reducing food delivery.",
      "Consider increasing your SIP in Nifty 50 Index Fund.",
      "Anomaly detected: Unusual spending at 'Apple Store' flagged."
    ]
  });
});

// Server setup
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);

      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Vite dev server failed to start:', err);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  }
}

setupApp();

export default app;
