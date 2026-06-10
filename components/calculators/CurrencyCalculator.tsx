import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Currency, CURRENCY_SYMBOLS } from '../../types';
import { RefreshIcon } from '../icons';

const CurrencyCalculator: React.FC = () => {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<Currency>(Currency.INR);
  const [toCurrency, setToCurrency] = useState<Currency>(Currency.USD);
  const [exchangeRate, setExchangeRate] = useState<number>(0.012); // Mock rate
  const [loading, setLoading] = useState(false);

  // Mock exchange rates (relative to 1 unit of the currency)
  const mockRates: Record<Currency, number> = {
    [Currency.USD]: 1,
    [Currency.EUR]: 1.08,
    [Currency.GBP]: 1.27,
    [Currency.INR]: 0.012,
    [Currency.JPY]: 0.0066,
    [Currency.CAD]: 0.74,
    [Currency.AUD]: 0.65,
  };

  useEffect(() => {
    const rate = mockRates[fromCurrency] / mockRates[toCurrency];
    setExchangeRate(rate);
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const result = amount * exchangeRate;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-[#111] border border-white/5 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <RefreshIcon className="w-48 h-48" />
        </div>

        <div className="relative z-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block">Amount to Convert</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-600 font-mono">
                  {CURRENCY_SYMBOLS[fromCurrency]}
                </span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-[2rem] py-8 pl-16 pr-8 text-4xl font-bold font-mono text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block">Converted Result</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-600 font-mono">
                  {CURRENCY_SYMBOLS[toCurrency]}
                </span>
                <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] py-8 pl-16 pr-8 text-4xl font-bold font-mono text-indigo-400">
                  {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-black/40 border border-white/5 rounded-3xl">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <select 
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="flex-1 md:w-40 bg-gray-900 border border-white/10 rounded-xl p-4 font-mono text-sm text-white outline-none focus:border-indigo-500 appearance-none text-center"
              >
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <button 
                onClick={handleSwap}
                className="p-4 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all active:scale-90 shadow-lg shadow-indigo-500/20"
              >
                <RefreshIcon className="w-6 h-6 text-white" />
              </button>

              <select 
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="flex-1 md:w-40 bg-gray-900 border border-white/10 rounded-xl p-4 font-mono text-sm text-white outline-none focus:border-indigo-500 appearance-none text-center"
              >
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="text-right font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              Current Rate: <span className="text-emerald-400">1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}</span>
              <br />
              <span className="opacity-50">Last Updated: Just Now (Mock Data)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[Currency.USD, Currency.EUR, Currency.GBP].filter(c => c !== fromCurrency).map(c => (
          <div key={c} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{c} Equivalent</div>
            <div className="text-xl font-bold font-mono text-white">
              {CURRENCY_SYMBOLS[c]}{(amount * (mockRates[fromCurrency] / mockRates[c])).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyCalculator;
