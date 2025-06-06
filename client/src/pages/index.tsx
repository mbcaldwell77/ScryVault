import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalHeader from "@/components/global-header";
import EditBookDialog from "@/components/edit-book-dialog";
import DeleteBookDialog from "@/components/delete-book-dialog";
import { usePricingData, getConfidenceDisplay } from "@/hooks/use-pricing";
import type { InventoryBook } from "@/types";

export default function InventoryDashboard() {
  const {
    data: books = [],
    isLoading,
    error,
    refetch,
  } = useQuery<InventoryBook[]>({
    queryKey: ["/api/books"],
  });

  const [editingBook, setEditingBook] = useState<InventoryBook | null>(null);
  const [deletingBook, setDeletingBook] = useState<InventoryBook | null>(null);

  // Group books by ISBN
  const groupedBooks = books.reduce<Record<string, InventoryBook[]>>(
    (acc, book) => {
      if (!acc[book.isbn]) acc[book.isbn] = [];
      acc[book.isbn].push(book);
      return acc;
    },
    {}
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-24" style={{ backgroundColor: "var(--pure-white)" }}>
        <GlobalHeader title="Inventory" />
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-sm text-red-600">Failed to load inventory.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex-1 flex flex-col pb-24" style={{ backgroundColor: "var(--pure-white)" }}>
        <GlobalHeader title="Inventory" />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground">No books found. Start scanning to build your inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24" style={{ backgroundColor: "var(--pure-white)" }}>
      <GlobalHeader title="Inventory" />
      <div className="p-4">
        <Accordion type="multiple" className="w-full space-y-2">
          {Object.entries(groupedBooks).map(([isbn, isbnBooks]) => {
            const first = isbnBooks[0];
            const copyCount = isbnBooks.length;
            const { data: pricingData, isLoading: pricingLoading } = usePricingData(isbn);

            const avgPurchase =
              isbnBooks.reduce((sum, b) => sum + Number(b.purchasePrice ?? 0), 0) / copyCount;
            const avgMarket = pricingData
              ? pricingData.averagePrice
              : isbnBooks.reduce((sum, b) => sum + Number(b.estimatedPrice ?? 0), 0) / copyCount;
            const totalProfit = isbnBooks.reduce((sum, b) => {
              const market = pricingData ? pricingData.averagePrice : Number(b.estimatedPrice ?? 0);
              return sum + (market - Number(b.purchasePrice ?? 0));
            }, 0);
            const profitColor = totalProfit >= 0 ? "text-green-600" : "text-red-600";
            const confidenceInfo = pricingData ? getConfidenceDisplay(pricingData.confidence) : null;

            return (
              <AccordionItem key={isbn} value={isbn} className="border rounded-lg">
                <AccordionTrigger className="px-4">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium leading-tight">{first.title}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {first.author}
                    </span>
                    <span className="text-xs text-muted-foreground">ISBN {isbn}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs">{copyCount} copies</div>
                    <div className="text-xs text-muted-foreground">
                      Avg Paid ${avgPurchase.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pricingLoading ? (
                        <Skeleton className="h-3 w-16" />
                      ) : (
                        <>Market ${avgMarket.toFixed(2)}</>
                      )}
                    </div>
                    <div className={`text-xs font-medium ${profitColor}`}>
                      {totalProfit >= 0 ? "+" : ""}
                      {totalProfit.toFixed(2)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-muted/50">
                  <div className="space-y-3 px-4">
                    {isbnBooks.map((book) => {
                      const market = pricingData ? pricingData.averagePrice : Number(book.estimatedPrice ?? 0);
                      const profit = market - Number(book.purchasePrice ?? 0);
                      const bookProfitColor = profit >= 0 ? "text-green-600" : "text-red-600";
                      return (
                        <Card key={book.id} className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{book.condition}</div>
                              <div className="text-xs text-muted-foreground">
                                Paid ${Number(book.purchasePrice ?? 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Market {pricingLoading ? "..." : `$${market.toFixed(2)}`}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {confidenceInfo && (
                                <Badge className={`${confidenceInfo.bgColor} ${confidenceInfo.color} text-xs`}>{
                                  confidenceInfo.label
                                }</Badge>
                              )}
                              <div className={`text-xs font-medium ${bookProfitColor}`}>{
                                profit >= 0 ? "+" : ""
                              }{profit.toFixed(2)}</div>
                              <div className="flex space-x-2 pt-1">
                                <Button size="sm" variant="outline" onClick={() => setEditingBook(book)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeletingBook(book)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
      <EditBookDialog book={editingBook} isOpen={!!editingBook} onClose={() => setEditingBook(null)} />
      <DeleteBookDialog book={deletingBook} isOpen={!!deletingBook} onClose={() => setDeletingBook(null)} />
    </div>
  );
}
