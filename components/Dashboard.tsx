
import React, { useMemo, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionType, Currency, CURRENCY_SYMBOLS, Bill, Budget, FinancialHealthScore, User, PortfolioAsset, Debt } from '../types';
import CategoryPieChart from './CategoryPieChart';
import ExpenseTrendChart from './ExpenseTrendChart';
import FinancialStressTest from './FinancialStressTest';
import BillsWidget from './BillsWidget';
import BudgetProgress from './BudgetProgress';
import RecentTransactions from './RecentTransactions';
import AiSummary from './AiSummary';
import { ArrowUpIcon, ArrowDownIcon, ScaleIcon, WalletIcon, SparklesIcon, PlusIcon, CloseIcon } from './icons';
import { api } from '../services/api';
import { currencyService } from '../services/currencyService';
import TransactionForm from './TransactionForm';
import { formatAmount } from '../services/utils';

interface DashboardProps {
  transactions: Transaction[];
  currency: Currency;
  user: User;
  onRefreshData?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, currency, user, onRefreshData }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [splittingBill, setSplittingBill] = useState<Bill | null>(null);
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [newCashBalance, setNewCashBalance] = useState(0);
  const [newOnlineBalance, setNewOnlineBalance] = useState(0);

  useEffect(() => {
    if (isEditBalanceModalOpen) {
      // Note: user object is already converted to active currency in props
      setNewCashBalance(user.initialCashBalance || 0);
      setNewOnlineBalance(user.initialOnlineBalance || 0);
    }
  }, [isEditBalanceModalOpen, user.initialCashBalance, user.initialOnlineBalance]);

  const handleSplitBill = async (transactionData: any) => {
    try {
      const rateData = await currencyService.getRates(Currency.USD);
      const rates = rateData?.rates || {};
      const baseAmount = currencyService.convertToBase(transactionData.amount, currency, rates);

      await api.addTransaction(user.uid, { ...transactionData, amount: baseAmount });
      setIsSplitBillModalOpen(false);
      setSplittingBill(null);
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error('Error splitting bill:', error);
    }
  };

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rateDataRates = await currencyService.getRates(Currency.USD);
      const rates = rateDataRates?.rates || {};

      const baseCash = currencyService.convertToBase(newCashBalance, currency, rates);
      const baseOnline = currencyService.convertToBase(newOnlineBalance, currency, rates);

      await api.updateUser(user.uid, {
        initialCashBalance: baseCash,
        initialOnlineBalance: baseOnline
      });
      setIsEditBalanceModalOpen(false);
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [billsData, budgetsData, healthData, portfolioData, debtData] = await Promise.all([
        api.getBills(user.uid),
        api.getBudgets(user.uid),
        api.getHealthScore(user.uid),
        api.getPortfolio(user.uid),
        api.getDebts(user.uid)
      ]);
      setBills(billsData);
      setBudgets(budgetsData);
      setHealthScore(healthData);
      setPortfolio(portfolioData);
      setDebts(debtData);
    };
    fetchData();
  }, []);

  const { totalIncome, totalExpenses, balance, netWorth, cashBalance, onlineBalance, totalOwed, totalOwe } = useMemo(() => {
    const stats = transactions.reduce(
      (acc, t) => {
        if (t.type === TransactionType.INCOME) {
          acc.totalIncome += t.amount;
          if (t.paymentMode === 'Cash') acc.cashBalance += t.amount;
          else acc.onlineBalance += t.amount;
        } else {
          acc.totalExpenses += t.amount;
          if (t.paymentMode === 'Cash') acc.cashBalance -= t.amount;
          else acc.onlineBalance -= t.amount;
        }
        acc.balance = acc.totalIncome - acc.totalExpenses;
        return acc;
      },
      {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        cashBalance: user.initialCashBalance || 0,
        onlineBalance: user.initialOnlineBalance || 0
      }
    );

    const debtStats = debts.reduce((acc, d) => {
      if (d.isCompleted) return acc;
      if (d.type === 'Lent') acc.totalOwed += d.remainingAmount;
      else acc.totalOwe += d.remainingAmount;
      return acc;
    }, { totalOwed: 0, totalOwe: 0 });

    const portfolioValue = portfolio.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
    return {
      ...stats,
      ...debtStats,
      netWorth: stats.cashBalance + stats.onlineBalance + portfolioValue + debtStats.totalOwed - debtStats.totalOwe
    };
  }, [transactions, portfolio, debts, user]);

  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === TransactionType.EXPENSE), [transactions]);

  return (
    <div className="space-y-8">
      {/* AI Summary Banner */}
      <AiSummary transactions={transactions} budgets={budgets} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard 
          title="Total Income" 
          amount={totalIncome} 
          icon={<ArrowUpIcon className="h-6 w-6" />} 
          currency={currency} 
          color="emerald"
          delay={0}
        />
        <StatCard 
          title="Total Expenses" 
          amount={totalExpenses} 
          icon={<ArrowDownIcon className="h-6 w-6" />} 
          currency={currency} 
          color="rose"
          delay={0.1}
        />
        <div className="relative group/card">
          <StatCard
            title="Total Balance"
            amount={cashBalance + onlineBalance}
            icon={<WalletIcon className="h-6 w-6" />}
            currency={currency}
            color="indigo"
            delay={0.15}
          />
          <button
            onClick={() => setIsEditBalanceModalOpen(true)}
            className="absolute top-6 right-6 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity z-20"
            title="Edit Balance"
          >
            <PlusIcon className="w-4 h-4 rotate-45" />
          </button>
        </div>
        <StatCard
          title="Total Owed"
          amount={totalOwed}
          icon={<ArrowUpIcon className="h-6 w-6" />}
          currency={currency}
          color="emerald"
          delay={0.2}
        />
        <StatCard
          title="Total Owe"
          amount={totalOwe}
          icon={<ArrowDownIcon className="h-6 w-6" />}
          currency={currency}
          color="rose"
          delay={0.25}
        />
        <div className="relative group/card">
          <StatCard
            title="Net Worth"
            amount={netWorth}
            icon={<WalletIcon className="h-6 w-6" />}
            currency={currency}
            color="indigo"
            delay={0.3}
          />
          <NavLink
            to="/budgets"
            className="absolute top-6 right-6 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity z-20"
            title="Manage Assets"
          >
            <SparklesIcon className="w-4 h-4" />
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          className="lg:col-span-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FinancialStressTest transactions={transactions} currency={currency} portfolio={portfolio} />
        </motion.div>

        <motion.div 
          className="lg:col-span-4 bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">Financial Health</h3>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <SparklesIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff05" strokeWidth="8" />
                  <motion.circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="8" 
                    strokeDasharray="282.7"
                    initial={{ strokeDashoffset: 282.7 }}
                    animate={{ strokeDashoffset: 282.7 - ((healthScore?.score || 0) / 100 * 282.7) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-text-primary dark:text-white">{healthScore?.score || 0}</span>
                  <span className="text-[8px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Score</span>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                {healthScore && Object.entries(healthScore.breakdown).map(([key, val]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[8px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest mb-1">{key}</p>
                    <p className="text-xs font-bold text-text-primary dark:text-white">{val}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/5 rounded-full" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          className="lg:col-span-8 bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">Financial Pulse</h3>
              <span className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">30 Day Trend</span>
            </div>
            <div className="h-[300px]">
              <ExpenseTrendChart transactions={expenseTransactions} currency={currency} />
            </div>
        </motion.div>

        <motion.div 
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <RecentTransactions transactions={transactions} currency={currency} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <BudgetProgress transactions={transactions} budgets={budgets} currency={currency} />
        </motion.div>

        <motion.div 
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <CategoryPieChart transactions={expenseTransactions} currency={currency} />
        </motion.div>

        <motion.div 
          className="lg:col-span-4 relative group/card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <BillsWidget
            bills={bills}
            currency={currency}
            onSplitBill={(bill) => {
              setSplittingBill(bill);
              setIsSplitBillModalOpen(true);
            }}
          />
          <NavLink
            to="/budgets"
            className="absolute top-6 right-6 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity z-20"
            title="Manage Bills"
          >
            <PlusIcon className="w-4 h-4" />
          </NavLink>
        </motion.div>
      </div>

      <AnimatePresence>
        {isEditBalanceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditBalanceModalOpen(false)}
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
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Edit Balances</h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Adjust initial amounts</p>
                </div>
                <button
                  onClick={() => setIsEditBalanceModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateBalance} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Initial Cash Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCashBalance}
                    onChange={(e) => setNewCashBalance(Number(e.target.value))}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-text-primary dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Initial Online Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newOnlineBalance}
                    onChange={(e) => setNewOnlineBalance(Number(e.target.value))}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-text-primary dark:text-white font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Update Balances
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isSplitBillModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSplitBillModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Split Bill</h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Converting bill to split transaction</p>
                </div>
                <button
                  onClick={() => setIsSplitBillModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <TransactionForm
                onSubmit={handleSplitBill}
                currency={currency}
                userId={user.uid}
                initialData={splittingBill ? {
                  id: '',
                  description: splittingBill.name,
                  amount: splittingBill.amount,
                  type: TransactionType.EXPENSE,
                  category: splittingBill.category,
                  date: splittingBill.dueDate,
                  isSplit: true,
                  splitCount: 2,
                  splitWith: [''],
                  paymentMode: splittingBill.paymentMode || 'Online',
                  upiId: splittingBill.upiId
                } : null}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StatCardProps {
    title: string;
    amount: number;
    icon: React.ReactNode;
    currency: Currency;
    color: 'emerald' | 'rose' | 'indigo';
    delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, amount, icon, currency, color, delay }) => {
    const isNegative = amount < 0;
    const currencySymbol = CURRENCY_SYMBOLS[currency];
    const formattedAmount = currencySymbol + formatAmount(amount);

    const colorClasses = {
      emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
      indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    };

    // Dynamic font size based on amount length
    const getFontSize = (text: string) => {
      if (text.length > 15) return 'text-xl';
      if (text.length > 12) return 'text-2xl';
      if (text.length > 10) return 'text-3xl';
      return 'text-4xl';
    };

    const fontSizeClass = getFontSize(formattedAmount);

    return (
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group h-full flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <div className="relative z-10">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-4 md:mb-6 transition-transform group-hover:scale-110 duration-300`}>
                {icon}
              </div>
              <p className="text-[10px] md:text-sm font-medium text-text-secondary dark:text-gray-400 mb-1 uppercase tracking-wider truncate">{title}</p>
              <div className="flex items-baseline gap-1 overflow-hidden">
                <p className={`${fontSizeClass} font-bold text-text-primary dark:text-white tracking-tighter break-all ${isNegative && color === 'indigo' ? 'text-rose-500' : ''}`}>
                  {isNegative && '-'}{formattedAmount}
                </p>
              </div>
            </div>
            
            {/* Decorative background element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.05] ${color === 'emerald' ? 'bg-emerald-600' : color === 'rose' ? 'bg-rose-600' : 'bg-indigo-600'}`} />
        </motion.div>
    );
}

export default Dashboard;
