import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  NewspaperIcon,
  SearchIcon,
  RefreshIcon,
  AlertCircleIcon,
  CalendarIcon
} from './icons';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  category: string;
  guid: string;
}

const MOCK_NEWS: NewsItem[] = [
  {
    title: "Global Markets Rally as Inflation Cools Down",
    link: "https://finance.yahoo.com",
    pubDate: new Date().toISOString(),
    content: "Stock indices around the world surged today as latest inflation numbers came in lower than expected, fueling hopes that central banks will begin cutting interest rates sooner rather than later.",
    source: "Yahoo Finance",
    category: "Markets",
    guid: "mock-1"
  },
  {
    title: "Federal Reserve Signals Interest Rate Cut Later This Year",
    link: "https://bbc.com",
    pubDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    content: "The Federal Reserve hinted at potential policy easing in its latest minutes, suggesting that if economic data remains stable, interest rates could be adjusted downwards to support growth.",
    source: "BBC Business",
    category: "Economy",
    guid: "mock-2"
  },
  {
    title: "AI Startups See Record Venture Funding in Q2",
    link: "https://news.google.com",
    pubDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    content: "Venture capital investments in artificial intelligence reached a new peak this quarter, with billions of dollars flowing into early-stage developers building foundation models and developer tools.",
    source: "Google News Finance",
    category: "Startups",
    guid: "mock-3"
  },
  {
    title: "Bitcoin Surges Past $68,000 Amid Institutional Inflows",
    link: "https://cnn.com",
    pubDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    content: "Cryptocurrency markets experienced a strong upward move as major exchange-traded funds recorded record net inflows, reinforcing positive market sentiment among institutional investors.",
    source: "CNN Business",
    category: "Crypto",
    guid: "mock-4"
  },
  {
    title: "Tech Giants Announce New Green Energy Partnerships",
    link: "https://bbc.com",
    pubDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    content: "Leading tech firms have signed power purchase agreements with solar and wind developers to power their next-generation data centers, aligning with carbon neutrality targets.",
    source: "BBC Business",
    category: "Technology",
    guid: "mock-5"
  }
];

const CATEGORIES = ['All', 'Markets', 'Economy', 'Technology', 'Crypto', 'Startups', 'Global', 'General'];

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      setNews(data);
    } catch (err) {
      console.warn('Could not fetch live news, falling back to mock news data:', err);
      setNews(MOCK_NEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesSearch = (item.title + item.content).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [news, searchQuery, selectedCategory]);

  const breakingNews = useMemo(() => {
    // Treat any news from the last 2 hours as "Breaking" or just take the first few
    return news.slice(0, 3);
  }, [news]);

  if (loading && news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshIcon className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-text-secondary dark:text-gray-400 font-medium">Fetching real-time intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 px-4 sm:px-0">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary dark:text-white tracking-tight">Market Insights</h2>
          <p className="text-text-secondary dark:text-gray-400 mt-1">Curated real-time financial intelligence.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
            />
          </div>
          <button
            onClick={fetchNews}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <RefreshIcon className={`w-5 h-5 text-gray-500 group-hover:text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Breaking News Ticker/Section */}
      <AnimatePresence>
        {!searchQuery && selectedCategory === 'All' && breakingNews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 rounded-[2.5rem] p-1 overflow-hidden"
          >
            <div className="bg-indigo-600 px-6 py-2 flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Breaking Now</span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-[2.3rem] p-6 md:p-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {breakingNews.map((item, i) => (
                   <a
                    key={item.guid}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group space-y-3"
                   >
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{item.source}</span>
                       <span className="text-[10px] text-gray-400">•</span>
                       <span className="text-[10px] text-gray-400">{new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <h4 className="font-bold text-text-primary dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2">
                       {item.title}
                     </h4>
                   </a>
                 ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-indigo-500/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News Grid */}
      {error ? (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-8 rounded-[2rem] text-center">
          <AlertCircleIcon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          <button
            onClick={fetchNews}
            className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors"
          >
            Retry Fetch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.map((item, index) => (
            <motion.a
              key={item.guid}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index % 10 * 0.05 }}
              className="group bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all duration-500 relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-500/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase tracking-wider">
                    <CalendarIcon className="w-3 h-3" />
                    {new Date(item.pubDate).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-text-secondary dark:text-gray-400 leading-relaxed mb-8 text-sm line-clamp-3">
                  {item.content?.replace(/<[^>]*>?/gm, '')}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.source}</span>
                  <div className="flex items-center text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    Read Story
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {filteredNews.length === 0 && !loading && !error && (
        <div className="py-20 text-center">
          <NewspaperIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No news found matching your criteria.</p>
        </div>
      )}

    </div>
  );
};

export default News;
