import type { Book, User } from "@shared/schema";

export interface InventoryBook extends Book {
  sku?: string | null;
  imageUrl?: string | null;
  format?: string | null;
  location?: string | null;
  storageLocation?: string | null;
  notes?: string | null;
  type?: string | null;
  status?: string | null;
  purchaseDate?: string | null;
  dateAdded?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
