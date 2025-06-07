import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Scanner from "@/pages/scanner";
import BookDetails from "@/pages/book-details";
import AddInventory from "@/pages/add-inventory";
import Inventory from "@/pages/inventory";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Account from "@/pages/account";
import AdminPage from "@/pages/admin";
import PWAInstallBanner from "@/components/pwa-install-banner";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isValidating } = useAuth();

  useEffect(() => {
    if (!isValidating && !isAuthenticated()) {
      setLocation('/login');
    }
  }, [isAuthenticated, isValidating, setLocation]);

  // Show loading state while validating token
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" 
             style={{ borderColor: 'var(--emerald-primary)', borderTopColor: 'transparent' }}>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isValidating, authState } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (
      !isValidating &&
      (!isAuthenticated() || authState.user?.role !== 'admin')
    ) {
      setLocation('/login');
    }
  }, [isAuthenticated, isValidating, authState.user, setLocation]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--emerald-primary)', borderTopColor: 'transparent' }}
        ></div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated() && (location === '/login' || location === '/register')) {
      setLocation('/');
    }
  }, [isAuthenticated, location, setLocation]);

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ backgroundColor: 'var(--pure-white)' }}>
      <PWAInstallBanner />
      <Switch>
        {/* Public routes */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        {/* Protected routes */}
        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/scanner">
          <ProtectedRoute>
            <Scanner />
          </ProtectedRoute>
        </Route>
        <Route path="/book-details/:isbn">
          {(params) => (
            <ProtectedRoute>
              <BookDetails isbn={params.isbn} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/add-inventory/:isbn">
          {(params) => (
            <ProtectedRoute>
              <AddInventory isbn={params.isbn} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/inventory">
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        </Route>
        <Route path="/account">
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        </Route>

      </Switch>
    </div>
  );
}

function App() {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Application Error</h1>
          <p className="text-gray-600">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }
}

export default App;
