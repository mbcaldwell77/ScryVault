import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateSKU, InventoryCopy, BookMetadata, useInventory } from "@/hooks/use-inventory";

interface PurchaseModalProps {
  isOpen: boolean;
  book: { isbn: string; metadata: BookMetadata } | null;
  onClose: () => void;
  addCopyToInventory: (isbn: string, metadata: BookMetadata, copy: InventoryCopy) => void;
}

export default function PurchaseModal({ isOpen, book, onClose, addCopyToInventory }: PurchaseModalProps) {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [condition, setCondition] = useState("Good");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const { inventory } = useInventory();

  if (!book) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sku = generateSKU(book.metadata, condition, inventory);
    const copy: InventoryCopy = {
      sku,
      purchasePrice: parseFloat(purchasePrice || "0"),
      condition,
      purchaseDate,
      purchaseLocation: purchaseLocation || undefined,
    };
    addCopyToInventory(book.isbn, book.metadata, copy);
    setPurchasePrice("");
    setPurchaseLocation("");
    setCondition("Good");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" style={{ backgroundColor: "var(--dark-card)", borderColor: "var(--dark-border)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-light)" }}>Add Purchase Info</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium" style={{ color: "var(--text-light)" }}>
              Purchase Price
            </Label>
            <Input id="price" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} style={{ backgroundColor: "var(--dark-surface)", borderColor: "var(--dark-border)", color: "var(--text-light)" }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition" className="text-sm font-medium" style={{ color: "var(--text-light)" }}>
              Condition
            </Label>
            <Input id="condition" type="text" value={condition} onChange={(e) => setCondition(e.target.value)} style={{ backgroundColor: "var(--dark-surface)", borderColor: "var(--dark-border)", color: "var(--text-light)" }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium" style={{ color: "var(--text-light)" }}>
              Purchase Location
            </Label>
            <Input id="location" type="text" value={purchaseLocation} onChange={(e) => setPurchaseLocation(e.target.value)} style={{ backgroundColor: "var(--dark-surface)", borderColor: "var(--dark-border)", color: "var(--text-light)" }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium" style={{ color: "var(--text-light)" }}>
              Purchase Date
            </Label>
            <Input id="date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} style={{ backgroundColor: "var(--dark-surface)", borderColor: "var(--dark-border)", color: "var(--text-light)" }} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" style={{ backgroundColor: "var(--dark-card)", borderColor: "var(--dark-border)", color: "var(--text-secondary)" }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: "#10B981" }}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
