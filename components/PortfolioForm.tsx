import React, { useState, useEffect } from 'react';
import { PortfolioAsset, Currency, CURRENCY_SYMBOLS } from '../types';

interface PortfolioFormProps {
  onSubmit: (asset: Omit<PortfolioAsset, 'id'>) => void;
  currency: Currency;
  initialData?: PortfolioAsset | null;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ onSubmit, currency, initialData }) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [type, setType] = useState<'stock' | 'crypto' | 'mutual_fund'>('stock');

  useEffect(() => {
    if (initialData) {
      setSymbol(initialData.symbol);
      setName(initialData.name);
      setQuantity(String(initialData.quantity));
      setAveragePrice(String(initialData.averagePrice));
      setCurrentPrice(String(initialData.currentPrice));
      setType(initialData.type);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !name || !quantity || !averagePrice || !currentPrice) return;
    onSubmit({
      symbol: symbol.toUpperCase(),
      name,
      quantity: parseFloat(quantity),
      averagePrice: parseFloat(averagePrice),
      currentPrice: parseFloat(currentPrice),
      type
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Symbol</label>
            <input
              type="text"
              placeholder="AAPL, BTC, etc."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Asset Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            >
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
              <option value="mutual_fund">Mutual Fund</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Asset Name</label>
          <input
            type="text"
            placeholder="Apple Inc., Bitcoin, etc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Avg Price ({CURRENCY_SYMBOLS[currency]})</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={averagePrice}
              onChange={(e) => setAveragePrice(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-text-secondary dark:text-gray-400 uppercase tracking-widest ml-1">Current Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
      >
        {initialData ? 'Update Asset' : 'Save Asset'}
      </button>
    </form>
  );
};

export default PortfolioForm;
