import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { Transaction, Currency } from '../types';
import { SparklesIcon, TrendingUpIcon, WalletIcon, CalendarIcon, CheckIcon, CalculatorIcon, RefreshIcon } from '../components/icons';
import FIRECalculator from '../components/calculators/FIRECalculator';
import CurrencyCalculator from '../components/calculators/CurrencyCalculator';
import CompoundInterestCalculator from '../components/calculators/CompoundInterestCalculator';
import LoanCalculator from '../components/calculators/LoanCalculator';

type Tab = 'projection' | 'fire' | 'currency' | 'compound' | 'loan';

interface WealthHorizonPageProps {
  transactions: Transaction[];
  currency: Currency;
}

const WealthHorizonPage: React.FC<WealthHorizonPageProps> = ({ transactions, currency }) => {
  const [activeTab, setActiveTab] = useState<Tab>('projection');
  const [years, setYears] = useState(10);
  const [monthlySavings, setMonthlySavings] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate current monthly surplus
  const currentMonthlySurplus = useMemo(() => {
    const now = new Date();
    const last30Days = transactions.filter(t => {
      const tDate = new Date(t.date);
      const diff = (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    });

    const income = last30Days.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expense = last30Days.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    
    return Math.max(0, income - expense);
  }, [transactions]);

  // Set initial savings to current surplus
  useEffect(() => {
    if (currentMonthlySurplus > 0) {
      setMonthlySavings(Math.round(currentMonthlySurplus));
    }
  }, [currentMonthlySurplus]);

  const projectionData = useMemo(() => {
    const data = [];
    let balance = transactions.reduce((sum, t) => t.type === 'Income' ? sum + t.amount : sum - t.amount, 0);
    const monthlyRate = annualReturn / 100 / 12;

    for (let i = 0; i <= years * 12; i++) {
      if (i % 12 === 0 || i === years * 12) {
        data.push({
          month: i,
          year: Math.floor(i / 12),
          balance: Math.round(balance),
        });
      }
      balance = (balance + monthlySavings) * (1 + monthlyRate);
    }
    return data;
  }, [years, monthlySavings, annualReturn, transactions]);

  const milestones = useMemo(() => {
    const targets = [10000, 50000, 100000, 500000, 1000000];
    const results = [];
    let balance = transactions.reduce((sum, t) => t.type === 'Income' ? sum + t.amount : sum - t.amount, 0);
    const monthlyRate = annualReturn / 100 / 12;
    
    let currentMonth = 0;
    for (const target of targets) {
      if (balance >= target) {
        results.push({ target, month: 0, achieved: true });
        continue;
      }
      
      let tempBalance = balance;
      let months = 0;
      while (tempBalance < target && months < 600) { // 50 year cap
        tempBalance = (tempBalance + monthlySavings) * (1 + monthlyRate);
        months++;
      }
      results.push({ 
        target, 
        month: months, 
        achieved: false,
        years: (months / 12).toFixed(1)
      });
    }
    return results;
  }, [monthlySavings, annualReturn, transactions]);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1000);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden rounded-3xl bg-background text-text-primary p-6 md:p-12">
      {/* Immersive Background (Recipe 7) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] opacity-50 dark:opacity-100" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[100px] opacity-50 dark:opacity-100" />
      </div>

      <div className="relative z-10 flex flex-col h-full space-y-12">
        {/* Navigation Tabs (Recipe 4) */}
        <div className="flex flex-wrap items-center gap-4 p-2 bg-card/50 border border-gray-200 dark:border-white/10 rounded-2xl w-fit">
          {[
            { id: 'projection', label: 'Projection', icon: TrendingUpIcon },
            { id: 'fire', label: 'FIRE Plan', icon: SparklesIcon },
            { id: 'currency', label: 'Currency', icon: RefreshIcon },
            { id: 'compound', label: 'Compound', icon: CalculatorIcon },
            { id: 'loan', label: 'Loan/EMI', icon: WalletIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projection' && (
            <motion.div 
              key="projection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* Left Column: Hardware Controls (Recipe 3) */}
              <div className="lg:col-span-4 flex flex-col justify-center space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] tracking-[0.4em] uppercase mb-4 block">Trajectory Engine v2.0</span>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.85] uppercase mb-6 text-text-primary">
                    Wealth<br />Horizon
                  </h1>
                  <div className="h-1 w-20 bg-indigo-500 mb-6" />
                </motion.div>

                <motion.div 
                  className="space-y-8 bg-card border border-gray-100 dark:border-white/5 p-8 rounded-2xl shadow-2xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Monthly Fuel</label>
                      <span className="text-indigo-400 font-mono text-lg">{currency} {monthlySavings}</span>
                    </div>
                    <input 
                      type="range" min="0" max="10000" step="100"
                      value={monthlySavings} onChange={(e) => setMonthlySavings(Number(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Yield Velocity</label>
                      <span className="text-emerald-400 font-mono text-lg">{annualReturn}%</span>
                    </div>
                    <input 
                      type="range" min="1" max="20" step="0.5"
                      value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Time Window</label>
                      <span className="text-text-primary font-mono text-lg">{years} Years</span>
                    </div>
                    <input 
                      type="range" min="1" max="40" step="1"
                      value={years} onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  <button 
                    onClick={runSimulation}
                    className="w-full py-4 bg-indigo-600 text-white font-mono text-xs uppercase tracking-[0.2em] rounded-lg hover:bg-indigo-500 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isSimulating ? "Recalculating..." : "Execute Simulation"}
                  </button>
                </motion.div>
              </div>

              {/* Right Column: Visualization & Milestones */}
              <div className="lg:col-span-8 flex flex-col justify-center space-y-12">
                <motion.div 
                  className="h-[350px] w-full relative"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
                      <XAxis dataKey="year" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid #88888822', borderRadius: '8px', fontFamily: 'monospace', color: 'var(--text-primary)' }}
                        itemStyle={{ color: '#6366f1' }}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Milestone Grid (Extraordinary Data Visualization) */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {milestones.map((m, i) => (
                    <motion.div 
                      key={m.target}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + (i * 0.1) }}
                      className={`p-4 rounded-xl border ${m.achieved ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-card border-gray-100 dark:bg-white/5 dark:border-white/10'} flex flex-col items-center text-center`}
                    >
                      <div className="text-[8px] font-mono uppercase tracking-widest text-gray-500 mb-2">Target</div>
                      <div className={`text-sm font-bold font-mono mb-2 ${m.achieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-primary'}`}>
                        {currency} {(m.target/1000).toFixed(0)}k
                      </div>
                      {m.achieved ? (
                        <div className="flex items-center gap-1 text-[8px] text-emerald-500 uppercase font-bold">
                          <CheckIcon className="h-3 w-3" /> Achieved
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-mono">
                          {m.years} <span className="text-[8px] uppercase">Years</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Hardware Status Bar (Recipe 3) */}
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-gray-100 dark:border-white/5 font-mono text-[10px] text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>SYSTEM ACTIVE</span>
                    </div>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
                    <span>DATA SOURCE: LOCAL_LEDGER</span>
                  </div>
                  <div className="hidden md:block">
                    TIMESTAMP: {new Date().toISOString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'fire' && (
            <motion.div 
              key="fire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FIRECalculator currency={currency} />
            </motion.div>
          )}

          {activeTab === 'currency' && (
            <motion.div 
              key="currency"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CurrencyCalculator />
            </motion.div>
          )}

          {activeTab === 'compound' && (
            <motion.div 
              key="compound"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CompoundInterestCalculator currency={currency} />
            </motion.div>
          )}

          {activeTab === 'loan' && (
            <motion.div 
              key="loan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LoanCalculator currency={currency} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WealthHorizonPage;
