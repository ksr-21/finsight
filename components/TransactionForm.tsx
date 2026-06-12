import React, { useEffect, useState } from 'react';
import { Currency, CURRENCY_SYMBOLS, Transaction, TransactionType, PaymentMode } from '../types';
import {
  CategoryPreferences,
  loadCategoryPreferences,
  saveCategoryPreferences,
} from '../services/categoryPreferences';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  CheckCircleIcon,
} from './icons';
import QRScanner from './QRScanner';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  currency: Currency;
  userId: string;
  initialData?: Transaction | null;
  initialShowScanner?: boolean;
}

const getToday = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().split('T')[0];
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  currency,
  userId,
  initialData,
  initialShowScanner,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getToday());
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryPreferences, setCategoryPreferences] = useState<CategoryPreferences>(() =>
    loadCategoryPreferences(userId),
  );
  const [category, setCategory] = useState('');
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splitWith, setSplitWith] = useState<string[]>(['']);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Online');
  const [showScanner, setShowScanner] = useState(initialShowScanner || false);
  const [upiId, setUpiId] = useState('');

  const categories = categoryPreferences[type];

  useEffect(() => {
    const preferences = loadCategoryPreferences(userId);
    setCategoryPreferences(preferences);

    if (initialData) {
      setAmount(String(initialData.amount));
      setDescription(initialData.description);
      setDate(initialData.date);
      setType(initialData.type);
      setCategory(initialData.category);
      setIsSplit(initialData.isSplit || false);
      setSplitCount(initialData.splitCount || 2);
      setSplitWith(initialData.splitWith || ['']);
      setPaymentMode(initialData.paymentMode || 'Online');
      setUpiId(initialData.upiId || '');
      return;
    }

    setAmount('');
    setDescription('');
    setDate(getToday());
    setType(TransactionType.EXPENSE);
    setCategory(preferences[TransactionType.EXPENSE][0]);
  }, [initialData, userId]);

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const updateCategories = (nextCategories: string[]) => {
    const nextPreferences = {
      ...categoryPreferences,
      [type]: nextCategories,
    };
    setCategoryPreferences(nextPreferences);
    saveCategoryPreferences(userId, nextPreferences);
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) return;

    const alreadyExists = categories.some(
      (existingCategory) => existingCategory.toLowerCase() === trimmedCategory.toLowerCase(),
    );
    if (alreadyExists) return;

    updateCategories([...categories, trimmedCategory]);
    setCategory(trimmedCategory);
    setNewCategory('');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    if (categories.length === 1) return;

    const removedIndex = categories.indexOf(categoryToRemove);
    const nextCategories = categories.filter(
      (existingCategory) => existingCategory !== categoryToRemove,
    );
    updateCategories(nextCategories);

    if (category === categoryToRemove) {
      setCategory(nextCategories[Math.min(removedIndex, nextCategories.length - 1)]);
    }
  };

  const handleMoveCategory = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextCategories = [...categories];
    [nextCategories[index], nextCategories[targetIndex]] = [
      nextCategories[targetIndex],
      nextCategories[index],
    ];
    updateCategories(nextCategories);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!category || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      description: description.trim() || category,
      amount: parsedAmount,
      type,
      category,
      date,
      isSplit,
      splitCount,
      splitWith: isSplit ? splitWith.filter(s => s.trim() !== '') : [],
      paymentMode,
      upiId: paymentMode === 'Online' ? upiId : undefined,
    });
  };

  const handleScanSuccess = (decodedText: string) => {
    // Standard UPI URL: upi://pay?pa=upiid@bank&pn=Name&am=100&cu=INR
    // Some codes might just be the UPI ID or a different format.
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
        // Simple UPI ID scan
        pa = decodedText.trim();
      }

      if (pa) {
        setUpiId(pa);
        if (pn) setDescription(pn);
        if (am) {
          setAmount(am);
        } else {
          // If no amount in QR, prompt user to enter it
          const userAmount = window.prompt("Enter amount to pay:");
          if (userAmount && !isNaN(parseFloat(userAmount))) {
            setAmount(userAmount);
          }
        }

        setPaymentMode('Online');
        setShowScanner(false);

        // If we have both UPI ID and amount, offer to pay immediately
        if (pa && (am || amount)) {
          // We can't automatically redirect as it might be jarring,
          // but we'll show the Pay Now button clearly.
        }
      }
    } catch (e) {
      console.error("Invalid QR code", e);
    }
  };

  const [isUPISuccess, setIsUPISuccess] = useState(false);

  const handlePayUPI = () => {
    const finalAmount = amount;
    if (!finalAmount || !upiId) {
      alert("Please ensure amount and UPI ID are set.");
      return;
    }

    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(description || 'Payment')}&am=${finalAmount}&cu=INR`;

    // Attempt to open UPI app
    window.location.href = upiUrl;

    // Show confirmation dialog after a short delay to allow app switch
    setTimeout(() => {
      if (window.confirm("Did you complete the UPI payment? Click OK to mark as paid and save.")) {
        setIsUPISuccess(true);
      }
    }, 1000);
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
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 rounded-2xl bg-gray-100 dark:bg-gray-900/60 p-1">
        {[TransactionType.EXPENSE, TransactionType.INCOME].map((transactionType) => {
          const isSelected = type === transactionType;
          return (
            <button
              key={transactionType}
              type="button"
              onClick={() => setType(transactionType)}
              className={`rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? transactionType === TransactionType.EXPENSE
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-text-secondary hover:bg-white dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {transactionType}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
            Payment Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-gray-100 dark:bg-gray-900/60 p-1 h-[58px]">
            {(['Cash', 'Online'] as PaymentMode[]).map((mode) => {
              const isSelected = paymentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`rounded-lg px-2 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400'
                      : 'text-text-secondary hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
            Amount ({CURRENCY_SYMBOLS[currency]})
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 font-mono text-base outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
            Category
          </label>
          <button
            type="button"
            onClick={() => setIsManagingCategories((isOpen) => !isOpen)}
            className="text-xs font-bold text-indigo-600 transition-opacity hover:opacity-75 dark:text-indigo-400"
          >
            {isManagingCategories ? 'Done' : 'Manage categories'}
          </button>
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-base outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
          required
        >
          {categories.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
            </option>
          ))}
        </select>
      </div>

      {isManagingCategories && (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddCategory();
                }
              }}
              placeholder="New category"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-xl bg-indigo-600 p-3 text-white transition-colors hover:bg-indigo-700"
              aria-label="Add category"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {categories.map((categoryOption, index) => (
              <div
                key={categoryOption}
                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary dark:text-white">
                  {categoryOption}
                </span>
                <button
                  type="button"
                  onClick={() => handleMoveCategory(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-25 dark:hover:bg-gray-700"
                  aria-label={`Move ${categoryOption} up`}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveCategory(index, 1)}
                  disabled={index === categories.length - 1}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-25 dark:hover:bg-gray-700"
                  aria-label={`Move ${categoryOption} down`}
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(categoryOption)}
                  disabled={categories.length === 1}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-25 dark:hover:bg-rose-900/20"
                  aria-label={`Remove ${categoryOption}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <button
          type="button"
          onClick={() => setShowMoreOptions((isOpen) => !isOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          aria-expanded={showMoreOptions}
        >
          <span>
            More options
            <span className="ml-2 text-xs font-normal text-text-secondary dark:text-gray-500">
              Split bill, Description & date
            </span>
          </span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`}
          />
        </button>

        {showMoreOptions && (
          <div className="space-y-4 border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
                Split this bill
              </label>
              <button
                type="button"
                onClick={() => setIsSplit(!isSplit)}
                className={`w-10 h-6 rounded-full relative transition-colors ${isSplit ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isSplit ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {isSplit && (
              <div className="space-y-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono uppercase text-gray-500 mb-1 block">Split between</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="2"
                        value={splitCount}
                        onChange={(e) => setSplitCount(parseInt(e.target.value))}
                        className="w-16 bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1 text-sm font-bold"
                      />
                      <span className="text-xs text-gray-400">people</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-mono uppercase text-gray-500 mb-1 block">Each pays</label>
                    <p className="text-sm font-bold text-indigo-600">
                      {CURRENCY_SYMBOLS[currency]}{(parseFloat(amount || '0') / (splitCount || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-gray-500 block">Split with (Emails/Names)</label>
                  {splitWith.map((sw, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={sw}
                        onChange={(e) => {
                          const next = [...splitWith];
                          next[index] = e.target.value;
                          setSplitWith(next);
                        }}
                        placeholder="Friend's email or name"
                        className="flex-1 bg-white dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-xs"
                      />
                      {index === splitWith.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setSplitWith([...splitWith, ''])}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      )}
                      {splitWith.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSplitWith(splitWith.filter((_, i) => i !== index))}
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
                Description
              </label>
              <input
                type="text"
                placeholder={category || 'Transaction description'}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              />
            </div>

            {paymentMode === 'Online' && (
              <div className="space-y-2">
                <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
                  Recipient UPI ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="example@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                    />
                    {isUPISuccess && (
                      <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="ml-1 text-xs font-mono uppercase tracking-widest text-text-secondary dark:text-gray-400">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                required
              />
            </div>
          </div>
        )}
      </div>

      {paymentMode === 'Online' && upiId && amount && !isUPISuccess && (
        <button
          type="button"
          onClick={handlePayUPI}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" />
          Pay Now
        </button>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98]"
      >
        {initialData ? 'Update Transaction' : 'Save Transaction'}
      </button>
    </form>
  );
};

export default TransactionForm;
