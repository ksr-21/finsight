import React, { useState, useEffect } from 'react';
import { Goal, Currency, CURRENCY_SYMBOLS } from '../types';

interface GoalFormProps {
  onSubmit: (g: Omit<Goal, 'id'>) => void;
  currency: Currency;
  initialData?: Goal | null;
}

const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, currency, initialData }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTargetAmount(String(initialData.targetAmount));
      setCurrentAmount(String(initialData.currentAmount));
      setTargetDate(initialData.targetDate);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    onSubmit({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      targetDate
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Goal Name</label>
          <input
            type="text"
            placeholder="e.g. New Car, Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Target Amount ({CURRENCY_SYMBOLS[currency]})</label>
            <input
              type="number"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Current Savings ({CURRENCY_SYMBOLS[currency]})</label>
            <input
              type="number"
              placeholder="0.00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Target Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
      >
        {initialData ? 'Update Goal' : 'Save Goal'}
      </button>
    </form>
  );
};

export default GoalForm;
