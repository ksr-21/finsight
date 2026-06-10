import React from 'react';
import { motion } from 'motion/react';
import { Transaction, Currency, CURRENCY_SYMBOLS, TransactionType } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: Currency;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, currency }) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const recent = transactions.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">Recent Activity</h3>
        <span className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Latest 5</span>
      </div>

      <div className="space-y-4">
        {recent.length > 0 ? (
          recent.map((t, index) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-indigo-500/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                  {t.type === TransactionType.INCOME ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.description}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">{t.category}</p>
                    {t.isSplit && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[8px] font-mono font-bold uppercase tracking-widest border border-indigo-500/20">
                        Split {t.splitCount}x
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold font-mono ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                </p>
                <p className="text-[9px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-text-secondary dark:text-gray-500 font-mono uppercase tracking-widest">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
