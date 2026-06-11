import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, Currency, CURRENCY_SYMBOLS, User } from '../types';
import { BellIcon, CheckIcon, TrashIcon, AlertTriangleIcon, InfoIcon, WalletIcon } from '../components/icons';

interface NotificationsPageProps {
  user: User;
  currency: Currency;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user, currency }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock notifications for now, but in real app would fetch from Firestore
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Budget Alert',
        message: 'You have reached 80% of your Food budget for this month.',
        type: 'warning',
        date: new Date().toISOString(),
        isRead: false
      },
      {
        id: '2',
        title: 'Split Bill Request',
        message: 'Kunal shared a split bill for "Dinner" - Your share is ₹450.',
        type: 'split',
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        isRead: false,
        actionUrl: '/transactions'
      },
      {
        id: '3',
        title: 'Target Achieved',
        message: 'Congratulations! You kept your weekly spending under the ₹5000 limit.',
        type: 'info',
        date: new Date(Date.now() - 86400000).toISOString(),
        isRead: true
      }
    ];
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-text-primary dark:text-white tracking-tight mb-2">Notifications</h1>
          <p className="text-text-secondary dark:text-gray-400 font-mono text-sm uppercase tracking-widest">Stay Updated</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm font-bold text-rose-500 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 font-mono text-text-secondary">Loading intelligence...</div>
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`group relative bg-white dark:bg-gray-800 p-6 rounded-3xl border ${n.isRead ? 'border-gray-100 dark:border-gray-700' : 'border-indigo-500/30 bg-indigo-50/10'} shadow-sm transition-all`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    n.type === 'alert' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20' :
                    n.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20' :
                    n.type === 'split' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20'
                  }`}>
                    {n.type === 'alert' || n.type === 'warning' ? <AlertTriangleIcon className="w-6 h-6" /> :
                     n.type === 'split' ? <WalletIcon className="w-6 h-6" /> : <InfoIcon className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold text-lg ${n.isRead ? 'text-text-primary dark:text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] font-mono text-text-secondary dark:text-gray-500 uppercase">
                        {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <CheckIcon className="w-3 h-3" />
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:underline flex items-center gap-1"
                      >
                        <TrashIcon className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-text-secondary dark:text-gray-500 font-mono uppercase tracking-widest">No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
