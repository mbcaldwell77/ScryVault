import { Button } from "@/components/ui/button";
import { Home, Camera, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-50">
      <div className="flex">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className={`flex-1 flex flex-col items-center py-4 space-y-1 ${
            isActive("/") ? "text-primary" : "text-slate-500"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setLocation("/scanner")}
          className={`flex-1 flex flex-col items-center py-4 space-y-1 ${
            isActive("/scanner") || isActive("/book-details") || isActive("/add-inventory") 
              ? "text-primary" 
              : "text-slate-500"
          }`}
        >
          <Camera className="w-6 h-6" />
          <span className="text-xs font-medium">Scanner</span>
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setLocation("/inventory")}
          className={`flex-1 flex flex-col items-center py-4 space-y-1 ${
            isActive("/inventory") ? "text-primary" : "text-slate-500"
          }`}
        >
          <Package className="w-6 h-6" />
          <span className="text-xs font-medium">Inventory</span>
        </Button>
      </div>
    </div>
  );
}
