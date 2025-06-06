import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryBook } from "@/types";

interface EditBookDialogProps {
  book: InventoryBook | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditBookDialog({ book, isOpen, onClose }: EditBookDialogProps) {
  const [formData, setFormData] = useState({
    format: 'Other',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    location: '',
    condition: 'Good',
    notes: '',
    storageLocation: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when book prop changes
  useEffect(() => {
    if (book && isOpen) {
      setFormData({
        format: book.format || 'Other',
        purchasePrice: book.purchasePrice != null ? String(book.purchasePrice) : '',
        purchaseDate: book.purchaseDate ? new Date(book.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        location: book.location || '',
        condition: book.condition || 'Good',
        notes: book.notes || '',
        storageLocation: book.storageLocation || ''
      });
    }
  }, [book, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateMutation = useMutation<InventoryBook | null, Error, typeof formData>({
    mutationFn: async (data: typeof formData) => {
      const updateData = {
        ...book,
        format: data.format,
        purchasePrice: data.purchasePrice.toString(), // Keep as string to match schema
        purchaseDate: data.purchaseDate,
        location: data.location,
        condition: data.condition,
        notes: data.notes,
        storageLocation: data.storageLocation,
        type: 'COGS' // Fixed classification for V2
      };

      const response = await apiRequest<InventoryBook>(`/api/books/${book!.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      toast({
        title: "Success",
        description: "Book updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update book",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid purchase price",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold" style={{ color: 'var(--text-light)' }}>Edit Book Details</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book Format - Always shown in edit */}
          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Book Format <span style={{ color: '#ef4444' }}>*</span>
            </Label>
            <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)} required>
              <SelectTrigger className="text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hardcover">Hardcover</SelectItem>
                <SelectItem value="Mass Market Paperback">Mass Market Paperback</SelectItem>
                <SelectItem value="Trade Paperback">Trade Paperback</SelectItem>
                <SelectItem value="Oversize">Oversize</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchasePrice" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Purchase Price <span style={{ color: '#ef4444' }}>*</span>
            </Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
              placeholder="0.00"
              className="text-lg"
              required
            />
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Purchase Date <span style={{ color: '#ef4444' }}>*</span>
            </Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="text-lg"
              required
            />
          </div>

          {/* Purchase Location - Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Purchase Location
            </Label>
            <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Garage Sale">Garage Sale</SelectItem>
                <SelectItem value="Estate Sale">Estate Sale</SelectItem>
                <SelectItem value="Thrift Store">Thrift Store</SelectItem>
                <SelectItem value="Online Retailer">Online Retailer</SelectItem>
                <SelectItem value="Local Retailer">Local Retailer</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition and Notes - Grouped */}
          <div className="space-y-2">
            <Label htmlFor="condition" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Condition <span style={{ color: '#ef4444' }}>*</span>
            </Label>
            <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)} required>
              <SelectTrigger className="text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Brand New">Brand New</SelectItem>
                <SelectItem value="Like New">Like New</SelectItem>
                <SelectItem value="Very Good">Very Good</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Acceptable">Acceptable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Condition details, inscriptions, damage notes, etc."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              maxLength={500}
              className="text-lg min-h-[80px]"
              rows={3}
            />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {formData.notes.length}/500 characters
            </p>
          </div>

          {/* Storage Location */}
          <div className="space-y-2">
            <Label htmlFor="storageLocation" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Storage Location
            </Label>
            <Input
              id="storageLocation"
              type="text"
              value={formData.storageLocation}
              onChange={(e) => handleInputChange('storageLocation', e.target.value)}
              placeholder="Shelf A, Box 1, etc."
              className="text-lg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-secondary)' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="flex-1 border-2" style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF', fontWeight: '700', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}