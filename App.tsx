import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Transaction, Currency, User, CURRENCY_SYMBOLS } from './types';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import TransactionForm from './components/TransactionForm';
import { api } from './services/api';
import { RefreshIcon, PlusIcon, AlertCircleIcon } from './components/icons';
import { motion, AnimatePresence } from 'motion/react';

// Import Pages
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import WealthHorizonPage from './pages/WealthHorizonPage';
import BudgetsGoalsPage from './pages/BudgetsGoalsPage';
import NewsPage from './pages/NewsPage';
import InsightsPage from './pages/InsightsPage';
import NotificationsPage from './pages/NotificationsPage';
import AiChatbot from './components/AiChatbot';
import ScrollToTop from './components/ScrollToTop';
import { currencyService } from './services/currencyService';

interface AppProps {
  user: User;
  onLogout: () => void;
}

const App: React.FC<AppProps> = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialFormState, setInitialFormState] = useState<{ showScanner: boolean } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const balance = transactions.reduce((acc, t) => acc + (t.type === 'Income' ? t.amount : -t.amount), 0);

  const rate = exchangeRates[currency] || 1;

  const convertedUser = useMemo(() => ({
    ...user,
    initialCashBalance: (user.initialCashBalance || 0) * rate,
    initialOnlineBalance: (user.initialOnlineBalance || 0) * rate
  }), [user, rate]);

  const convertedTransactions = transactions.map(t => {
    return {
      ...t,
      amount: t.amount * rate
    };
  });

  const loadUserData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setSyncError(null);

      const trans = await api.getTransactions(user.uid);

      // Load rates
      const rateData = await currencyService.getRates(Currency.USD);
      if (rateData) {
        setExchangeRates(rateData.rates);
      }

      // Load preferences from local storage directly
      const prefsJSON = localStorage.getItem(`finsight_preferences_${user.uid}`);
      if (prefsJSON) {
        try {
          const prefs = JSON.parse(prefsJSON);
          setIsDarkMode(!!prefs.isDarkMode);
          if (prefs.currency) setCurrency(prefs.currency);
        } catch (prefError) {
          console.warn("Failed to parse preferences from localStorage", prefError);
        }
      }

      if (Array.isArray(trans)) {
        setTransactions(trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

    } catch (e) {
      console.error("Failed to load user data", e);
      setSyncError("Live sync unavailable. Using offline data.");
    } finally {
      setIsLoadingData(false);
    }
  }, [user.uid]);

  // Effect to load all user data on initial mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (!isLoadingData && user) {
        localStorage.setItem(`finsight_preferences_${user.uid}`, JSON.stringify({ isDarkMode, currency }));
    }
  }, [isDarkMode, currency, user, isLoadingData]);


  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    // Convert amount back to USD before saving
    const baseAmount = currencyService.convertToBase(transaction.amount, currency, exchangeRates);
    await api.addTransaction(user.uid, { ...transaction, amount: baseAmount });
    await loadUserData();
    setIsFormModalOpen(false);
  };

  const handleEditTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      // Convert amount back to USD before saving
      const baseAmount = currencyService.convertToBase(transactionData.amount, currency, exchangeRates);
      await api.updateTransaction(user.uid, editingTransaction.id, { ...transactionData, amount: baseAmount });
      await loadUserData();
      setEditingTransaction(null);
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(user.uid, id);
    await loadUserData();
  };

  const openAddModal = (options?: { showScanner: boolean }) => {
    setEditingTransaction(null);
    setInitialFormState(options || null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setInitialFormState(null);
    setIsFormModalOpen(true);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    setCurrency(newCurrency);
    const rateData = await currencyService.getRates(newCurrency);
    if (rateData) {
      setExchangeRates(rateData.rates);
    }
  };
  
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <RefreshIcon className="animate-spin h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-text-primary dark:text-white">Loading your data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 font-sans">
      <AnimatePresence>
        {syncError && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 backdrop-blur-md"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-bold tracking-tight">{syncError}</span>
            <button
              onClick={() => setSyncError(null)}
              className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <PlusIcon className="w-4 h-4 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />
      <Header 
        user={convertedUser}
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onAddTransaction={openAddModal}
        onOpenProfile={() => setIsProfileOpen(true)}
        transactions={convertedTransactions}
      />

      <main className="max-w-7xl mx-auto pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<Navigate to="/transactions" replace />} />
          <Route path="/dashboard" element={<DashboardPage transactions={convertedTransactions} currency={currency} user={convertedUser} onRefreshData={loadUserData} />} />
          <Route path="/transactions" element={<TransactionsPage currency={currency} user={convertedUser} transactions={convertedTransactions} onRefresh={loadUserData} onAddTransaction={handleAddTransaction} />} />
          <Route path="/budgets" element={<BudgetsGoalsPage currency={currency} transactions={convertedTransactions} user={convertedUser} onRefreshData={loadUserData} />} />
          <Route path="/horizon" element={<WealthHorizonPage transactions={convertedTransactions} currency={currency} />} />
          <Route path="/insights" element={<InsightsPage transactions={convertedTransactions} currency={currency} />} />
          <Route path="/notifications" element={<NotificationsPage user={user} currency={currency} />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <AiChatbot transactions={transactions} currency={currency} balance={balance} />

      <MobileNav onOpenQRScanner={() => openAddModal({ showScanner: true })} />

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/20">
                    {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'JD'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-white truncate">{user.displayName || 'John Doe'}</h3>
                    <p className="text-sm text-text-secondary dark:text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-sm text-text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors font-bold group"
                  >
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <motion.div
                        animate={{ x: isDarkMode ? 18 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full text-left px-6 py-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors font-bold"
                  >
                    Sign Out
                  </button>

                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-6 py-4 text-sm text-text-secondary dark:text-gray-400 font-bold hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircleIcon className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Sign Out?</h3>
                <p className="text-text-secondary dark:text-gray-400 mb-8">
                  Are you sure you want to sign out of your account? You'll need to sign back in to access your data.
                </p>
                <div className="flex w-full gap-4">
                  <button
                    onClick={() => setIsLogoutConfirmOpen(false)}
                    className="flex-1 px-6 py-4 rounded-xl font-bold text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-gray-100 dark:border-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsLogoutConfirmOpen(false);
                      onLogout();
                    }}
                    className="flex-1 px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Transaction Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 pb-10 shadow-2xl dark:bg-gray-800 md:rounded-[2.5rem] md:p-8 md:pb-12"
            >
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-text-primary dark:text-white">
                  {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <PlusIcon className="w-6 h-6 rotate-45 text-gray-400" />
                </button>
              </div>
              <TransactionForm
                onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
                currency={currency}
                userId={user.uid}
                initialData={editingTransaction}
                initialShowScanner={initialFormState?.showScanner}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
