import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Category, TransactionType, Currency, CURRENCY_SYMBOLS } from '../types';
import { PencilIcon, TrashIcon, ArrowDownTrayIcon, ChevronDownIcon, SparklesIcon } from './icons';
import { formatAmount } from '../services/utils';

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  currency: Currency;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  currency,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
        const categoryMatch = filter === 'All' || t.category === filter || t.type === filter;
        const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch;
    });
    
    // Sort by date (newest first) or amount (highest first)
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === 'amount') {
      filtered.sort((a, b) => b.amount - a.amount);
    }
    
    return filtered;
  }, [transactions, filter, searchTerm, sortBy]);

  const allCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats);
  }, [transactions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setIsDownloadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [downloadDropdownRef]);

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const handleDownloadCSV = (period: '30d' | '90d' | '1y' | '3y' | '5y' | 'all') => {
    setIsDownloadDropdownOpen(false);

    const today = new Date();
    let startDate = new Date(0); // Epoch for 'all'

    if (period !== 'all') {
        const tempDate = new Date();
        tempDate.setHours(0, 0, 0, 0); // Start from the beginning of the day

        switch (period) {
            case '30d':
                tempDate.setDate(today.getDate() - 30);
                break;
            case '90d':
                tempDate.setDate(today.getDate() - 90);
                break;
            case '1y':
                tempDate.setFullYear(today.getFullYear() - 1);
                break;
            case '3y':
                tempDate.setFullYear(today.getFullYear() - 3);
                break;
            case '5y':
                tempDate.setFullYear(today.getFullYear() - 5);
                break;
        }
        startDate = tempDate;
    }

    const transactionsToDownload = transactions.filter(t => new Date(t.date) >= startDate);

    if (transactionsToDownload.length === 0) {
      alert(`No transactions to download for the selected period.`);
      return;
    }

    const headers = ["ID", "Description", "Amount", "Type", "Category", "Date"];
    const csvRows = [headers.join(',')];

    for (const t of transactionsToDownload) {
      const values = [
        t.id,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        t.category,
        t.date
      ];
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `finsight-transactions-${period}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  const renderDropdownItem = (period: '30d' | '90d' | '1y' | '3y' | '5y' | 'all', label: string) => (
      <li className="text-sm text-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md">
        <button
          onClick={() => handleDownloadCSV(period)}
          className="w-full text-left px-4 py-2"
        >
          {label}
        </button>
      </li>
  );

  return (
    <div className="bg-card dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col gap-4 mb-4">
        <h3 className="text-lg font-semibold text-text-primary dark:text-white">Recent Transactions</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
          
          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Filter Toggles */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === 'All'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter(TransactionType.INCOME)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === TransactionType.INCOME
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilter(TransactionType.EXPENSE)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === TransactionType.EXPENSE
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Expense
              </button>
            </div>
            
            {/* Sort and Download Controls */}
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              {/* Sort Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-secondary dark:text-gray-400">Sort:</span>
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'date'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Date
                </button>
                <button
                  onClick={() => setSortBy('amount')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'amount'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Amount
                </button>
              </div>
              
              {/* Download Button */}
              <div className="relative ml-auto" ref={downloadDropdownRef}>
                <button
                  onClick={() => setIsDownloadDropdownOpen(prev => !prev)}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-secondary text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-bold"
                  aria-haspopup="true"
                  aria-expanded={isDownloadDropdownOpen}
                  aria-label="Open download options"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
                {isDownloadDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-gray-700 rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5 p-1">
                    <ul className="space-y-1">
                      {renderDropdownItem('30d', 'Last 30 Days')}
                      {renderDropdownItem('90d', 'Last 90 Days')}
                      {renderDropdownItem('1y', 'Last 1 Year')}
                      {renderDropdownItem('3y', 'Last 3 Years')}
                      {renderDropdownItem('5y', 'Last 5 Years')}
                      <li className="border-t border-gray-200 dark:border-gray-600 my-1"></li>
                      {renderDropdownItem('all', 'All Time')}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="py-2 px-4 font-semibold text-text-secondary dark:text-gray-400">Description</th>
              <th className="py-2 px-4 font-semibold text-text-secondary dark:text-gray-400">Category</th>
              <th className="py-2 px-4 font-semibold text-text-secondary dark:text-gray-400">Date</th>
              <th className="py-2 px-4 font-semibold text-text-secondary dark:text-gray-400 text-right">Amount</th>
              <th className="py-2 px-4 font-semibold text-text-secondary dark:text-gray-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4 text-text-primary dark:text-white">
                  <div className="flex items-center gap-2">
                    {t.description}
                    {t.isSplit && (
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[8px] font-mono font-bold uppercase tracking-widest border border-indigo-500/20">
                        Split {t.splitCount}x
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-text-secondary dark:text-gray-300">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">{t.category}</span>
                </td>
                <td className="py-3 px-4 text-text-secondary dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                <td className={`py-3 px-4 font-semibold text-right ${t.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.type === 'Income' ? '+' : '-'}{currencySymbol}{formatAmount(t.amount)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {!t.isSplit && (
                      <button
                        onClick={() => {
                          const splitT = { ...t, isSplit: true, splitCount: 2, splitWith: [''] };
                          onEditTransaction(splitT);
                        }}
                        className="text-gray-500 hover:text-indigo-600"
                        title="Split transaction"
                      >
                        <SparklesIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => onEditTransaction(t)} className="text-gray-500 hover:text-primary dark:hover:text-primary-dark">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDeleteTransaction(t.id)} className="text-gray-500 hover:text-red-500">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-text-secondary dark:text-gray-400">
                No transactions found. Add one to get started!
            </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;