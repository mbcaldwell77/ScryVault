import { useLocalStorage } from "@/hooks/use-local-storage";
import type { BookMetadata } from "@/hooks/use-inventory";

interface ScannedBook {
  isbn: string;
  metadata: BookMetadata;
}

export function useScannedBooks() {
  const [books, setBooks] = useLocalStorage<ScannedBook[]>("scannedBooks", []);

  const addBook = (isbn: string, metadata: BookMetadata) => {
    setBooks((prev) => [...prev, { isbn, metadata }]);
  };

  const removeFirst = () => {
    setBooks((prev) => prev.slice(1));
  };

  const clear = () => setBooks([]);

  return { books, addBook, removeFirst, clear };
}
