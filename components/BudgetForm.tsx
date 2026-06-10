import React, { useState, useEffect } from 'react';
import { Budget, Category, Currency, CURRENCY_SYMBOLS } from '../types';

interface BudgetFormProps {
  onSubmit: (b: Omit<Budget, 'id'>) => void;
  currency: Currency;
  initialData?: Budget | null;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ onSubmit, currency, initialData }) => {
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setAmount(String(initialData.amount));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSubmit({
      category,
      amount: parseFloat(amount),
      period: 'monthly'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
          >
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Monthly Limit ({CURRENCY_SYMBOLS[currency]})</label>
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
