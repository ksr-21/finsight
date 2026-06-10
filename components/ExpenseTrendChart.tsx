
import React, { useMemo } from 'react';
import { Transaction, Currency, CURRENCY_SYMBOLS } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpenseTrendChartProps {
  transactions: Transaction[];
  currency: Currency;
}

const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({ transactions, currency }) => {
  const data = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const filteredTransactions = transactions.filter(t => new Date(t.date) >= last30Days);

    const dailyTotals = filteredTransactions.reduce((acc, t) => {
      const date = t.date;
      acc[date] = (acc[date] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);
  
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-text-secondary dark:text-gray-400">No expense data for the last 30 days.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.3)" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280' }} />
                <YAxis tickFormatter={(value) => `${currencySymbol}${value}`} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                    cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}
                    contentStyle={{
                        background: '#1F2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#F9FAFB'
                    }} 
                    formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#4F46E5" name="Expenses" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default ExpenseTrendChart;
