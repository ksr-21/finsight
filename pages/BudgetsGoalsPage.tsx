import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Budget, Goal, Currency, CURRENCY_SYMBOLS, Category, User } from '../types';
import { api } from '../services/api';
import { PlusIcon, TargetIcon, WalletIcon, TrendingUpIcon, CloseIcon, EditIcon, TrashIcon, CalendarIcon, SparklesIcon } from '../components/icons';
import BudgetForm from '../components/BudgetForm';
import GoalForm from '../components/GoalForm';
import BillForm from '../components/BillForm';
import PortfolioForm from '../components/PortfolioForm';
import { Bill, PortfolioAsset } from '../types';

interface BudgetsGoalsPageProps {
  currency: Currency;
  transactions: any[];
  user: User;
}

const BudgetsGoalsPage: React.FC<BudgetsGoalsPageProps> = ({ currency, transactions, user }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'budgets_goals' | 'bills' | 'portfolio'>('budgets_goals');

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioAsset | null>(null);

  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [isManageMode, setIsManageMode] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bData, gData, billData, portfolioData] = await Promise.all([
        api.getBudgets(user.uid),
        api.getGoals(user.uid),
        api.getBills(user.uid),
        api.getPortfolio(user.uid)
      ]);
      setBudgets(bData);
      setGoals(gData);
      setBills(billData);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Error fetching budgets/goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSubmit = async (b: Omit<Budget, 'id'>) => {
    try {
      if (editingBudget) {
        await api.updateBudget(user.uid, editingBudget.id, b);
      } else {
        await api.addBudget(user.uid, b);
      }
      setIsBudgetModalOpen(false);
      setEditingBudget(null);
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleGoalSubmit = async (g: Omit<Goal, 'id'>) => {
    try {
      if (editingGoal) {
        await api.updateGoal(user.uid, editingGoal.id, g);
      } else {
        await api.addGoal(user.uid, g);
      }
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      fetchData();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await api.deleteBudget(user.uid, id);
        fetchData();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const handleBillSubmit = async (billData: Omit<Bill, 'id'>) => {
    try {
      if (editingBill) {
        await api.updateBill(user.uid, editingBill.id, billData);
      } else {
        await api.addBill(user.uid, billData);
      }
      setIsBillModalOpen(false);
      setEditingBill(null);
      fetchData();
    } catch (error) {
      console.error('Error saving bill:', error);
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await api.deleteBill(user.uid, id);
        fetchData();
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const handlePortfolioSubmit = async (assetData: Omit<PortfolioAsset, 'id'>) => {
    try {
      if (editingPortfolio) {
        await api.updatePortfolioAsset(user.uid, editingPortfolio.id, assetData);
      } else {
        await api.addPortfolioAsset(user.uid, assetData);
      }
      setIsPortfolioModalOpen(false);
      setEditingPortfolio(null);
      fetchData();
    } catch (error) {
      console.error('Error saving portfolio asset:', error);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await api.deletePortfolioAsset(user.uid, id);
        fetchData();
      } catch (error) {
        console.error('Error deleting portfolio asset:', error);
      }
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await api.deleteGoal(user.uid, id);
        fetchData();
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal || !contributionAmount) return;

    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) return;

      await api.updateGoal(user.uid, contributingGoal.id, {
        currentAmount: contributingGoal.currentAmount + amount
      });

      // Also add a transaction for the contribution
      await api.addTransaction(user.uid, {
        description: `Goal Contribution: ${contributingGoal.name}`,
        amount: amount,
        type: 'Expense' as any, // Contributions to goals are like "expenses" for the cash balance
        category: 'Investments', // Or a special category
        date: new Date().toISOString().split('T')[0],
        notes: `Savings contribution to ${contributingGoal.name}`
      });

      setIsContributeModalOpen(false);
      setContributionAmount('');
      setContributingGoal(null);
      fetchData();
      // We need to refresh transactions too if we want App.tsx to see it,
      // but App.tsx owns transactions state. This is a bit tricky with current architecture.
      // For now, it updates local storage and goal display.
      window.location.reload(); // Simple way to refresh all state
    } catch (error) {
      console.error('Error contributing to goal:', error);
    }
  };

  const getCategorySpending = (category: Category) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter(t => t.category === category && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2">Financial Planning</h1>
          <p className="text-text-secondary dark:text-gray-400 font-mono text-sm uppercase tracking-widest">Master your money engine</p>
        </div>
        <div className="flex items-center gap-4">
           {activeTab === 'budgets_goals' && (
             <button
                onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
                <PlusIcon className="w-5 h-5" />
                New Goal
            </button>
           )}
           {activeTab === 'bills' && (
             <button
                onClick={() => {
                setEditingBill(null);
                setIsBillModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
                <PlusIcon className="w-5 h-5" />
                Add Bill
            </button>
           )}
           {activeTab === 'portfolio' && (
             <button
                onClick={() => {
                setEditingPortfolio(null);
                setIsPortfolioModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
                <PlusIcon className="w-5 h-5" />
                Add Asset
            </button>
           )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl w-fit mb-12 border border-gray-200 dark:border-gray-800">
        {[
          { id: 'budgets_goals', label: 'Budgets & Goals', icon: WalletIcon },
          { id: 'bills', label: 'Upcoming Bills', icon: CalendarIcon },
          { id: 'portfolio', label: 'Portfolio', icon: SparklesIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setIsManageMode(false);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-text-secondary dark:text-gray-500 hover:text-text-primary dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'budgets_goals' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Budgets Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Monthly Budgets</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setEditingBudget(null);
                  setIsBudgetModalOpen(true);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
              >
                Add Budget
              </button>
              <button 
                onClick={() => setIsManageMode(!isManageMode)}
                className="text-text-secondary dark:text-gray-400 font-bold text-sm hover:underline"
              >
                {isManageMode ? 'Done' : 'Manage'}
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {budgets.length > 0 ? (
              budgets.map((b, index) => {
                const spent = getCategorySpending(b.category);
                const percent = Math.min((spent / b.amount) * 100, 100);
                const isOver = spent > b.amount;

                return (
                  <motion.div 
                    key={b.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <WalletIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary dark:text-white">{b.category}</h3>
                          <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Monthly Limit</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-bold font-mono ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {currencySymbol}{spent.toLocaleString()} / {currencySymbol}{b.amount.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">
                            {percent.toFixed(0)}% Used
                          </p>
                        </div>
                        {isManageMode && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingBudget(b);
                                setIsBudgetModalOpen(true);
                              }}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBudget(b.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-text-secondary dark:text-gray-500 font-mono uppercase tracking-widest">No budgets set yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Goals Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Savings Goals</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setIsGoalModalOpen(true);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
              >
                Add Goal
              </button>
              <button
                onClick={() => setIsManageMode(!isManageMode)}
                className="text-text-secondary dark:text-gray-400 font-bold text-sm hover:underline"
              >
                {isManageMode ? 'Done' : 'Manage'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.map((g, index) => {
                const percent = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                const remaining = g.targetAmount - g.currentAmount;

                return (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <TargetIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-text-primary dark:text-white">{g.name}</h3>
                          <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">
                            Target: {new Date(g.targetDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                            {percent.toFixed(0)}%
                          </p>
                        </div>
                        {isManageMode && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingGoal(g);
                                setIsGoalModalOpen(true);
                              }}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteGoal(g.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">
                        <span>{currencySymbol}{g.currentAmount.toLocaleString()} saved</span>
                        <span>{currencySymbol}{g.targetAmount.toLocaleString()} goal</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                          <TrendingUpIcon className="w-3 h-3" />
                          <span>{currencySymbol}{remaining > 0 ? `${remaining.toLocaleString()} to go` : 'Goal achieved!'}</span>
                        </div>
                        <button
                          onClick={() => {
                            setContributingGoal(g);
                            setIsContributeModalOpen(true);
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                        >
                          Contribute
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-text-secondary dark:text-gray-500 font-mono uppercase tracking-widest">No goals set yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'bills' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Recurring & Upcoming Bills</h2>
            <button
              onClick={() => setIsManageMode(!isManageMode)}
              className="text-text-secondary dark:text-gray-400 font-bold text-sm hover:underline"
            >
              {isManageMode ? 'Done' : 'Manage'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bills.length > 0 ? (
              bills.map((bill, index) => {
                const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bill.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 animate-pulse' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      {isManageMode && (
                        <div className="flex items-center gap-2">
                           <button onClick={() => { setEditingBill(bill); setIsBillModalOpen(true); }} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"><EditIcon className="w-4 h-4" /></button>
                           <button onClick={() => handleDeleteBill(bill.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-white mb-1">{bill.name}</h3>
                    <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest mb-4">{bill.category}</p>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold font-mono text-text-primary dark:text-white">
                          {currencySymbol}{bill.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">
                          Due {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${bill.isPaid ? 'bg-emerald-100 text-emerald-600' : isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        {bill.isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-text-secondary dark:text-gray-500 font-mono uppercase tracking-widest">No bills added yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Investment Portfolio</h2>
            <button
              onClick={() => setIsManageMode(!isManageMode)}
              className="text-text-secondary dark:text-gray-400 font-bold text-sm hover:underline"
            >
              {isManageMode ? 'Done' : 'Manage'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.length > 0 ? (
              portfolio.map((asset, index) => {
                const value = asset.quantity * asset.currentPrice;
                const profit = (asset.currentPrice - asset.averagePrice) * asset.quantity;
                const profitPercent = ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100;
                const isPositive = profit >= 0;

                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative group overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20">
                          {asset.symbol.substring(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary dark:text-white">{asset.name}</h3>
                          <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">{asset.type}</p>
                        </div>
                      </div>
                      {isManageMode && (
                        <div className="flex items-center gap-2">
                           <button onClick={() => { setEditingPortfolio(asset); setIsPortfolioModalOpen(true); }} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"><EditIcon className="w-4 h-4" /></button>
                           <button onClick={() => handleDeletePortfolio(asset.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest mb-1">Current Value</p>
                          <p className="text-2xl font-bold font-mono text-text-primary dark:text-white">{currencySymbol}{value.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : ''}{profitPercent.toFixed(2)}%
                          </p>
                          <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">P/L</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                         <div>
                            <p className="text-[9px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Holdings</p>
                            <p className="text-xs font-bold text-text-primary dark:text-white">{asset.quantity} units</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Avg Price</p>
                            <p className="text-xs font-bold text-text-primary dark:text-white">{currencySymbol}{asset.averagePrice.toLocaleString()}</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-text-secondary dark:text-gray-500 font-mono uppercase tracking-widest">No assets added yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBudgetModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                    {editingBudget ? 'Edit Budget' : 'Add Budget'}
                  </h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Monthly Limit</p>
                </div>
                <button 
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <BudgetForm 
                onSubmit={handleBudgetSubmit} 
                currency={currency} 
                initialData={editingBudget} 
              />
            </motion.div>
          </div>
        )}

        {isGoalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                    {editingGoal ? 'Edit Goal' : 'Add Goal'}
                  </h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Savings Target</p>
                </div>
                <button 
                  onClick={() => setIsGoalModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <GoalForm 
                onSubmit={handleGoalSubmit} 
                currency={currency} 
                initialData={editingGoal} 
              />
            </motion.div>
          </div>
        )}

        {isBillModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBillModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                    {editingBill ? 'Edit Bill' : 'Add Bill'}
                  </h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Payment Obligations</p>
                </div>
                <button
                  onClick={() => setIsBillModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <BillForm
                onSubmit={handleBillSubmit}
                currency={currency}
                initialData={editingBill}
              />
            </motion.div>
          </div>
        )}

        {isPortfolioModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPortfolioModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                    {editingPortfolio ? 'Edit Asset' : 'Add Asset'}
                  </h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Investment Holdings</p>
                </div>
                <button
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <PortfolioForm
                onSubmit={handlePortfolioSubmit}
                currency={currency}
                initialData={editingPortfolio}
              />
            </motion.div>
          </div>
        )}

        {isContributeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContributeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Contribute</h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">to {contributingGoal?.name}</p>
                </div>
                <button
                  onClick={() => setIsContributeModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleContribute} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Amount ({currencySymbol})</label>
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    required
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-text-primary dark:text-white font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Confirm Contribution
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetsGoalsPage;
