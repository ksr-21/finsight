import React, { useState, useEffect } from 'react';
import { Budget, Category, Currency, CURRENCY_SYMBOLS } from '../types';

interface BudgetFormProps {
  onSubmit: (b: Omit<Budget, 'id'>) => void;
  currency: Currency;
  initialData?: Budget | null;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ onSubmit, currency, initialData }) => {
  const [category, setCategory] = useState<Category | 'Total'>(Category.FOOD);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setAmount(String(initialData.amount));
      setPeriod(initialData.period);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSubmit({
      category: category as Category,
      amount: parseFloat(amount),
      period: period
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'Total')}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
          >
            <option value="Total">Total Spending</option>
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Period</label>
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            {(['weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-text-secondary dark:text-gray-400'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Limit Amount ({CURRENCY_SYMBOLS[currency]})</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
      >
        {initialData ? 'Update Budget' : 'Save Budget'}
      </button>
    </form>
  );
};

export default BudgetForm;
