import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Currency, CURRENCY_SYMBOLS } from '../../types';

interface LoanCalculatorProps {
  currency: Currency;
}

const LoanCalculator: React.FC<LoanCalculatorProps> = ({ currency }) => {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const loanResults = useMemo(() => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenure * 12;

    // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      interestPercentage: (totalInterest / totalPayment) * 100
    };
  }, [loanAmount, interestRate, tenure]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8 bg-[#111] border border-white/5 p-8 rounded-2xl shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Loan Amount</label>
              <span className="text-white font-mono text-lg">{CURRENCY_SYMBOLS[currency]}{loanAmount.toLocaleString()}</span>
            </div>
            <input 
              type="range" min="10000" max="10000000" step="10000"
              value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Interest Rate (%)</label>
              <span className="text-indigo-400 font-mono text-lg">{interestRate}%</span>
            </div>
            <input 
              type="range" min="1" max="25" step="0.1"
              value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Tenure (Years)</label>
              <span className="text-emerald-400 font-mono text-lg">{tenure} Years</span>
            </div>
            <input 
              type="range" min="1" max="40" step="1"
              value={tenure} onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center space-y-8">
        <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-[0.3em] mb-4">Monthly EMI</h3>
            <div className="text-5xl font-bold tracking-tighter mb-2">
              {CURRENCY_SYMBOLS[currency]}{loanResults.emi.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Your estimated monthly installment for this loan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Total Interest</div>
            <div className="text-2xl font-bold font-mono text-rose-400">
              {CURRENCY_SYMBOLS[currency]}{loanResults.totalInterest.toLocaleString()}
            </div>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Total Payment</div>
            <div className="text-2xl font-bold font-mono text-white">
              {CURRENCY_SYMBOLS[currency]}{loanResults.totalPayment.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-gray-500">
            <span>Interest vs Principal</span>
            <span>{loanResults.interestPercentage.toFixed(1)}% Interest</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-indigo-500" 
              style={{ width: `${100 - loanResults.interestPercentage}%` }} 
            />
            <div 
              className="h-full bg-rose-500" 
              style={{ width: `${loanResults.interestPercentage}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;
