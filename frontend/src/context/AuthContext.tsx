import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMsal, useAccount } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  auth_provider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithEntraId: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const checkAuth = async () => {
    try {
      // First check if we have an MSAL account with access token
      if (account) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account,
          });
          
          // Set the authorization header for all axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
          
          // Validate the token with our backend
          const response = await axios.post('/auth/entra/validate');
          setUser(response.data.user);
          return;
        } catch (error) {
          console.error('MSAL token error:', error);
          // Fall through to session-based auth check
        }
      }

      // Fallback to session-based authentication
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      // Clear authorization header if auth fails
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const loginWithEntraId = async () => {
    try {
      setLoading(true);
      const loginResponse = await instance.loginPopup(loginRequest);
      
      if (loginResponse.accessToken) {
        // Set the authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.accessToken}`;
        
        // Validate token with backend and get/create user
        const response = await axios.post('/auth/entra/validate');
        setUser(response.data.user);
      }
    } catch (error: any) {
      console.error('Entra ID login error:', error);
      throw new Error(error.message || 'Entra ID login failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Clear any existing authorization header for traditional login
      delete axios.defaults.headers.common['Authorization'];
      
      const response = await axios.post('/auth/login', { email, password });
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // If we have an MSAL account, log out from MSAL
      if (account) {
        await instance.logoutPopup({
          account: account,
          postLogoutRedirectUri: window.location.origin,
        });
      }
      
      // Always call backend logout to clear session
      try {
        await axios.post('/auth/logout');
      } catch (error) {
        console.error('Backend logout error:', error);
      }
      
      // Clear authorization header
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [account]); // Re-run when MSAL account changes

  const value = {
    user,
    loading,
    login,
    loginWithEntraId,
    logout,
    checkAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}