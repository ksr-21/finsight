import React, { useState, useEffect, useCallback } from 'react';
import { Bill, Category, Currency, CURRENCY_SYMBOLS, PaymentMode } from '../types';
import { SparklesIcon } from './icons';
import QRScanner from './QRScanner';

interface BillFormProps {
  onSubmit: (bill: Omit<Bill, 'id'>) => void;
  currency: Currency;
  initialData?: Bill | null;
}

const BillForm: React.FC<BillFormProps> = ({ onSubmit, currency, initialData }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(Category.BILLS);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Online');
  const [showScanner, setShowScanner] = useState(false);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(String(initialData.amount));
      setDueDate(initialData.dueDate);
      setCategory(initialData.category);
      setIsPaid(initialData.isPaid);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) return;
    onSubmit({
      name,
      amount: parseFloat(amount),
      dueDate,
      category,
      isPaid,
      paymentMode,
      upiId: paymentMode === 'Online' ? upiId : undefined
    });
  };

  const handleScanSuccess = useCallback((decodedText: string) => {
    try {
      let pa = '';
      let pn = '';
      let am = '';

      if (decodedText.startsWith('upi://pay')) {
        const url = new URL(decodedText);
        const params = new URLSearchParams(url.search);
        pa = params.get('pa') || '';
        pn = params.get('pn') || '';
        am = params.get('am') || '';
      } else if (decodedText.includes('@')) {
        pa = decodedText.trim();
      }

      if (pa) {
        setUpiId(pa);
        if (pn) setName(pn);
        if (am) {
          setAmount(am);
        } else if (!amount) {
          const userAmount = window.prompt("Enter amount to pay:");
          if (userAmount && !isNaN(parseFloat(userAmount))) {
            setAmount(userAmount);
          }
        }

        setPaymentMode('Online');
        setShowScanner(false);
      }
    } catch (e) {
      console.error("Invalid QR code", e);
    }
  }, [amount]);

  const handlePayUPI = () => {
    if (!amount || !upiId) {
      alert("Please ensure amount and UPI ID are set.");
      return;
    }
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name || 'Bill Payment')}&am=${amount}&cu=INR`;

    // Attempt to open UPI app using a hidden link to be more robust on some mobile browsers
    const link = document.createElement('a');
    link.href = upiUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    setTimeout(() => {
      if (window.confirm("Did you complete the UPI payment? Click OK to mark as paid.")) {
        setIsPaid(true);
      }
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {paymentMode === 'Online' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl font-bold text-sm border border-indigo-100 dark:border-indigo-500/20"
          >
            <SparklesIcon className="w-4 h-4" />
            Scan QR to Pay
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Payment Mode</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl">
            {(['Cash', 'Online'] as PaymentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${paymentMode === mode ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-text-secondary dark:text-gray-400'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {paymentMode === 'Online' && (
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Recipient UPI ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="example@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="flex-1 px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              />
              {upiId && amount && (
                <button
                  type="button"
                  onClick={handlePayUPI}
                  className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Bill Name</label>
          <input
            type="text"
            placeholder="Rent, Internet, etc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Amount ({CURRENCY_SYMBOLS[currency]})</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
        </div>

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

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
          <input
            type="checkbox"
            id="isPaid"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isPaid" className="text-sm font-bold text-text-primary dark:text-white cursor-pointer">Mark as Paid</label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
      >
        {initialData ? 'Update Bill' : 'Save Bill'}
      </button>
    </form>
  );
};

export default BillForm;
