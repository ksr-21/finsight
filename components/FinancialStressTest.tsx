import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Currency, TransactionType, PortfolioAsset } from '../types';
import { EditIcon, CloseIcon } from './icons';

interface StressTestProps {
  transactions: Transaction[];
  currency: Currency;
  portfolio: PortfolioAsset[];
}

const FinancialStressTest: React.FC<StressTestProps> = ({ transactions, currency, portfolio }) => {
  const [rentHike, setRentHike] = useState(false);
  const [jobLoss, setJobLoss] = useState(false);
  const [emergencyExpense, setEmergencyExpense] = useState(false);

  // Configurable Stressor Values
  const [rentHikeAmount, setRentHikeAmount] = useState(500);
  const [emergencyExpenseAmount, setEmergencyExpenseAmount] = useState(2000);
  const [safetyThresholdMonths, setSafetyThresholdMonths] = useState(3);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('finsight_stress_test_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.rentHikeAmount) setRentHikeAmount(config.rentHikeAmount);
        if (config.emergencyExpenseAmount) setEmergencyExpenseAmount(config.emergencyExpenseAmount);
        if (config.safetyThresholdMonths) setSafetyThresholdMonths(config.safetyThresholdMonths);
      } catch (e) {
        console.error("Failed to parse stress test config", e);
      }
    }
  }, []);

  const saveConfig = (newRent: number, newEmergency: number, newThreshold: number) => {
    const config = {
      rentHikeAmount: newRent,
      emergencyExpenseAmount: newEmergency,
      safetyThresholdMonths: newThreshold
    };
    localStorage.setItem('finsight_stress_test_config', JSON.stringify(config));
    setRentHikeAmount(newRent);
    setEmergencyExpenseAmount(newEmergency);
    setSafetyThresholdMonths(newThreshold);
    setIsConfigModalOpen(false);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
    });

    // Note: transactions and portfolio are already converted to the active currency in props
    const monthlyIncome = last30Days.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = last30Days.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const cashBalance = transactions.reduce((sum, t) => t.type === TransactionType.INCOME ? sum + t.amount : sum - t.amount, 0);
    const portfolioValue = portfolio.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
    const currentBalance = cashBalance + portfolioValue;

    // Apply Stressors
    let adjustedIncome = jobLoss ? 0 : monthlyIncome;
    let adjustedExpense = monthlyExpense;
    if (rentHike) adjustedExpense += rentHikeAmount;
    
    let adjustedBalance = currentBalance;
    if (emergencyExpense) adjustedBalance -= emergencyExpenseAmount;

    const burnRate = adjustedExpense;
    const runwayMonths = burnRate > 0 ? Math.max(0, adjustedBalance / burnRate) : (adjustedBalance > 0 ? 999 : 0);
    const runwayDays = Math.floor(runwayMonths * 30.44);

    return {
      runwayDays: runwayDays > 10000 ? '∞' : runwayDays,
      runwayMonths: runwayMonths.toFixed(1),
      burnRate,
      balance: adjustedBalance,
      income: adjustedIncome,
      isCritical: runwayMonths < safetyThresholdMonths
    };
  }, [transactions, rentHike, jobLoss, emergencyExpense, rentHikeAmount, emergencyExpenseAmount, safetyThresholdMonths, portfolio]);

  return (
    <div className="bg-card border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 overflow-hidden relative group">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.03] opacity-[0.05]"
           style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-indigo-600 dark:text-indigo-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-1 block">Stress Test Module</span>
              <h3 className="text-2xl font-bold text-text-primary tracking-tight uppercase italic">Survival Runway</h3>
            </div>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-text-secondary hover:text-indigo-500 transition-colors"
              title="Configure Stressors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <StressorToggle active={rentHike} onClick={() => setRentHike(!rentHike)} label={`Rent Hike (+${rentHikeAmount})`} />
            <StressorToggle active={jobLoss} onClick={() => setJobLoss(!jobLoss)} label="Job Loss" />
            <StressorToggle active={emergencyExpense} onClick={() => setEmergencyExpense(!emergencyExpense)} label={`Emergency (-${emergencyExpenseAmount})`} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Display */}
          <div className="lg:col-span-7">
            <div className="relative flex items-center justify-center h-64">
              {/* Circular Progress (Hardware Style) */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="2" />
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
                  className={`text-7xl font-bold font-mono tracking-tighter ${stats.isCritical ? 'text-rose-500' : 'text-text-primary'}`}
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
                    ? `CRITICAL: Runway is below ${safetyThresholdMonths * 30} days. Immediate liquidity injection or expense reduction required.`
                    : `OPTIMAL: Current reserves exceed ${safetyThresholdMonths}-month safety threshold. Portfolio stability confirmed.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Configure Runway</h2>
                  <p className="text-xs font-mono text-text-secondary dark:text-gray-500 uppercase tracking-widest">Adjust Stress Parameters</p>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <ConfigForm
                initialConfig={{ rentHikeAmount, emergencyExpenseAmount, safetyThresholdMonths }}
                onSave={saveConfig}
                onCancel={() => setIsConfigModalOpen(false)}
                currency={currency}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ConfigFormProps {
  initialConfig: { rentHikeAmount: number, emergencyExpenseAmount: number, safetyThresholdMonths: number };
  onSave: (rent: number, emergency: number, threshold: number) => void;
  onCancel: () => void;
  currency: string;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ initialConfig, onSave, onCancel, currency }) => {
  const [rent, setRent] = useState(initialConfig.rentHikeAmount);
  const [emergency, setEmergency] = useState(initialConfig.emergencyExpenseAmount);
  const [threshold, setThreshold] = useState(initialConfig.safetyThresholdMonths);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rent, emergency, threshold);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="rentHike" className="block text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Rent Hike Amount ({currency})</label>
          <input
            id="rentHike"
            type="number"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-text-primary dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="emergencyExpense" className="block text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Emergency Expense ({currency})</label>
          <input
            id="emergencyExpense"
            type="number"
            value={emergency}
            onChange={(e) => setEmergency(Number(e.target.value))}
            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-text-primary dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="safetyThreshold" className="block text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Safety Threshold (Months)</label>
          <input
            id="safetyThreshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-text-primary dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl font-bold text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

const StressorToggle = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all duration-300 border ${
      active 
        ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-secondary hover:text-text-primary hover:border-gray-300 dark:hover:border-white/20'
    }`}
  >
    {label}
  </button>
);

const DataRow = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const colorClasses: Record<string, string> = {
    rose: 'text-rose-500 dark:text-rose-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400'
  };
  
  return (
    <div className="flex justify-between items-end border-b border-gray-100 dark:border-white/5 pb-2 group/row">
      <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest group-hover/row:text-text-primary transition-colors">{label}</span>
      <span className={`text-lg font-bold font-mono tracking-tight ${colorClasses[color] || 'text-text-primary'}`}>{value}</span>
    </div>
  );
};

export default FinancialStressTest;
