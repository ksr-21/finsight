import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import App from './App';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import { User } from './types';
import { onAuthStateChangedListener, signOutUser, getUserProfile } from './services/firestoreService';

const Site: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. First check if we have a guest user in localStorage
    const savedUser = localStorage.getItem('finsight_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.uid === 'guest_user') {
          setCurrentUser(user);
          setIsInitializing(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }

    // 2. Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChangedListener(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full profile from Firestore to get initial balances
          const profile = await getUserProfile(firebaseUser.uid);
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            initialCashBalance: profile?.initialCashBalance || 0,
            initialOnlineBalance: profile?.initialOnlineBalance || 0
          };
          setCurrentUser(user);
          localStorage.setItem('finsight_user', JSON.stringify(user));
        } catch (error) {
          console.warn("Failed to fetch user profile, using basic info", error);
          // Still set user with basic info if profile fetch fails (e.g. offline)
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            initialCashBalance: 0,
            initialOnlineBalance: 0
          };

          // Check if we have a better version in localStorage
          const saved = localStorage.getItem('finsight_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.uid === firebaseUser.uid) {
                setCurrentUser(parsed);
              } else {
                setCurrentUser(user);
              }
            } catch {
              setCurrentUser(user);
            }
          } else {
            setCurrentUser(user);
          }
        }
      } else {
        // Only clear if not guest
        const currentSaved = localStorage.getItem('finsight_user');
        if (currentSaved) {
            try {
                const parsed = JSON.parse(currentSaved);
                if (parsed.uid !== 'guest_user') {
                    setCurrentUser(null);
                    localStorage.removeItem('finsight_user');
                }
            } catch (e) {
                setCurrentUser(null);
                localStorage.removeItem('finsight_user');
            }
        }
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    if (currentUser?.uid !== 'guest_user') {
      await signOutUser();
    }
    localStorage.removeItem('finsight_user');
    localStorage.removeItem('finsight_token');
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <HashRouter>
        <App user={currentUser} onLogout={handleLogout} />
      </HashRouter>
    );
  }

  if (showAuth) {
    return <Auth onAuthSuccess={handleAuthSuccess} onBack={() => setShowAuth(false)} />;
  }
  
  return <LandingPage onLaunchApp={() => setShowAuth(true)} />;
};

export default Site;
