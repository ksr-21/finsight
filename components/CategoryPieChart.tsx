

import React, { useMemo } from 'react';
import { Transaction, Currency, CURRENCY_SYMBOLS } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CategoryPieChartProps {
  transactions: Transaction[];
  currency: Currency;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions, currency }) => {
  const data = useMemo(() => {
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      // FIX: Explicitly cast values to Number to resolve TypeScript error in arithmetic operation.
      .sort((a, b) => Number(b.value) - Number(a.value));
  }, [transactions]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-text-secondary dark:text-gray-400">No expense data available.</div>;
  }
  
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">Category Mix</h3>
        <span className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest">Expense Share</span>
      </div>
      
      <div className="h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Total</span>
          <span className="text-lg font-bold text-text-primary dark:text-white">
            {currencySymbol}{data.reduce((sum, d) => sum + Number(d.value), 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {data.slice(0, 4).map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart;
