import { useLocalStorage } from "@/hooks/use-local-storage";

export interface InventoryItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  imageUrl?: string;
  purchasePrice: number;
  condition: string;
  location?: string;
  type: "COGS" | "Expense";
  dateAdded: string;
}

export function useInventoryStorage() {
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>("scryVaultInventory", []);

  const addItem = (item: Omit<InventoryItem, "id" | "dateAdded">) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };
    
    setInventory(prev => [newItem, ...prev]);
    return newItem;
  };

  const removeItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const getStats = () => {
    const totalBooks = inventory.length;
    const totalCOGS = inventory
      .filter(item => item.type === "COGS")
      .reduce((sum, item) => sum + item.purchasePrice, 0);
    const totalExpense = inventory
      .filter(item => item.type === "Expense")
      .reduce((sum, item) => sum + item.purchasePrice, 0);
    const totalValue = totalCOGS + totalExpense;
    const avgPrice = totalBooks > 0 ? totalValue / totalBooks : 0;

    return {
      totalBooks,
      totalCOGS,
      totalExpense,
      totalValue,
      avgPrice,
    };
  };

  return {
    inventory,
    addItem,
    removeItem,
    updateItem,
    getStats,
  };
}

// Recent ISBNs for manual input suggestions
export function useRecentISBNs() {
  const [recentISBNs, setRecentISBNs] = useLocalStorage<string[]>("scryVaultRecentISBNs", []);

  const addRecentISBN = (isbn: string) => {
    setRecentISBNs(prev => {
      const filtered = prev.filter(item => item !== isbn);
      return [isbn, ...filtered].slice(0, 5); // Keep only last 5
    });
  };

  return {
    recentISBNs,
    addRecentISBN,
  };
}
