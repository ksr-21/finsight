import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Transaction, Currency, TransactionType, PortfolioAsset } from '../types';

interface StressTestProps {
  transactions: Transaction[];
  currency: Currency;
  portfolio: PortfolioAsset[];
}

const FinancialStressTest: React.FC<StressTestProps> = ({ transactions, currency, portfolio }) => {
  const [rentHike, setRentHike] = useState(false);
  const [jobLoss, setJobLoss] = useState(false);
  const [emergencyExpense, setEmergencyExpense] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
    });

    const monthlyIncome = last30Days.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = last30Days.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const cashBalance = transactions.reduce((sum, t) => t.type === TransactionType.INCOME ? sum + t.amount : sum - t.amount, 0);
    const portfolioValue = portfolio.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
    const currentBalance = cashBalance + portfolioValue;

    // Apply Stressors
    let adjustedIncome = jobLoss ? 0 : monthlyIncome;
    let adjustedExpense = monthlyExpense;
    if (rentHike) adjustedExpense += 500; // Mock $500 rent hike
    
    let adjustedBalance = currentBalance;
    if (emergencyExpense) adjustedBalance -= 2000; // Mock $2000 emergency

    const burnRate = adjustedExpense;
    const runwayMonths = burnRate > 0 ? Math.max(0, adjustedBalance / burnRate) : (adjustedBalance > 0 ? 999 : 0);
    const runwayDays = Math.floor(runwayMonths * 30.44);

    return {
      runwayDays: runwayDays > 10000 ? '∞' : runwayDays,
      runwayMonths: runwayMonths.toFixed(1),
      burnRate,
      balance: adjustedBalance,
      income: adjustedIncome,
      isCritical: runwayMonths < 3
    };
  }, [transactions, rentHike, jobLoss, emergencyExpense]);

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 overflow-hidden relative group">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <span className="text-indigo-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-1 block">Stress Test Module</span>
            <h3 className="text-2xl font-bold text-white tracking-tight uppercase italic">Survival Runway</h3>
          </div>
          
          <div className="flex gap-2">
            <StressorToggle active={rentHike} onClick={() => setRentHike(!rentHike)} label="Rent Hike" />
            <StressorToggle active={jobLoss} onClick={() => setJobLoss(!jobLoss)} label="Job Loss" />
            <StressorToggle active={emergencyExpense} onClick={() => setEmergencyExpense(!emergencyExpense)} label="Emergency" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Display */}
          <div className="lg:col-span-7">
            <div className="relative flex items-center justify-center h-64">
              {/* Circular Progress (Hardware Style) */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff05" strokeWidth="2" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={stats.isCritical ? "#f43f5e" : "#6366f1"} 
                  strokeWidth="2" 
                  strokeDasharray="282.7"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - (Math.min(1, Number(stats.runwayMonths) / 12) * 282.7) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.div 
                  key={String(stats.runwayDays)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-7xl font-bold font-mono tracking-tighter ${stats.isCritical ? 'text-rose-500' : 'text-white'}`}
                >
                  {stats.runwayDays}
                </motion.div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mt-2">Days of Runway</div>
              </div>
            </div>
          </div>

          {/* Side Stats */}
          <div className="lg:col-span-5 space-y-6">
            <DataRow label="Monthly Burn" value={`${currency} ${stats.burnRate.toLocaleString()}`} color="rose" />
            <DataRow label="Current Liquidity" value={`${currency} ${stats.balance.toLocaleString()}`} color="indigo" />
            <DataRow label="Income Stream" value={stats.income > 0 ? "STABLE" : "OFFLINE"} color={stats.income > 0 ? "emerald" : "rose"} />
            
            <div className="pt-6 border-t border-white/5">
              <div className="text-[10px] font-mono text-gray-500 uppercase mb-4">Risk Assessment</div>
              <div className={`p-4 rounded-xl border ${stats.isCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                <p className="text-xs font-mono leading-relaxed">
                  {stats.isCritical 
                    ? "CRITICAL: Runway is below 90 days. Immediate liquidity injection or expense reduction required." 
                    : "OPTIMAL: Current reserves exceed 3-month safety threshold. Portfolio stability confirmed."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StressorToggle = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all duration-300 border ${
      active 
        ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
        : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
    }`}
  >
    {label}
  </button>
);

const DataRow = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const colorClasses: Record<string, string> = {
    rose: 'text-rose-400',
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400'
  };
  
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-2 group/row">
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest group-hover/row:text-gray-300 transition-colors">{label}</span>
      <span className={`text-lg font-bold font-mono tracking-tight ${colorClasses[color] || 'text-white'}`}>{value}</span>
    </div>
  );
};

export default FinancialStressTest;
