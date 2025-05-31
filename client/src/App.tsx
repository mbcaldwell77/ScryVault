import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Scanner from "@/pages/scanner";
import BookDetails from "@/pages/book-details";
import AddInventory from "@/pages/add-inventory";
import Inventory from "@/pages/inventory";
import BottomNavigation from "@/components/bottom-navigation";

function Router() {
  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto bg-white relative">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/book-details/:isbn" component={BookDetails} />
        <Route path="/add-inventory/:isbn" component={AddInventory} />
        <Route path="/inventory" component={Inventory} />
      </Switch>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
