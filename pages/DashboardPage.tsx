import React from 'react';
import Dashboard from '../components/Dashboard';
import { Transaction, Currency, User } from '../types';

interface DashboardPageProps {
  transactions: Transaction[];
  currency: Currency;
  user: User;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ transactions, currency, user }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2">Dashboard</h1>
        <p className="text-text-secondary dark:text-gray-400 font-mono text-sm uppercase tracking-widest">Your financial overview</p>
      </div>
      <Dashboard transactions={transactions} currency={currency} user={user} />
    </div>
  );
};

export default DashboardPage;
