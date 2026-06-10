
import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, TransactionType, Currency, CURRENCY_SYMBOLS, Bill, Budget, FinancialHealthScore, User, PortfolioAsset } from '../types';
import CategoryPieChart from './CategoryPieChart';
import ExpenseTrendChart from './ExpenseTrendChart';
import FinancialStressTest from './FinancialStressTest';
import BillsWidget from './BillsWidget';
import BudgetProgress from './BudgetProgress';
import RecentTransactions from './RecentTransactions';
import AiSummary from './AiSummary';
import { ArrowUpIcon, ArrowDownIcon, ScaleIcon, WalletIcon, SparklesIcon } from './icons';
import { api } from '../services/api';

interface DashboardProps {
  transactions: Transaction[];
  currency: Currency;
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, currency, user }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [billsData, budgetsData, healthData, portfolioData] = await Promise.all([
        api.getBills(user.uid),
        api.getBudgets(user.uid),
        api.getHealthScore(user.uid),
        api.getPortfolio(user.uid)
      ]);
      setBills(billsData);
      setBudgets(budgetsData);
      setHealthScore(healthData);
      setPortfolio(portfolioData);
    };
    fetchData();
  }, []);

  const { totalIncome, totalExpenses, balance, netWorth } = useMemo(() => {
    const stats = transactions.reduce(
      (acc, t) => {
        if (t.type === TransactionType.INCOME) {
          acc.totalIncome += t.amount;
        } else {
          acc.totalExpenses += t.amount;
        }
        acc.balance = acc.totalIncome - acc.totalExpenses;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, balance: 0 }
    );

    const portfolioValue = portfolio.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
    return { ...stats, netWorth: stats.balance + portfolioValue };
  }, [transactions, portfolio]);

  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === TransactionType.EXPENSE), [transactions]);

  return (
    <div className="space-y-8">
      {/* AI Summary Banner */}
      <AiSummary transactions={transactions} budgets={budgets} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <StatCard 
          title="Balance" 
          amount={balance} 
          icon={<ScaleIcon className="h-6 w-6" />} 
          currency={currency} 
          color="indigo"
          delay={0.2}
        />
        <StatCard 
          title="Net Worth" 
          amount={netWorth} 
          icon={<WalletIcon className="h-6 w-6" />} 
          currency={currency} 
          color="indigo"
          delay={0.3}
        />
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
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <BillsWidget bills={bills} currency={currency} />
        </motion.div>
      </div>
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
    const formattedAmount = currencySymbol + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const colorClasses = {
      emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
      indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    };

    return (
        <motion.div 
          className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
                {icon}
              </div>
              <p className="text-sm font-medium text-text-secondary dark:text-gray-400 mb-1 uppercase tracking-wider">{title}</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-4xl font-bold text-text-primary dark:text-white tracking-tighter ${isNegative && color === 'indigo' ? 'text-rose-500' : ''}`}>
                  {isNegative && '-'}{formattedAmount}
                </p>
                <span className="text-xs font-mono text-text-secondary dark:text-gray-500">.00</span>
              </div>
            </div>
            
            {/* Decorative background element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.05] ${color === 'emerald' ? 'bg-emerald-600' : color === 'rose' ? 'bg-rose-600' : 'bg-indigo-600'}`} />
        </motion.div>
    );
}

export default Dashboard;
