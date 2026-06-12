import React, { useState, useEffect, useCallback } from 'react';
import { Bill, Category, Currency, CURRENCY_SYMBOLS, PaymentMode } from '../types';
import { SparklesIcon } from './icons';
import QRScanner from './QRScanner';
import { motion, AnimatePresence } from 'motion/react';

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
  const [upiParams, setUpiParams] = useState<Record<string, string>>({});
  const [showAmountPrompt, setShowAmountPrompt] = useState(false);
  const [tempAmount, setTempAmount] = useState('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);

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
      const newUpiParams: Record<string, string> = {};

      if (decodedText.startsWith('upi://pay')) {
        const url = new URL(decodedText);
        const params = new URLSearchParams(url.search);

        params.forEach((value, key) => {
          newUpiParams[key] = value;
        });

        pa = params.get('pa') || '';
        pn = params.get('pn') || '';
        am = params.get('am') || '';
      } else if (decodedText.includes('@')) {
        pa = decodedText.trim();
      }

      if (pa) {
        setUpiId(pa);
        setUpiParams(newUpiParams);
        if (pn) setName(pn);
        if (am) {
          setAmount(am);
        } else {
          setShowAmountPrompt(true);
        }

        setPaymentMode('Online');
        setShowScanner(false);
      }
    } catch (e) {
      console.error("Invalid QR code", e);
    }
  }, []);

  const handleReturnFromPayment = useCallback(() => {
    if (!isWaitingForPayment) return;
    setIsWaitingForPayment(false);

    setTimeout(() => {
      if (window.confirm("Did you complete the UPI payment? Click OK to mark as paid.")) {
        setIsPaid(true);
        if (name && amount && dueDate) {
          onSubmit({
            name,
            amount: parseFloat(amount),
            dueDate,
            category,
            isPaid: true,
            paymentMode: 'Online',
            upiId: upiId
          });
        }
      }
    }, 500);
  }, [isWaitingForPayment, name, amount, dueDate, category, upiId, onSubmit]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWaitingForPayment) {
        handleReturnFromPayment();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isWaitingForPayment, handleReturnFromPayment]);

  const handlePayUPI = () => {
    if (!amount || !upiId) {
      alert("Please ensure amount and UPI ID are set.");
      return;
    }

    const amountInINR = parseFloat(amount);
    const formattedAmount = amountInINR.toFixed(2);

    const params = new URLSearchParams();
    Object.entries(upiParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });

    params.set('pa', upiId);
    params.set('am', formattedAmount);
    params.set('cu', 'INR');

    if (!params.has('tr')) {
      params.set('tr', 'TR' + Date.now() + Math.floor(Math.random() * 1000));
    }

    if (name && !params.has('pn')) {
      params.set('pn', name);
    }

    const upiUrl = `upi://pay?${params.toString()}`;

    setIsWaitingForPayment(true);
    window.location.href = upiUrl;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Amount Prompt Modal */}
      <AnimatePresence>
        {showAmountPrompt && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-4 text-center">Enter Amount</h3>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-indigo-600">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={tempAmount}
                  onChange={(e) => setTempAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAmountPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempAmount && !isNaN(parseFloat(tempAmount))) {
                      setAmount(tempAmount);
                      setShowAmountPrompt(false);
                      setTempAmount('');
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
