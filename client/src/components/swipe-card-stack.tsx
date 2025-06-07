import React, { useState, useEffect } from "react";
import SwipeableCard from "./swipeable-card";
import type { BookMetadata } from "@/hooks/use-inventory";

interface ScannedBook {
  isbn: string;
  metadata: BookMetadata;
}

interface SwipeCardStackProps {
  books: ScannedBook[];
  openPurchaseModal: (book: ScannedBook) => void;
  onDiscard?: (isbn: string) => void;
}

export default function SwipeCardStack({ books, openPurchaseModal, onDiscard }: SwipeCardStackProps) {
  const [index, setIndex] = useState(0);

  // Ensure index stays within bounds when books array changes
  useEffect(() => {
    if (index >= books.length) {
      setIndex(0);
    }
  }, [books.length, index]);

  const current = books[index];
  if (!current) return <div className="text-center text-slate-500">No books scanned</div>;

  const handleRight = () => {
    openPurchaseModal(current);
  };

  const handleLeft = () => {
    if (onDiscard) onDiscard(current.isbn);
  };

  return (
    <div className="relative w-full flex justify-center items-center">
      <SwipeableCard
        key={current.isbn}
        isbn={current.isbn}
        metadata={current.metadata}
        onSwipeLeft={handleLeft}
        onSwipeRight={handleRight}
      />
    </div>
  );
}
