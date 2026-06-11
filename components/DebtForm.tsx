import React, { useState, useEffect } from 'react';
import { Debt, Currency, CURRENCY_SYMBOLS, PaymentMode } from '../types';

interface DebtFormProps {
  onSubmit: (d: Omit<Debt, 'id'>) => void;
  currency: Currency;
  initialData?: Debt | null;
}

const DebtForm: React.FC<DebtFormProps> = ({ onSubmit, currency, initialData }) => {
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Borrowed' | 'Lent'>('Lent');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Online');

  useEffect(() => {
    if (initialData) {
      setPerson(initialData.person);
      setAmount(String(initialData.amount));
      setType(initialData.type);
      setDate(initialData.date);
      setDueDate(initialData.dueDate || '');
      setNotes(initialData.notes || '');
      setPaymentMode(initialData.paymentMode);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person || !amount) return;

    onSubmit({
      person,
      amount: parseFloat(amount),
      type,
      date,
      dueDate: dueDate || undefined,
      remainingAmount: initialData ? initialData.remainingAmount : parseFloat(amount),
      isCompleted: initialData ? initialData.isCompleted : false,
      notes,
      paymentMode
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Type</label>
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            {(['Borrowed', 'Lent'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === t
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-text-secondary dark:text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Person Name</label>
          <input
            type="text"
            placeholder="Who is this with?"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Amount ({CURRENCY_SYMBOLS[currency]})</label>
                <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Payment Mode</label>
                <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                >
                    <option value="Online">Online</option>
                    <option value="Cash">Cash</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Due Date (Optional)</label>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                />
            </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Notes</label>
          <textarea
            placeholder="Add some details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white min-h-[100px]"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
      >
        {initialData ? 'Update Entry' : 'Save Entry'}
      </button>
    </form>
  );
};

export default DebtForm;
