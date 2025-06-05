import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    user: any;
    tokenValid: boolean;
  }>({
    isAuthenticated: false,
    user: null,
    tokenValid: false
  });

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('recentISBNs');
    localStorage.removeItem('scannedBooks');
    localStorage.removeItem('userPreferences');
    queryClient.clear();
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      tokenValid: false
    });
  }, []);

  const validateToken = useCallback(async () => {
    setIsValidating(true);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokenValid: false
      });
      setIsValidating(false);
      return false;
    }

    try {
      // Validate token with the /me endpoint
      const response = await apiRequest('/api/auth/me', {
        method: 'GET'
      });
      
      if (response && response.user) {
        // Update user data in localStorage if it changed
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          tokenValid: true
        });
        setIsValidating(false);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      
      // Clear invalid auth data
      clearAuthData();
      setIsValidating(false);
      
      // Show error message if we had a token but it's now invalid
      if (token) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive"
        });
      }
      
      return false;
    }
  }, [clearAuthData, toast]);

  // Validate token on mount and when storage changes
  useEffect(() => {
    validateToken();

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && e.newValue === null) {
        clearAuthData();
        setLocation('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [validateToken, clearAuthData, setLocation]);

  const logout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call logout endpoint to destroy server-side session
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue with logout even if server request fails
      console.error('Server logout failed:', error);
    } finally {
      // Always clear ALL client-side data regardless of server response
      clearAuthData();
      
      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Redirect to login page
      setLocation('/login');
      setIsLoggingOut(false);
    }
  };

  const getUser = () => {
    return authState.user || (() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    })();
  };

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  const isAuthenticated = () => {
    return authState.isAuthenticated && authState.tokenValid;
  };

  return {
    logout,
    getUser,
    getToken,
    isAuthenticated,
    isLoggingOut,
    isValidating,
    validateToken,
    authState
  };
}