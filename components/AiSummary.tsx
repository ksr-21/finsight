import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { aiService } from '../services/aiService';
import { Transaction, Budget } from '../types';
import { SparklesIcon, TrendingUpIcon, WalletIcon } from './icons';

interface AiSummaryProps {
  transactions: Transaction[];
  budgets: Budget[];
}

const AiSummary: React.FC<AiSummaryProps> = ({ transactions, budgets }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      if (transactions.length === 0) {
        setInsights(["Start adding transactions to get AI-powered financial insights!"]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await aiService.getFinancialInsights(transactions, budgets);
        setInsights(data);
      } catch (error) {
        setInsights(["Focus on your top spending categories this month.", "Consider setting a budget for 'Dining Out'.", "Your savings rate is looking healthy!"]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [transactions, budgets]);

  return (
    <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30 group">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 opacity-90" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-[80px]" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-inner group-hover:rotate-12 transition-transform duration-500">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">FinSight Intelligence</h2>
              <p className="text-xs font-mono uppercase tracking-[0.3em] opacity-60 mt-1">Neural Financial Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Live Engine Active</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                className="bg-white/20 dark:bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/30 dark:hover:bg-white/20 hover:border-white/30 transition-all duration-500 group/card relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-30 transition-opacity">
                  {index === 0 ? <TrendingUpIcon className="w-12 h-12" /> : index === 1 ? <WalletIcon className="w-12 h-12" /> : <SparklesIcon className="w-12 h-12" />}
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover/card:scale-110 transition-transform">
                    {index === 0 ? <TrendingUpIcon className="w-6 h-6" /> : index === 1 ? <WalletIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
                  </div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-3">Insight {index + 1}</h4>
                  <p className="text-base leading-relaxed font-medium text-white/90">{insight}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSummary;
