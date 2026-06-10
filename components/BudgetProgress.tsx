import React from 'react';
import { motion } from 'motion/react';
import { Transaction, Budget, Currency, CURRENCY_SYMBOLS, Category, TransactionType } from '../types';

interface BudgetProgressProps {
  transactions: Transaction[];
  budgets: Budget[];
  currency: Currency;
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ transactions, budgets, currency }) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const getSpentAmount = (category: Category) => {
    return transactions
      .filter(t => t.category === category && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">Budget Health</h3>
          <span className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Monthly Status</span>
        </div>

        <div className="space-y-8">
          {budgets.map((budget, index) => {
            const spent = getSpentAmount(budget.category);
            const percentage = Math.min(100, (spent / budget.amount) * 100);
            const isOver = spent > budget.amount;

            return (
              <motion.div 
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-text-primary dark:text-white tracking-tight">{budget.category}</p>
                      {isOver && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                    </div>
                    <p className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest mt-0.5">
                      {currencySymbol}{spent.toLocaleString()} / {currencySymbol}{budget.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className={`text-xs font-mono font-bold ${isOver ? 'text-rose-500' : 'text-indigo-500'}`}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
                
                <div className="h-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-full overflow-hidden relative border border-gray-200/50 dark:border-gray-700/50">
                  <motion.div 
                    className={`h-full rounded-full relative ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    {!isOver && (
                      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-r from-transparent to-white/20" />
                    )}
                  </motion.div>
                </div>
                
                {isOver && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-rose-500" />
                    <p className="text-[9px] font-mono text-rose-500 uppercase tracking-widest font-bold">
                      Critical: Budget Exceeded
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetProgress;
