import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartPieIcon,
  WalletIcon,
  ScaleIcon,
  TrendingUpIcon,
  NewspaperIcon,
  SparklesIcon
} from './icons';

const MobileNav: React.FC = () => {
  const navItems = [
    { label: 'Dash', path: '/dashboard', icon: ChartPieIcon },
    { label: 'Trans', path: '/transactions', icon: WalletIcon },
    { label: 'Budgets', path: '/budgets', icon: ScaleIcon },
    { label: 'Horizon', path: '/horizon', icon: TrendingUpIcon },
    { label: 'Insights', path: '/insights', icon: SparklesIcon },
    { label: 'News', path: '/news', icon: NewspaperIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 scale-110' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
