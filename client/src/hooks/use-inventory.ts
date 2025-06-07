import { useLocalStorage } from "@/hooks/use-local-storage";

export interface BookMetadata {
  title: string;
  author: string;
  imageUrl?: string;
  publisher?: string;
  format?: string;
}

export interface InventoryCopy {
  sku: string;
  purchasePrice: number;
  condition: string;
  purchaseDate: string;
  purchaseLocation?: string;
}

export interface InventoryData {
  [isbn: string]: {
    metadata: BookMetadata;
    copies: InventoryCopy[];
  };
}

export function useInventory() {
  const [inventory, setInventory] = useLocalStorage<InventoryData>("inventory", {});

  const addCopyToInventory = (isbn: string, metadata: BookMetadata, copy: InventoryCopy) => {
    setInventory((prev) => {
      const entry = prev[isbn] || { metadata, copies: [] as InventoryCopy[] };
      return {
        ...prev,
        [isbn]: {
          metadata: entry.metadata || metadata,
          copies: [...entry.copies, copy],
        },
      };
    });
  };

  return { inventory, addCopyToInventory };
}

export function generateSKU(metadata: BookMetadata, condition: string, current?: InventoryData): string {
  const baseFormat = (metadata.format || "BK").replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const baseAuthor = metadata.author.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  const baseTitle = metadata.title.replace(/\s+/g, "").slice(0, 8).toUpperCase();
  const baseCond = condition.slice(0, 2).toUpperCase();
  const base = `${baseFormat}-${baseAuthor}-${baseTitle}-${baseCond}`;

  const inv = current || {};
  let max = 0;
  Object.values(inv).forEach((entry) => {
    entry.copies.forEach((c) => {
      if (c.sku.startsWith(base)) {
        const num = parseInt(c.sku.slice(base.length));
        if (!isNaN(num) && num > max) max = num;
      }
    });
  });

  const next = (max + 1).toString().padStart(3, "0");
  return `${base}${next}`;
}
