import { Button } from "@/components/ui/button";
import { LogOut, User, ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GlobalHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function GlobalHeader({
  title,
  showBackButton = false,
  onBack,
}: GlobalHeaderProps) {
  const { logout, getUser, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  const user = getUser();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation("/");
    }
  };

  return (
    <div
      className="flex items-center justify-between p-4 text-white"
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d4a3f 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
      </div>

      {/* User Menu - Always visible on all pages */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-2 rounded-full"
            disabled={isLoggingOut}
          >
            <User className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 text-sm border-b">
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuItem
            onClick={() => setLocation("/account")}
            className="cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </DropdownMenuItem>
          {user?.role === "admin" && (
            <DropdownMenuItem
              onClick={() => setLocation("/admin")}
              className="cursor-pointer"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={logout}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
