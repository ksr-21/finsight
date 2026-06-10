import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUpIcon, 
  SparklesIcon, 
  RefreshIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CalendarIcon,
  WalletIcon
} from '../components/icons';
import { Transaction, Currency, CURRENCY_SYMBOLS } from '../types';
import { aiService } from '../services/aiService';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface InsightsPageProps {
  transactions: Transaction[];
  currency: Currency;
}

const InsightsPage: React.FC<InsightsPageProps> = ({ transactions, currency }) => {
  const [forecast, setForecast] = useState<{ nextWeek: number, nextMonth: number, reasoning: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  const fetchAiData = async () => {
    setLoading(true);
    try {
      const [forecastData, insightsData] = await Promise.all([
        aiService.getExpenseForecast(transactions),
        aiService.getFinancialInsights(transactions, [])
      ]);
      setForecast(forecastData);
      setInsights(insightsData);
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      fetchAiData();
    } else {
      setLoading(false);
    }
  }, [transactions]);

  const { expenses, dailySpending, totalSpentLastMonth, savingsRate, expenseRatio } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'Expense');

    const last30DaysDates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailySpending = last30DaysDates.map(date => {
      const amount = expenses
        .filter(t => t.date === date)
        .reduce((sum, t) => sum + t.amount, 0);
      return { date, amount };
    });

    const totalSpentLastMonth = dailySpending.reduce((sum, d) => sum + d.amount, 0);

    const now = new Date();
    const last30DaysTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      const diffTime = Math.abs(now.getTime() - tDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const income30Days = last30DaysTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses30Days = last30DaysTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = income30Days === 0 ? 0 : Math.max(0, ((income30Days - expenses30Days) / income30Days) * 100);
    const expenseRatio = income30Days === 0 ? (expenses30Days > 0 ? 100 : 0) : Math.min(100, (expenses30Days / income30Days) * 100);

    return { expenses, dailySpending, totalSpentLastMonth, savingsRate, expenseRatio };
  }, [transactions]);

  const chartData = useMemo(() => {
    const data = [...dailySpending];
    if (forecast) {
      // Add a predicted point for next week (simplified)
      const lastDate = new Date(data[data.length - 1].date);
      const nextWeekDate = new Date(lastDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      
      data.push({
        date: nextWeekDate.toISOString().split('T')[0],
        amount: forecast.nextWeek / 7, // avg daily for next week
        isPrediction: true
      } as any);
    }
    return data;
  }, [dailySpending, forecast]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshIcon className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-gray-500 font-mono text-sm animate-pulse">CONSULTING FIN-SIGHT AI...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 mb-2">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">AI-Powered Intelligence</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Financial Insights</h1>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Last 30 Days</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{CURRENCY_SYMBOLS[currency]}{totalSpentLastMonth.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Predictions Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUpIcon className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUpIcon className="w-6 h-6 text-indigo-500" />
                </div>
                Expense Forecast
              </h2>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Live Analysis
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-gray-500 mb-4">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Next 7 Days</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {CURRENCY_SYMBOLS[currency]}{forecast?.nextWeek.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-emerald-500 font-mono font-bold">Predicted</span>
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-gray-500 mb-4">
                  <WalletIcon className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Next 30 Days</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {CURRENCY_SYMBOLS[currency]}{forecast?.nextMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-indigo-500 font-mono font-bold">Predicted</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
              <div className="flex items-center gap-3 text-indigo-500 mb-3">
                <SparklesIcon className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">AI Reasoning</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                "{forecast?.reasoning}"
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }}
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    itemStyle={{ color: '#6366f1' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    dot={(props: any) => {
                      if (props.payload.isPrediction) {
                        return <circle cx={props.cx} cy={props.cy} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} />;
                      }
                      return null;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* AI Insights Sidebar */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <SparklesIcon className="w-24 h-24" />
            </div>
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-indigo-400" />
              Smart Tips
            </h3>

            <div className="space-y-6">
              {insights.map((insight, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">
                    {insight}
                  </p>
                </motion.div>
              ))}
            </div>

            <button
              onClick={fetchAiData}
              disabled={loading}
              className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Generate New Analysis'}
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Spending Health</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500">
                  <span>Savings Rate</span>
                  <span className="text-emerald-500">{savingsRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${savingsRate}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500">
                  <span>Expense Ratio</span>
                  <span className="text-amber-500">{expenseRatio.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${expenseRatio}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
