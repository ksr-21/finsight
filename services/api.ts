import { Transaction, Budget, Goal, Bill, PortfolioAsset, FinancialHealthScore } from '../types';
import * as firestore from './firestoreService';

const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  BILLS: 'bills',
  PORTFOLIO: 'portfolio',
};

// Helper for user-scoped keys
const getScopedKey = (userId: string, key: string) => `finsight_${userId}_${key}`;

const getLocal = <T>(userId: string, key: string): T[] => {
  try {
    const fullKey = getScopedKey(userId, key);
    const data = localStorage.getItem(fullKey);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const setLocal = (userId: string, key: string, data: any) => {
  try {
    const fullKey = getScopedKey(userId, key);
    localStorage.setItem(fullKey, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
};

export const api = {
  // Transactions
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    if (userId === 'guest_user') {
      return getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
    }
    try {
      return await firestore.getTransactionsForUser(userId);
    } catch (e) {
      console.warn("Using offline transactions", e);
      return getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
    }
  },

  addTransaction: async (userId: string, t: Omit<Transaction, 'id'>): Promise<Transaction> => {
    if (userId === 'guest_user') {
      const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) } as Transaction;
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, [...current, newTransaction]);
      return newTransaction;
    }
    try {
      return await firestore.addTransactionForUser(userId, t);
    } catch (e) {
      const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) } as Transaction;
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, [...current, newTransaction]);
      return newTransaction;
    }
  },

  updateTransaction: async (userId: string, id: string, t: Partial<Transaction>): Promise<Transaction> => {
    if (userId === 'guest_user') {
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      const updated = current.map(item => item.id === id ? { ...item, ...t } : item);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, updated);
      return updated.find(item => item.id === id) as Transaction;
    }
    try {
      await firestore.updateTransactionForUser(userId, id, t);
      return { id, ...t } as Transaction;
    } catch (e) {
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      const updated = current.map(item => item.id === id ? { ...item, ...t } : item);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, updated);
      return updated.find(item => item.id === id) as Transaction;
    }
  },

  deleteTransaction: async (userId: string, id: string): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, current.filter(item => item.id !== id));
      return;
    }
    try {
      await firestore.deleteTransactionForUser(userId, id);
    } catch (e) {
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, current.filter(item => item.id !== id));
    }
  },

  // AI Features
  getForecast: async (history: Transaction[]): Promise<any> => {
    const forecast = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      amount: 100 + Math.random() * 50
    }));
    return { forecast };
  },

  getHealthScore: async (userId: string): Promise<FinancialHealthScore> => {
    let transactions, budgets, portfolio;
    try {
      [transactions, budgets, portfolio] = await Promise.all([
        api.getTransactions(userId),
        api.getBudgets(userId),
        api.getPortfolio(userId)
      ]);
    } catch (e) {
      transactions = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      budgets = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      portfolio = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
    }

    const now = new Date();
    const last30Days = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
    });

    const income = last30Days.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = last30Days.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const cashBalance = transactions.reduce((sum, t) => t.type === 'Income' ? sum + t.amount : sum - t.amount, 0);
    const portfolioValue = portfolio.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);
    const netWorth = cashBalance + portfolioValue;

    const savingsRate = income > 0 ? Math.max(0, (income - expenses) / income) : 0;
    const savingsScore = Math.min(100, Math.round((savingsRate / 0.2) * 100));

    let spendingScore = 100;
    if (budgets.length > 0) {
      let totalBudgeted = 0;
      let totalSpentInBudgetCategories = 0;

      budgets.forEach(b => {
        totalBudgeted += b.amount;
        totalSpentInBudgetCategories += last30Days
          .filter(t => t.category === b.category && t.type === 'Expense')
          .reduce((sum, t) => sum + t.amount, 0);
      });

      if (totalBudgeted > 0) {
        spendingScore = Math.max(0, Math.round(100 - (Math.max(0, totalSpentInBudgetCategories - totalBudgeted) / totalBudgeted * 100)));
      }
    } else if (expenses > 0 && income > 0) {
        spendingScore = Math.min(100, Math.round(Math.max(0, 1 - (expenses / income)) * 100));
    }

    const investmentRatio = netWorth > 0 ? portfolioValue / netWorth : 0;
    const investmentScore = Math.min(100, Math.round((investmentRatio / 0.3) * 100));

    const monthlyExpenses = expenses || 1;
    const runwayMonths = Math.max(0, cashBalance / monthlyExpenses);
    const debtScore = Math.min(100, Math.round((runwayMonths / 3) * 100));

    const totalScore = Math.round((savingsScore + spendingScore + investmentScore + debtScore) / 4);

    const suggestions = [];
    if (savingsScore < 50) suggestions.push("Try to increase your savings rate to at least 20% of your income.");
    if (spendingScore < 70) suggestions.push("You're exceeding your budgets. Review your discretionary spending.");
    if (investmentScore < 40) suggestions.push("Consider diversifying your wealth by increasing your investment portfolio.");
    if (debtScore < 60) suggestions.push("Work on building an emergency fund that covers at least 3 months of expenses.");
    if (suggestions.length === 0) suggestions.push("Your financial health is excellent! Keep maintaining these habits.");

    return {
      score: totalScore,
      breakdown: {
        savings: savingsScore,
        spending: spendingScore,
        investments: investmentScore,
        debt: debtScore
      },
      suggestions
    };
  },

  // Budgets
  getBudgets: async (userId: string): Promise<Budget[]> => {
    if (userId === 'guest_user') {
      return getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
    }
    try {
      return await firestore.getBudgetsForUser(userId);
    } catch (e) {
      return getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
    }
  },

  addBudget: async (userId: string, b: Omit<Budget, 'id'>): Promise<Budget> => {
    if (userId === 'guest_user') {
      const newBudget = { ...b, id: Math.random().toString(36).substr(2, 9) } as Budget;
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      setLocal(userId, STORAGE_KEYS.BUDGETS, [...current, newBudget]);
      return newBudget;
    }
    try {
      return await firestore.addBudgetForUser(userId, b);
    } catch (e) {
      const newBudget = { ...b, id: Math.random().toString(36).substr(2, 9) } as Budget;
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      setLocal(userId, STORAGE_KEYS.BUDGETS, [...current, newBudget]);
      return newBudget;
    }
  },

  updateBudget: async (userId: string, id: string, b: Partial<Budget>): Promise<Budget> => {
    if (userId === 'guest_user') {
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      const updated = current.map(item => item.id === id ? { ...item, ...b } : item);
      setLocal(userId, STORAGE_KEYS.BUDGETS, updated);
      return updated.find(item => item.id === id) as Budget;
    }
    try {
      await firestore.updateBudgetForUser(userId, id, b);
      return { id, ...b } as Budget;
    } catch (e) {
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      const updated = current.map(item => item.id === id ? { ...item, ...b } : item);
      setLocal(userId, STORAGE_KEYS.BUDGETS, updated);
      return updated.find(item => item.id === id) as Budget;
    }
  },

  deleteBudget: async (userId: string, id: string): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      setLocal(userId, STORAGE_KEYS.BUDGETS, current.filter(item => item.id !== id));
      return;
    }
    try {
      await firestore.deleteBudgetForUser(userId, id);
    } catch (e) {
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      setLocal(userId, STORAGE_KEYS.BUDGETS, current.filter(item => item.id !== id));
    }
  },

  // Goals
  getGoals: async (userId: string): Promise<Goal[]> => {
    if (userId === 'guest_user') {
      return getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
    }
    try {
      return await firestore.getGoalsForUser(userId);
    } catch (e) {
      return getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
    }
  },

  addGoal: async (userId: string, g: Omit<Goal, 'id'>): Promise<Goal> => {
    if (userId === 'guest_user') {
      const newGoal = { ...g, id: Math.random().toString(36).substr(2, 9) } as Goal;
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      setLocal(userId, STORAGE_KEYS.GOALS, [...current, newGoal]);
      return newGoal;
    }
    try {
      return await firestore.addGoalForUser(userId, g);
    } catch (e) {
      const newGoal = { ...g, id: Math.random().toString(36).substr(2, 9) } as Goal;
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      setLocal(userId, STORAGE_KEYS.GOALS, [...current, newGoal]);
      return newGoal;
    }
  },

  updateGoal: async (userId: string, id: string, g: Partial<Goal>): Promise<Goal> => {
    if (userId === 'guest_user') {
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      const updated = current.map(item => item.id === id ? { ...item, ...g } : item);
      setLocal(userId, STORAGE_KEYS.GOALS, updated);
      return updated.find(item => item.id === id) as Goal;
    }
    try {
      await firestore.updateGoalForUser(userId, id, g);
      return { id, ...g } as Goal;
    } catch (e) {
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      const updated = current.map(item => item.id === id ? { ...item, ...g } : item);
      setLocal(userId, STORAGE_KEYS.GOALS, updated);
      return updated.find(item => item.id === id) as Goal;
    }
  },

  deleteGoal: async (userId: string, id: string): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      setLocal(userId, STORAGE_KEYS.GOALS, current.filter(item => item.id !== id));
      return;
    }
    try {
      await firestore.deleteGoalForUser(userId, id);
    } catch (e) {
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      setLocal(userId, STORAGE_KEYS.GOALS, current.filter(item => item.id !== id));
    }
  },

  // Bills
  getBills: async (userId: string): Promise<Bill[]> => {
    if (userId === 'guest_user') {
      return getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
    }
    try {
      return await firestore.getBillsForUser(userId);
    } catch (e) {
      return getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
    }
  },

  // Portfolio
  getPortfolio: async (userId: string): Promise<PortfolioAsset[]> => {
    if (userId === 'guest_user') {
      return getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
    }
    try {
      return await firestore.getPortfolioForUser(userId);
    } catch (e) {
      return getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
    }
  }
};
