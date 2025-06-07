import { Button } from "@/components/ui/button";
import { Camera, Package, TrendingUp, LogOut, User, Settings, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { InventoryBook } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [, setLocation] = useLocation();
  const { logout, getUser, isLoggingOut } = useAuth();
  
  const { data: books = [] } = useQuery<InventoryBook[]>({
    queryKey: ["/api/books"],
  });

  const user = getUser();

  const totalBooks = books.length;
  const totalInvestment = books.reduce((sum: number, book: InventoryBook) => sum + Number(book.purchasePrice ?? 0), 0);
  const totalEstimatedValue = books.reduce((sum: number, book: InventoryBook) => sum + Number(book.estimatedPrice ?? book.purchasePrice ?? 0), 0);
  const potentialProfit = totalEstimatedValue - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
      {/* Premium Header */}
      <div 
        className="p-8 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d4a3f 100%)',
          boxShadow: '0 8px 32px rgba(45, 74, 63, 0.4)'
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 50%)`
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">ScryVault</h1>
              <p className="text-white/90 text-lg">Professional Book Inventory Management</p>
            </div>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-white/10 p-2 rounded-full"
                  disabled={isLoggingOut}
                >
                  <User className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 text-sm border-b">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-muted-foreground capitalize">
                    {user?.subscriptionTier} • {user?.role || 'user'}
                  </p>
                </div>
                <DropdownMenuItem 
                  onClick={() => setLocation('/account')}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem 
                    onClick={() => setLocation('/admin')}
                    className="cursor-pointer"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full" />
            <div className="w-8 h-1 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full" />
            <div className="w-4 h-1 bg-yellow-800 rounded-full" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--dark-background)' }}>
        {/* Premium Dashboard - Only show when books exist */}
        {totalBooks > 0 && (
          <div className="premium-dashboard">
            {/* 3-Column Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="mystical-number text-white">{totalBooks}</div>
                <div className="mystical-label mt-1">Collection</div>
              </div>
              <div className="text-center">
                <div className="mystical-number" style={{ color: '#e8eaed' }}>
                  ${totalInvestment.toFixed(0)}
                </div>
                <div className="mystical-label mt-1" style={{ color: '#9aa0a6' }}>Invested</div>
              </div>
              <div className="text-center">
                <div className="mystical-number" style={{ color: 'var(--emerald-primary)' }}>
                  ${totalEstimatedValue.toFixed(0)}
                </div>
                <div className="mystical-label mt-1" style={{ color: '#9aa0a6' }}>Est. Value</div>
              </div>
            </div>

            {/* Profit Row */}
            <div 
              className="pt-4 border-t text-center"
              style={{ borderColor: 'rgba(154, 160, 166, 0.3)' }}
            >
              <div className="flex items-center justify-center space-x-4">
                <TrendingUp className="w-5 h-5" style={{ color: '#9aa0a6' }} />
                <span className="text-lg font-bold" style={{ 
                  color: potentialProfit >= 0 ? 'var(--emerald-primary)' : '#FF6B6B' 
                }}>
                  ${potentialProfit.toFixed(2)} Profit ({profitMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Quick Access */}
        {user?.role === 'admin' && (
          <div className="mb-4">
            <Button 
              onClick={() => setLocation("/admin")}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl border-2 border-red-500"
            >
              <Shield className="w-6 h-6 mr-3" />
              Admin Dashboard
            </Button>
          </div>
        )}

        {/* Premium Action Buttons */}
        <div className="grid grid-cols-1 gap-4">
          <Button 
            onClick={() => setLocation("/scanner")}
            className="mystical-button h-16 text-white text-lg font-semibold rounded-xl"
          >
            <Camera className="w-6 h-6 mr-3" />
            Scan Book
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")}
            className="h-16 text-lg font-semibold rounded-xl border-2 transition-all duration-300 hover:scale-102"
            style={{
              background: 'linear-gradient(135deg, #2a2d30 0%, #1e2124 100%)',
              borderColor: '#9aa0a6',
              color: '#9aa0a6'
            }}
          >
            <Package className="w-6 h-6 mr-3" />
            View Inventory
          </Button>
        </div>

        {/* Mystical Empty State */}
        {totalBooks === 0 && (
          <div className="text-center py-16">
            <div className="mystical-orb mx-auto mb-8"></div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Begin Your Mystical Journey
            </h2>
            
            <p className="text-lg mb-8 max-w-md mx-auto leading-relaxed" style={{ color: '#9aa0a6' }}>
              Unlock the hidden value within your books. Each scan reveals market insights 
              and profit potential through our intelligence platform.
            </p>

            <div className="space-y-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--emerald-primary)' }}></div>
                <span>Real-time market analysis</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--emerald-primary)' }}></div>
                <span>Profit optimization insights</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--emerald-primary)' }}></div>
                <span>Professional inventory tracking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}