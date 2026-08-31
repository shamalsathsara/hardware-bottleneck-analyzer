import { useState, useCallback } from 'react';
import { getCurrentUser, setSession, clearSession } from '../services/authService';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  const login = useCallback((token, user) => {
    setSession(token, user);
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };
}

export default useAuth;
