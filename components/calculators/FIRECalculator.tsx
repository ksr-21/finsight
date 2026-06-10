import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Currency, CURRENCY_SYMBOLS } from '../../types';
import { TrendingUpIcon } from '../icons';

interface FIRECalculatorProps {
  currency: Currency;
}

const FIRECalculator: React.FC<FIRECalculatorProps> = ({ currency }) => {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(50);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);

  const fireResults = useMemo(() => {
    const realReturn = (1 + annualReturn / 100) / (1 + inflationRate / 100) - 1;
    const annualExpenses = monthlyExpenses * 12;
    // 4% rule: FIRE Number = Annual Expenses * 25
    const fireNumber = annualExpenses * 25;
    
    let balance = currentSavings;
    let years = 0;
    const maxYears = 100;

    while (balance < fireNumber && years < maxYears) {
      // Assuming monthly contributions equal to current monthly expenses for simplicity in this basic model
      // or we can add a "monthly contribution" field. Let's add it.
      balance = balance * (1 + realReturn) + (monthlyExpenses * 12); 
      years++;
    }

    return {
      fireNumber: Math.round(fireNumber),
      yearsToFire: years,
      estimatedAge: currentAge + years,
      isAchievable: years < maxYears
    };
  }, [currentAge, monthlyExpenses, currentSavings, annualReturn, inflationRate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8 bg-[#111] border border-white/5 p-8 rounded-2xl shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Current Age</label>
              <span className="text-white font-mono text-lg">{currentAge}</span>
            </div>
            <input 
              type="range" min="18" max="80" step="1"
              value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Monthly Expenses</label>
              <span className="text-indigo-400 font-mono text-lg">{CURRENCY_SYMBOLS[currency]}{monthlyExpenses}</span>
            </div>
            <input 
              type="range" min="500" max="20000" step="100"
              value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Current Savings</label>
              <span className="text-emerald-400 font-mono text-lg">{CURRENCY_SYMBOLS[currency]}{currentSavings.toLocaleString()}</span>
            </div>
            <input 
              type="range" min="0" max="1000000" step="5000"
              value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block">Expected Return (%)</label>
              <input 
                type="number" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-sm text-indigo-400 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block">Inflation (%)</label>
              <input 
                type="number" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-sm text-rose-400 outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center space-y-8">
        <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUpIcon className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-[0.3em] mb-4">FIRE Number</h3>
            <div className="text-5xl font-bold tracking-tighter mb-2">
              {CURRENCY_SYMBOLS[currency]}{fireResults.fireNumber.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              This is the amount you need invested to live off a 4% annual withdrawal rate indefinitely.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Years to FIRE</div>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {fireResults.yearsToFire} <span className="text-xs text-gray-500 uppercase">Years</span>
            </div>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Retirement Age</div>
            <div className="text-3xl font-bold font-mono text-white">
              {fireResults.estimatedAge}
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111] rounded-xl border border-white/5 font-mono text-[10px] text-gray-500 leading-relaxed">
          <span className="text-indigo-400">NOTE:</span> This simulation assumes you contribute your current monthly expenses back into savings each month until retirement. Real-world results may vary based on market volatility and tax implications.
        </div>
      </div>
    </div>
  );
};

export default FIRECalculator;
