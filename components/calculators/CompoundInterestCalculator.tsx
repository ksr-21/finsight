import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Currency, CURRENCY_SYMBOLS } from '../../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

interface CompoundInterestCalculatorProps {
  currency: Currency;
}

const CompoundInterestCalculator: React.FC<CompoundInterestCalculatorProps> = ({ currency }) => {
  const [principal, setPrincipal] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [years, setYears] = useState(10);

  const data = useMemo(() => {
    const results = [];
    let balance = principal;
    const monthlyRate = annualReturn / 100 / 12;

    for (let i = 0; i <= years * 12; i++) {
      if (i % 12 === 0) {
        results.push({
          year: i / 12,
          balance: Math.round(balance),
          contributions: principal + (monthlyContribution * i)
        });
      }
      balance = (balance + monthlyContribution) * (1 + monthlyRate);
    }
    return results;
  }, [principal, monthlyContribution, annualReturn, years]);

  const finalBalance = data[data.length - 1].balance;
  const totalContributions = data[data.length - 1].contributions;
  const interestEarned = finalBalance - totalContributions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4 space-y-8 bg-[#111] border border-white/5 p-8 rounded-2xl shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Initial Principal</label>
              <span className="text-white font-mono text-lg">{CURRENCY_SYMBOLS[currency]}{principal.toLocaleString()}</span>
            </div>
            <input 
              type="range" min="0" max="1000000" step="1000"
              value={principal} onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Monthly Contribution</label>
              <span className="text-indigo-400 font-mono text-lg">{CURRENCY_SYMBOLS[currency]}{monthlyContribution.toLocaleString()}</span>
            </div>
            <input 
              type="range" min="0" max="50000" step="100"
              value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Annual Return (%)</label>
              <span className="text-emerald-400 font-mono text-lg">{annualReturn}%</span>
            </div>
            <input 
              type="range" min="1" max="30" step="0.5"
              value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Time Period (Years)</label>
              <span className="text-white font-mono text-lg">{years} Years</span>
            </div>
            <input 
              type="range" min="1" max="50" step="1"
              value={years} onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Total Balance</div>
            <div className="text-3xl font-bold font-mono text-white">
              {CURRENCY_SYMBOLS[currency]}{finalBalance.toLocaleString()}
            </div>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Total Contributions</div>
            <div className="text-3xl font-bold font-mono text-indigo-400">
              {CURRENCY_SYMBOLS[currency]}{totalContributions.toLocaleString()}
            </div>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Interest Earned</div>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {CURRENCY_SYMBOLS[currency]}{interestEarned.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="year" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '8px', fontFamily: 'monospace' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fill="url(#colorBalance)" />
              <Area type="monotone" dataKey="contributions" stroke="#ffffff20" strokeWidth={1} fill="url(#colorContributions)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CompoundInterestCalculator;
