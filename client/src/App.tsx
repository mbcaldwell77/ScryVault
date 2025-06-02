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
import PWAInstallBanner from "@/components/pwa-install-banner";

function Router() {
  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ backgroundColor: 'var(--pure-white)' }}>
      <PWAInstallBanner />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/book-details/:isbn">
          {(params) => <BookDetails isbn={params.isbn} />}
        </Route>
        <Route path="/add-inventory/:isbn">
          {(params) => <AddInventory isbn={params.isbn} />}
        </Route>
        <Route path="/inventory" component={Inventory} />
      </Switch>
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
