import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionType, Category, Currency, CURRENCY_SYMBOLS, User } from '../types';
import { api } from '../services/api';
import { PlusIcon, SearchIcon, FilterIcon, TrashIcon, EditIcon, ArrowUpIcon, ArrowDownIcon, ChartPieIcon } from '../components/icons';
import TransactionForm from '../components/TransactionForm';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TransactionsPageProps {
  currency: Currency;
  user: User;
  transactions?: Transaction[];
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ currency, user, transactions: propTransactions }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  useEffect(() => {
    if (propTransactions) {
      setTransactions(propTransactions);
      setLoading(false);
    } else {
      fetchTransactions();
    }
  }, [propTransactions]);

  const fetchTransactions = async () => {
    try {
      const data = await api.getTransactions(user.uid);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    try {
      await api.addTransaction(user.uid, t);
      fetchTransactions();
      setShowForm(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(user.uid, id);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTransactions.map(id => api.deleteTransaction(user.uid, id)));
      setSelectedTransactions([]);
      fetchTransactions();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesType = filterType === 'All' || t.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      const valA = sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
      const valB = sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

  const categories = [
    'All',
    ...Array.from(new Set([...Object.values(Category), ...transactions.map(t => t.category)])),
  ];

  // Analytics Data
  const chartData = useMemo(() => {
    if (analyticsPeriod === 'weekly') {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(date => {
        const dayTotal = transactions
          .filter(t => t.date === date && t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          amount: dayTotal
        };
      });
    } else if (analyticsPeriod === 'monthly') {
      // Last 30 days grouped by week or just last 12 months?
      // User said "track there weekly, monthly, yearly expences"
      // Let's do last 6 months for monthly view
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.getMonth(), year: d.getFullYear() };
      }).reverse();

      return months.map(({ month, year }) => {
        const monthTotal = transactions
          .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === month && d.getFullYear() === year && t.type === TransactionType.EXPENSE;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          label: new Date(year, month).toLocaleDateString('en-US', { month: 'short' }),
          amount: monthTotal
        };
      });
    } else {
      // Yearly - last 5 years
      const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).reverse();
      return years.map(year => {
        const yearTotal = transactions
          .filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && t.type === TransactionType.EXPENSE;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          label: String(year),
          amount: yearTotal
        };
      });
    }
  }, [transactions, analyticsPeriod]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + t.amount;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2">Transactions</h1>
          <p className="text-text-secondary dark:text-gray-400 font-mono text-sm uppercase tracking-widest">Manage your cash flow</p>
        </div>
        <div className="flex items-center gap-4">
          {selectedTransactions.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
            >
              <TrashIcon className="w-5 h-5" />
              Delete {selectedTransactions.length}
            </motion.button>
          )}
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <PlusIcon className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-text-primary dark:text-white capitalize">{analyticsPeriod} Expense Trend</h3>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    analyticsPeriod === p
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-text-secondary dark:text-gray-400 hover:text-indigo-600'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Spent']}
                />
                <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-text-primary dark:text-white mb-6">Category Mix</h3>
          <div className="flex-1 h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                 >
                   {categoryData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 3).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-text-secondary dark:text-gray-400 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-text-primary dark:text-white">{currencySymbol}{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>

          {/* Interactive Filters Controls Group */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Controls for Types */}
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              {['All', TransactionType.INCOME, TransactionType.EXPENSE].map((typeOption) => (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => setFilterType(typeOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === typeOption
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-text-secondary dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {typeOption === 'All' ? 'All Types' : typeOption}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            >
              {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-wider hidden sm:inline">Sort:</span>
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'date'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-text-secondary dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Date
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('amount')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'amount'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-text-secondary dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Amount
                </button>
              </div>

              {/* Order Toggle Icon Button */}
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400"
                title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
              >
                {sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-bottom border-gray-100 dark:border-gray-700">
                <th className="px-8 py-5 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedTransactions(e.target.checked ? filteredTransactions.map(t => t.id) : [])}
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-8 py-5 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-8 py-5 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-text-secondary dark:text-gray-400 font-mono uppercase tracking-widest">Loading...</td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <motion.tr 
                    key={t.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${selectedTransactions.includes(t.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedTransactions.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTransactions(prev => [...prev, t.id]);
                          else setSelectedTransactions(prev => prev.filter(id => id !== t.id));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-8 py-5 text-sm font-mono text-text-secondary dark:text-gray-400">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-text-primary dark:text-white">{t.description}</p>
                        {t.isSplit && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[8px] font-mono font-bold uppercase tracking-widest border border-indigo-500/20">
                            Split {t.splitCount}x
                          </span>
                        )}
                      </div>
                      {t.notes && <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">{t.notes}</p>}
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest rounded-full">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-sm font-bold font-mono text-right ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-text-secondary dark:text-gray-400 font-mono uppercase tracking-widest">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-gray-800 md:rounded-[2.5rem] md:p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-text-primary dark:text-white">New Transaction</h2>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <PlusIcon className="w-6 h-6 rotate-45 text-gray-400" />
                </button>
              </div>
              <TransactionForm
                onSubmit={handleAddTransaction}
                currency={currency}
                userId={user.uid}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionsPage;
