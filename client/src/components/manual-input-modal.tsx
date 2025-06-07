import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecentISBNs } from "@/lib/storage";

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (isbn: string) => void;
}

export default function ManualInputModal({ isOpen, onClose, onSubmit }: ManualInputModalProps) {
  const [isbn, setIsbn] = useState("");
  const { recentISBNs, addRecentISBN } = useRecentISBNs();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isbn.trim()) {
      addRecentISBN(isbn.trim()); // Track this ISBN as recent
      onSubmit(isbn.trim());
      setIsbn("");
    }
  };

  const handleClose = () => {
    setIsbn("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-light)' }}>Enter ISBN Manually</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="isbn" className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              ISBN Number
            </Label>
            <Input
              id="isbn"
              type="text"
              placeholder="9780123456789"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="text-lg font-mono tracking-wider"
              style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}
              autoFocus
            />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Enter 10 or 13 digit ISBN without spaces or dashes
            </p>
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-light)' }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: 'var(--emerald-primary)' }}>
              Look Up Book
            </Button>
          </div>
        </form>

        {/* Recent ISBNs */}
        {recentISBNs.length > 0 && (
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--dark-border)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>Recent</h3>
            {recentISBNs.map((recentIsbn) => (
              <div 
                key={recentIsbn} 
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: 'var(--dark-card)' }}
              >
                <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{recentIsbn}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    addRecentISBN(recentIsbn); // Track usage
                    onSubmit(recentIsbn);
                    setIsbn("");
                  }}
                  className="text-sm font-medium"
                  style={{ color: 'var(--emerald-accent)' }}
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
