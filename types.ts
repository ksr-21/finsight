
export interface User {
    uid: string;
    email: string | null;
    displayName?: string;
}

export interface UserPreferences {
    isDarkMode: boolean;
    currency: Currency;
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

export enum Category {
  FOOD = 'Food',
  TRAVEL = 'Travel',
  SHOPPING = 'Shopping',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  SALARY = 'Salary',
  FREELANCE = 'Freelance',
  INVESTMENTS = 'Investments',
  RENT = 'Rent',
  BILLS = 'Bills',
  EDUCATION = 'Education',
  OTHER = 'Other',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string format: YYYY-MM-DD
  notes?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  isSplit?: boolean;
  splitCount?: number;
  splitWith?: string[]; // Array of user IDs or names
}

export interface Budget {
  id: string;
  category: Category | 'Total';
  amount: number;
  period: 'weekly' | 'monthly';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category?: Category;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  category: Category;
}

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  type: 'stock' | 'crypto' | 'mutual_fund';
}

export interface FinancialHealthScore {
  score: number;
  breakdown: {
    savings: number;
    spending: number;
    investments: number;
    debt: number;
  };
  suggestions: string[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'split';
  date: string;
  isRead: boolean;
  actionUrl?: string;
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  INR = 'INR',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.INR]: '₹',
  [Currency.JPY]: '¥',
  [Currency.CAD]: 'C$',
  [Currency.AUD]: 'A$',
};

// FIX: Make properties optional to match the Gemini API response structure.
export interface GroundingChunkSource {
  uri?: string;
  title?: string;
}

// FIX: Make web property optional as grounding chunks can be of different types (e.g., maps).
export interface GroundingChunk {
  web?: GroundingChunkSource;
}
