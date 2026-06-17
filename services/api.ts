import { Transaction, Budget, Goal, Bill, Debt, PortfolioAsset, FinancialHealthScore, User, ChatMessage } from '../types';
import * as firestore from './firestoreService';

const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  BILLS: 'bills',
  PORTFOLIO: 'portfolio',
  DEBTS: 'debts',
  OFFLINE_QUEUE: 'offline_queue'
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

const addToOfflineQueue = (userId: string, type: string, data: any, id?: string) => {
  const queue = getLocal<any>(userId, STORAGE_KEYS.OFFLINE_QUEUE);
  setLocal(userId, STORAGE_KEYS.OFFLINE_QUEUE, [...queue, { type, data, id, timestamp: Date.now() }]);
};

export const api = {
  // Transactions
  getTransactions: async (userId: string, forceRefresh: boolean = true): Promise<Transaction[]> => {
    if (userId === 'guest_user') {
      return getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
    }
    if (!forceRefresh) {
        return getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
    }
    try {
      const trans = await firestore.getTransactionsForUser(userId);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, trans);
      return trans;
    } catch (e) {
      console.warn("Using offline transactions", e);
      return getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
    }
  },

  addTransaction: async (userId: string, t: Omit<Transaction, 'id'>): Promise<Transaction> => {
    let result: Transaction;
    if (userId === 'guest_user') {
      result = { ...t, id: Math.random().toString(36).substr(2, 9) } as Transaction;
      const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
      setLocal(userId, STORAGE_KEYS.TRANSACTIONS, [...current, result]);
    } else {
      try {
        result = await firestore.addTransactionForUser(userId, t);
        // Refresh local cache after successful write
        const trans = await firestore.getTransactionsForUser(userId);
        setLocal(userId, STORAGE_KEYS.TRANSACTIONS, trans);
      } catch (e) {
        result = { ...t, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as Transaction;
        const current = getLocal<Transaction>(userId, STORAGE_KEYS.TRANSACTIONS);
        setLocal(userId, STORAGE_KEYS.TRANSACTIONS, [...current, result]);

        // Add to offline queue
        addToOfflineQueue(userId, 'ADD_TRANSACTION', t);
      }
    }

    // Auto-create Debt entry for split bills
    if (t.isSplit && t.splitWith && t.splitWith.length > 0) {
      const splitAmount = t.amount / (t.splitCount || 2);
      for (const person of t.splitWith) {
        if (person.trim()) {
          await api.addDebt(userId, {
            person: person,
            amount: splitAmount,
            type: 'Lent',
            date: t.date,
            remainingAmount: splitAmount,
            isCompleted: false,
            notes: `Split from: ${t.description}`,
            paymentMode: t.paymentMode || 'Online'
          });
        }
      }
    }

    return result;
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
      addToOfflineQueue(userId, 'UPDATE_TRANSACTION', t, id);
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
      addToOfflineQueue(userId, 'DELETE_TRANSACTION', null, id);
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
      const budgets = await firestore.getBudgetsForUser(userId);
      setLocal(userId, STORAGE_KEYS.BUDGETS, budgets);
      return budgets;
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
      const result = await firestore.addBudgetForUser(userId, b);
      const budgets = await firestore.getBudgetsForUser(userId);
      setLocal(userId, STORAGE_KEYS.BUDGETS, budgets);
      return result;
    } catch (e) {
      const newBudget = { ...b, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as Budget;
      const current = getLocal<Budget>(userId, STORAGE_KEYS.BUDGETS);
      setLocal(userId, STORAGE_KEYS.BUDGETS, [...current, newBudget]);
      addToOfflineQueue(userId, 'ADD_BUDGET', b);
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
      addToOfflineQueue(userId, 'UPDATE_BUDGET', b, id);
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
      addToOfflineQueue(userId, 'DELETE_BUDGET', null, id);
    }
  },

  // Goals
  getGoals: async (userId: string): Promise<Goal[]> => {
    if (userId === 'guest_user') {
      return getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
    }
    try {
      const goals = await firestore.getGoalsForUser(userId);
      setLocal(userId, STORAGE_KEYS.GOALS, goals);
      return goals;
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
      const result = await firestore.addGoalForUser(userId, g);
      const goals = await firestore.getGoalsForUser(userId);
      setLocal(userId, STORAGE_KEYS.GOALS, goals);
      return result;
    } catch (e) {
      const newGoal = { ...g, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as Goal;
      const current = getLocal<Goal>(userId, STORAGE_KEYS.GOALS);
      setLocal(userId, STORAGE_KEYS.GOALS, [...current, newGoal]);
      addToOfflineQueue(userId, 'ADD_GOAL', g);
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
      addToOfflineQueue(userId, 'UPDATE_GOAL', g, id);
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
      addToOfflineQueue(userId, 'DELETE_GOAL', null, id);
    }
  },

  // Bills
  getBills: async (userId: string): Promise<Bill[]> => {
    if (userId === 'guest_user') {
      return getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
    }
    try {
      const bills = await firestore.getBillsForUser(userId);
      setLocal(userId, STORAGE_KEYS.BILLS, bills);
      return bills;
    } catch (e) {
      return getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
    }
  },

  addBill: async (userId: string, bill: Omit<Bill, 'id'>): Promise<Bill> => {
    if (userId === 'guest_user') {
      const newBill = { ...bill, id: Math.random().toString(36).substr(2, 9) } as Bill;
      const current = getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
      setLocal(userId, STORAGE_KEYS.BILLS, [...current, newBill]);
      return newBill;
    }
    try {
      const result = await firestore.addBillForUser(userId, bill);
      const bills = await firestore.getBillsForUser(userId);
      setLocal(userId, STORAGE_KEYS.BILLS, bills);
      return result;
    } catch (e) {
      const newBill = { ...bill, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as Bill;
      const current = getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
      setLocal(userId, STORAGE_KEYS.BILLS, [...current, newBill]);
      addToOfflineQueue(userId, 'ADD_BILL', bill);
      return newBill;
    }
  },

  updateBill: async (userId: string, id: string, bill: Partial<Bill>): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
      const updated = current.map(item => item.id === id ? { ...item, ...bill } : item);
      setLocal(userId, STORAGE_KEYS.BILLS, updated);
      return;
    }
    try {
      await firestore.updateBillForUser(userId, id, bill);
    } catch (e) {
      const current = getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
      const updated = current.map(item => item.id === id ? { ...item, ...bill } : item);
      setLocal(userId, STORAGE_KEYS.BILLS, updated);
      addToOfflineQueue(userId, 'UPDATE_BILL', bill, id);
    }
  },

  deleteBill: async (userId: string, id: string): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
      setLocal(userId, STORAGE_KEYS.BILLS, current.filter(item => item.id !== id));
      return;
    }
    try {
      await firestore.deleteBillForUser(userId, id);
    } catch (e) {
      const current = getLocal<Bill>(userId, STORAGE_KEYS.BILLS);
      setLocal(userId, STORAGE_KEYS.BILLS, current.filter(item => item.id !== id));
      addToOfflineQueue(userId, 'DELETE_BILL', null, id);
    }
  },

  // Portfolio
  getPortfolio: async (userId: string): Promise<PortfolioAsset[]> => {
    if (userId === 'guest_user') {
      return getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
    }
    try {
      const assets = await firestore.getPortfolioForUser(userId);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, assets);
      return assets;
    } catch (e) {
      return getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
    }
  },

  addPortfolioAsset: async (userId: string, asset: Omit<PortfolioAsset, 'id'>): Promise<PortfolioAsset> => {
    if (userId === 'guest_user') {
      const newAsset = { ...asset, id: Math.random().toString(36).substr(2, 9) } as PortfolioAsset;
      const current = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, [...current, newAsset]);
      return newAsset;
    }
    try {
      const result = await firestore.addPortfolioAssetForUser(userId, asset);
      const assets = await firestore.getPortfolioForUser(userId);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, assets);
      return result;
    } catch (e) {
      const newAsset = { ...asset, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as PortfolioAsset;
      const current = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, [...current, newAsset]);
      addToOfflineQueue(userId, 'ADD_PORTFOLIO', asset);
      return newAsset;
    }
  },

  updatePortfolioAsset: async (userId: string, id: string, asset: Partial<PortfolioAsset>): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
      const updated = current.map(item => item.id === id ? { ...item, ...asset } : item);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, updated);
      return;
    }
    try {
      await firestore.updatePortfolioAssetForUser(userId, id, asset);
    } catch (e) {
      const current = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
      const updated = current.map(item => item.id === id ? { ...item, ...asset } : item);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, updated);
      addToOfflineQueue(userId, 'UPDATE_PORTFOLIO', asset, id);
    }
  },

  deletePortfolioAsset: async (userId: string, id: string): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, current.filter(item => item.id !== id));
      return;
    }
    try {
      await firestore.deletePortfolioAssetForUser(userId, id);
    } catch (e) {
      const current = getLocal<PortfolioAsset>(userId, STORAGE_KEYS.PORTFOLIO);
      setLocal(userId, STORAGE_KEYS.PORTFOLIO, current.filter(item => item.id !== id));
      addToOfflineQueue(userId, 'DELETE_PORTFOLIO', null, id);
    }
  },

  // Debts
  getDebts: async (userId: string): Promise<Debt[]> => {
    if (userId === 'guest_user') {
      return getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
    }
    try {
      const debts = await firestore.getDebtsForUser(userId);
      setLocal(userId, STORAGE_KEYS.DEBTS, debts);
      return debts;
    } catch (e) {
      return getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
    }
  },

  addDebt: async (userId: string, debt: Omit<Debt, 'id'>): Promise<Debt> => {
    if (userId === 'guest_user') {
      const newDebt = { ...debt, id: Math.random().toString(36).substr(2, 9) } as Debt;
      const current = getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
      setLocal(userId, STORAGE_KEYS.DEBTS, [...current, newDebt]);
      return newDebt;
    }
    try {
      const result = await firestore.addDebtForUser(userId, debt);
      const debts = await firestore.getDebtsForUser(userId);
      setLocal(userId, STORAGE_KEYS.DEBTS, debts);
      return result;
    } catch (e) {
      const newDebt = { ...debt, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as Debt;
      const current = getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
      setLocal(userId, STORAGE_KEYS.DEBTS, [...current, newDebt]);
      addToOfflineQueue(userId, 'ADD_DEBT', debt);
      return newDebt;
    }
  },

  updateDebt: async (userId: string, id: string, debt: Partial<Debt>): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
      const updated = current.map(item => item.id === id ? { ...item, ...debt } : item);
      setLocal(userId, STORAGE_KEYS.DEBTS, updated);
      return;
    }
    try {
      await firestore.updateDebtForUser(userId, id, debt);
    } catch (e) {
      const current = getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
      const updated = current.map(item => item.id === id ? { ...item, ...debt } : item);
      setLocal(userId, STORAGE_KEYS.DEBTS, updated);
      addToOfflineQueue(userId, 'UPDATE_DEBT', debt, id);
    }
  },

  deleteDebt: async (userId: string, id: string): Promise<void> => {
    if (userId === 'guest_user') {
      const current = getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
      setLocal(userId, STORAGE_KEYS.DEBTS, current.filter(item => item.id !== id));
      return;
    }
    try {
      await firestore.deleteDebtForUser(userId, id);
    } catch (e) {
      const current = getLocal<Debt>(userId, STORAGE_KEYS.DEBTS);
      setLocal(userId, STORAGE_KEYS.DEBTS, current.filter(item => item.id !== id));
      addToOfflineQueue(userId, 'DELETE_DEBT', null, id);
    }
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<void> => {
    if (userId === 'guest_user') {
      const userData = JSON.parse(localStorage.getItem('finsight_user') || '{}');
      const updated = { ...userData, ...data };
      localStorage.setItem('finsight_user', JSON.stringify(updated));
      return;
    }
    try {
      await firestore.updateUserProfile(userId, data);
    } catch (e) {
      addToOfflineQueue(userId, 'UPDATE_USER', data);
    }
  },

  getChatMessages: async (userId: string): Promise<ChatMessage[]> => {
    if (userId === 'guest_user') {
      return getLocal<ChatMessage>(userId, 'chat_messages');
    }
    try {
      const msgs = await firestore.getChatMessagesForUser(userId);
      setLocal(userId, 'chat_messages', msgs);
      return msgs;
    } catch (e) {
      return getLocal<ChatMessage>(userId, 'chat_messages');
    }
  },

  addChatMessage: async (userId: string, message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> => {
    if (userId === 'guest_user') {
      const newMessage = { ...message, id: Math.random().toString(36).substr(2, 9) } as ChatMessage;
      const current = getLocal<ChatMessage>(userId, 'chat_messages');
      setLocal(userId, 'chat_messages', [...current, newMessage]);
      return newMessage;
    }
    try {
      return await firestore.addChatMessageForUser(userId, message);
    } catch (e) {
      const newMessage = { ...message, id: 'offline_' + Math.random().toString(36).substr(2, 9) } as ChatMessage;
      const current = getLocal<ChatMessage>(userId, 'chat_messages');
      setLocal(userId, 'chat_messages', [...current, newMessage]);

      // Add to offline queue
      addToOfflineQueue(userId, 'ADD_CHAT_MESSAGE', message);

      return newMessage;
    }
  },

  syncOfflineData: async (userId: string): Promise<void> => {
    if (userId === 'guest_user') return;

    const queue = getLocal<any>(userId, STORAGE_KEYS.OFFLINE_QUEUE);
    if (queue.length === 0) return;

    // Sort queue by timestamp to ensure chronological sync
    const sortedQueue = [...queue].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const remainingQueue: any[] = [];

    for (const item of sortedQueue) {
      try {
        switch (item.type) {
          case 'ADD_TRANSACTION':
            await firestore.addTransactionForUser(userId, item.data);
            break;
          case 'UPDATE_TRANSACTION':
            await firestore.updateTransactionForUser(userId, item.id, item.data);
            break;
          case 'DELETE_TRANSACTION':
            await firestore.deleteTransactionForUser(userId, item.id);
            break;
          case 'ADD_BUDGET':
            await firestore.addBudgetForUser(userId, item.data);
            break;
          case 'UPDATE_BUDGET':
            await firestore.updateBudgetForUser(userId, item.id, item.data);
            break;
          case 'DELETE_BUDGET':
            await firestore.deleteBudgetForUser(userId, item.id);
            break;
          case 'ADD_GOAL':
            await firestore.addGoalForUser(userId, item.data);
            break;
          case 'UPDATE_GOAL':
            await firestore.updateGoalForUser(userId, item.id, item.data);
            break;
          case 'DELETE_GOAL':
            await firestore.deleteGoalForUser(userId, item.id);
            break;
          case 'ADD_BILL':
            await firestore.addBillForUser(userId, item.data);
            break;
          case 'UPDATE_BILL':
            await firestore.updateBillForUser(userId, item.id, item.data);
            break;
          case 'DELETE_BILL':
            await firestore.deleteBillForUser(userId, item.id);
            break;
          case 'ADD_PORTFOLIO':
            await firestore.addPortfolioAssetForUser(userId, item.data);
            break;
          case 'UPDATE_PORTFOLIO':
            await firestore.updatePortfolioAssetForUser(userId, item.id, item.data);
            break;
          case 'DELETE_PORTFOLIO':
            await firestore.deletePortfolioAssetForUser(userId, item.id);
            break;
          case 'ADD_DEBT':
            await firestore.addDebtForUser(userId, item.data);
            break;
          case 'UPDATE_DEBT':
            await firestore.updateDebtForUser(userId, item.id, item.data);
            break;
          case 'DELETE_DEBT':
            await firestore.deleteDebtForUser(userId, item.id);
            break;
          case 'UPDATE_USER':
            await firestore.updateUserProfile(userId, item.data);
            break;
          case 'ADD_CHAT_MESSAGE':
            await firestore.addChatMessageForUser(userId, item.data);
            break;
        }
      } catch (e) {
        console.error("Sync failed for item:", item, e);
        remainingQueue.push(item);
      }
    }

    setLocal(userId, STORAGE_KEYS.OFFLINE_QUEUE, remainingQueue);
  },

  getOfflineQueueStatus: (userId: string): number => {
    return getLocal<any>(userId, STORAGE_KEYS.OFFLINE_QUEUE).length;
  }
};
