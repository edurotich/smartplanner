'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  phone: string;
  name?: string;
  verified: boolean;
}

export interface TokenBalance {
  balance: number;
}

export interface AuthState {
  user: User | null;
  tokens: TokenBalance | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      console.log('Checking authentication status...');
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get debug session token from localStorage if available
      const debugToken = localStorage.getItem('debug_session_token');
      if (debugToken) {
        console.log('Debug session token found in localStorage:', 
          debugToken.substring(0, 6) + '...' + debugToken.substring(debugToken.length - 6));
      }

      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies in the request
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth data received:', data.authenticated);
        
        setAuthState({
          user: data.user || null,
          tokens: data.tokens || null,
          isLoading: false,
          isAuthenticated: data.authenticated || false,
          error: null
        });
      } else {
        console.log('Auth check failed with status:', response.status);
        setAuthState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Authentication failed'
        });
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear any debugging information
      localStorage.removeItem('debug_session_token');
      localStorage.removeItem('debug_session_expires');
      
      setAuthState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });
      
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [router]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    checkAuth,
    logout
  };
}