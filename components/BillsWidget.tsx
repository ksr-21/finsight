import React from 'react';
import { motion } from 'motion/react';
import { Bill, Currency, CURRENCY_SYMBOLS } from '../types';
import { CalendarIcon, CheckCircleIcon, AlertCircleIcon } from './icons';

interface BillsWidgetProps {
  bills: Bill[];
  currency: Currency;
}

const BillsWidget: React.FC<BillsWidgetProps> = ({ bills, currency }) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">Upcoming Bills</h3>
          <span className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Next 30 Days</span>
        </div>

        <div className="space-y-4">
          {bills.map((bill, index) => {
            const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
            
            return (
              <motion.div 
                key={bill.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-indigo-500/20 transition-all group/item"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110 ${bill.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 animate-pulse' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                    {bill.isPaid ? <CheckCircleIcon className="w-5 h-5" /> : <AlertCircleIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">{bill.name}</p>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-wider">
                      <CalendarIcon className="w-3 h-3" />
                      Due {new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-text-primary dark:text-white">
                    {currencySymbol}{bill.amount.toLocaleString()}
                  </p>
                  <p className={`text-[9px] font-mono uppercase tracking-widest font-bold ${bill.isPaid ? 'text-emerald-500' : isOverdue ? 'text-rose-500' : 'text-amber-500'}`}>
                    {bill.isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BillsWidget;
