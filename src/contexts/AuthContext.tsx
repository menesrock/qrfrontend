import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { initializeSocket, disconnectSocket } from '../config/socket';
import { setRefreshAuthEnabled } from '../config/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't check auth on initial load to avoid blocking the UI
    // User will be checked after login
    setLoading(false);
    setRefreshAuthEnabled(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login({ email, password });
      setUser(response.user);
      setRefreshAuthEnabled(true);
      
      // Initialize WebSocket connection
      const socket = initializeSocket();
      socket.connect();
      
      // Log socket connection status
      socket.on('connect', () => {
        console.log('[Auth] Socket connected successfully');
      });
      socket.on('connect_error', (error) => {
        console.error('[Auth] Socket connection error:', error);
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      setRefreshAuthEnabled(false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setRefreshAuthEnabled(false);
      
      // Disconnect WebSocket
      disconnectSocket();
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
