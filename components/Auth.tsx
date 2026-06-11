import React, { useState } from 'react';
import { ChartPieIcon, ArrowLeftIcon, RefreshIcon } from './icons';
import { User } from '../types';
import { signInWithEmail, signUpWithEmail } from '../services/firestoreService';

interface AuthProps {
    onAuthSuccess: (user: User) => void;
    onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [initialCash, setInitialCash] = useState('0');
    const [initialOnline, setInitialOnline] = useState('0');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (!isLogin && !name) {
            setError('Please enter your full name.');
            return;
        }
        
        setIsLoading(true);

        try {
            if (isLogin) {
                const firebaseUser = await signInWithEmail(email, password);
                const user: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || email.split('@')[0]
                };
                localStorage.setItem('finsight_user', JSON.stringify(user));
                onAuthSuccess(user);
            } else {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        displayName: name,
                        initialCashBalance: parseFloat(initialCash) || 0,
                        initialOnlineBalance: parseFloat(initialOnline) || 0
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);

                const user: User = {
                    uid: data.user.uid,
                    email: data.user.email,
                    displayName: data.user.displayName,
                    initialCashBalance: data.user.initialCashBalance,
                    initialOnlineBalance: data.user.initialOnlineBalance
                };
                localStorage.setItem('finsight_user', JSON.stringify(user));
                onAuthSuccess(user);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col justify-center items-center p-4">
             <div className="absolute top-4 left-4">
                <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary dark:hover:text-white transition-colors">
                    <ArrowLeftIcon className="h-5 w-5"/>
                    <span>Back to Home</span>
                </button>
            </div>
            <div className="w-full max-w-sm">
                <div className="flex justify-center items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ChartPieIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="ml-3 text-3xl font-bold text-text-primary dark:text-white">
                        FinSight<span className="text-indigo-600">.</span>
                    </h1>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-center text-text-primary dark:text-white mb-2">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
                    <p className="text-center text-text-secondary dark:text-gray-400 mb-6 text-sm">{isLogin ? 'Sign in to continue' : 'Get started with your free account'}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-500 text-xs text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">{error}</p>}

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Initial Cash</label>
                                        <input
                                            type="number"
                                            value={initialCash}
                                            onChange={e => setInitialCash(e.target.value)}
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Initial Online</label>
                                        <input
                                            type="number"
                                            value={initialOnline}
                                            onChange={e => setInitialOnline(e.target.value)}
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required
                                disabled={isLoading}
                                placeholder="john@example.com"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required
                                disabled={isLoading}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                            />
                        </div>
                        <div className="pt-2 flex flex-col gap-3">
                             <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 flex justify-center items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                {isLoading ? <RefreshIcon className="animate-spin h-5 w-5" /> : (isLogin ? 'Login' : 'Sign Up')}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            disabled={isLoading}
                            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-gray-400"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                        </button>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            const guestUser = { uid: 'guest_user', email: 'guest@example.com', displayName: 'Guest User' };
                            localStorage.setItem('finsight_user', JSON.stringify(guestUser));
                            onAuthSuccess(guestUser);
                        }}
                        disabled={isLoading}
                        className="text-sm font-bold text-text-secondary dark:text-gray-400 hover:underline disabled:text-gray-600"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;