import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokenValid: boolean;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokenValid: false,
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
    let token = localStorage.getItem("authToken") || "";
    
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokenValid: false
      });
      setIsValidating(false);
      return false;
    }

    const fetchProfile = async (authToken: string) => {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.ok) {
        return (await res.json()) as User;
      }

      if (res.status === 401) {
        return null;
      }

      throw new Error(await res.text());
    };

    try {
      let profile = await fetchProfile(token);

      if (!profile) {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          try {
            const refreshRes = await fetch("/api/auth/refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
              credentials: "include",
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              localStorage.setItem("authToken", data.accessToken);
              localStorage.setItem("refreshToken", data.refreshToken);
              token = data.accessToken;
              profile = await fetchProfile(token);

              if (profile) {
                setAuthState({
                  isAuthenticated: true,
                  user: profile,
                  tokenValid: true,
                });
                localStorage.setItem("user", JSON.stringify(profile));
                setIsValidating(false);
                return true;
              }
            }
          } catch (refreshErr) {
            console.error("Token refresh failed:", refreshErr);
          }
        }

        // If refresh failed
        clearAuthData();
        setIsValidating(false);
        if (token) {
          toast({
            title: "Session expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
        }
        return false;
      }

      // Success path
      localStorage.setItem("user", JSON.stringify(profile));
      setAuthState({
        isAuthenticated: true,
        user: profile,
        tokenValid: true,
      });
      setIsValidating(false);
      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      clearAuthData();
      setIsValidating(false);
      if (token) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
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