import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SunIcon, MoonIcon, ChartPieIcon, PlusIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, BellIcon, WalletIcon } from './icons';
import { Currency, User, Transaction, TransactionType, CURRENCY_SYMBOLS } from '../types';
import { useMemo } from 'react';

interface HeaderProps {
  user: User;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onAddTransaction: () => void;
  onOpenProfile: () => void;
  transactions: Transaction[];
}

const Header: React.FC<HeaderProps> = ({ user, isDarkMode, toggleDarkMode, currency, onCurrencyChange, onAddTransaction, onOpenProfile, transactions }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalBalance = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === TransactionType.INCOME) {
          acc += t.amount;
        } else {
          acc -= t.amount;
        }
        return acc;
      },
      (user.initialCashBalance || 0) + (user.initialOnlineBalance || 0)
    );
  }, [transactions, user]);

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const navItems = [
    { label: 'Transactions', path: '/transactions' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Budgets', path: '/budgets' },
    { label: 'Insights', path: '/insights' },
    { label: 'Horizon', path: '/horizon' },
    { label: 'News', path: '/news' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'JD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-8">
            <NavLink to="/" className="flex items-center group shrink-0">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <img src="/assets/logo.png" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-text-primary dark:text-white tracking-tight hidden lg:block">
                FinSight<span className="text-indigo-600">.</span>
              </h1>
            </NavLink>
            
            <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto pb-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'text-text-secondary dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Balance Display for Mobile */}
            <div className="lg:hidden flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 mr-1">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <WalletIcon className="w-2.5 h-2.5 text-indigo-500" />
                  <span className="text-xs font-bold text-text-primary dark:text-white">{currencySymbol}{Math.round(totalBalance).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Currency Selector - Hardware Style (Recipe 3) */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border border-gray-200 dark:border-gray-700 shadow-inner">
              <button 
                onClick={() => onCurrencyChange('USD')}
                className={`relative px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 ${
                  currency === 'USD' 
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                USD
                {currency === 'USD' && (
                  <motion.div layoutId="active-currency" className="absolute inset-0 bg-indigo-500/5 rounded-lg sm:rounded-xl border border-indigo-500/20" />
                )}
              </button>
              <button 
                onClick={() => onCurrencyChange('INR')}
                className={`relative px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 ${
                  currency === 'INR' 
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                INR
                {currency === 'INR' && (
                  <motion.div layoutId="active-currency" className="absolute inset-0 bg-indigo-500/5 rounded-lg sm:rounded-xl border border-indigo-500/20" />
                )}
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

            <button
              onClick={toggleDarkMode}
              className="hidden md:block p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-100 dark:border-gray-700 transition-all hover:scale-105 active:scale-95"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />

            <NavLink
              to="/notifications"
              className="hidden md:block p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-100 dark:border-gray-700 transition-all hover:scale-105 active:scale-95 relative"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-gray-800" />
            </NavLink>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />

            <button
              onClick={onAddTransaction}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-xs"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <button
              onClick={onAddTransaction}
              className="lg:hidden p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
              aria-label="Add transaction"
            >
              <PlusIcon className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />

            {/* User Profile - Recipe 8/12 */}
            <div className="relative hidden md:block">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg sm:rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
              >
                <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                  {getInitials(user.displayName)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[9px] sm:text-[10px] font-bold text-text-primary dark:text-white leading-none">{user.displayName || 'John Doe'}</p>
                </div>
              </button>

              </div>

            {/* Mobile Menu Button */}
            <NavLink
              to="/notifications"
              className="md:hidden p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 border border-gray-100 dark:border-gray-700 relative"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </NavLink>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-100 dark:border-gray-700 transition-all lg:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <XMarkIcon className="h-4 w-4" /> : <Bars3Icon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          >
            <div className="px-3 py-4 space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Currency</span>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 shadow-inner">
                    <button
                      onClick={() => onCurrencyChange('USD')}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-[0.15em] transition-all ${
                        currency === 'USD'
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg'
                          : 'text-gray-400'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => onCurrencyChange('INR')}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-[0.15em] transition-all ${
                        currency === 'INR'
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg'
                          : 'text-gray-400'
                      }`}
                    >
                      INR
                    </button>
                  </div>
                </div>

              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

              <div className="flex flex-col gap-2">
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-indigo-500/20 flex-shrink-0">
                      {getInitials(user.displayName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary dark:text-white truncate">{user.displayName}</p>
                      <p className="text-[9px] text-text-secondary dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
