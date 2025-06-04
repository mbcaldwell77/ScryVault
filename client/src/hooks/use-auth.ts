import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('recentISBNs'); // Fix data leakage between accounts
      localStorage.removeItem('scannedBooks'); // Clear any cached scan data
      localStorage.removeItem('userPreferences'); // Clear user-specific preferences
      
      // Clear all React Query cache
      queryClient.clear();
      
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
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  const isAuthenticated = () => {
    return !!getToken();
  };

  return {
    logout,
    getUser,
    getToken,
    isAuthenticated,
    isLoggingOut
  };
}