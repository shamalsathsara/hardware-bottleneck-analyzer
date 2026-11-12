import { useState, useCallback, useEffect } from 'react';
import { getCurrentUser, setSession, clearSession } from '../services/authService';
import { UNAUTHORIZED_EVENT } from '../services/apiClient';

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

  // Any 401 from the API (expired/invalid token) ends the session in the UI too.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  return { currentUser, login, logout };
}

export default useAuth;
