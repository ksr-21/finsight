import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import App from './App';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import { User } from './types';

const Site: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('finsight_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('finsight_user');
    setCurrentUser(null);
  };

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
