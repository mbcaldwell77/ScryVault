import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocationAutocomplete } from "@/hooks/use-location-autocomplete";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { insertBookSchema } from "@shared/schema";
import GlobalHeader from "@/components/global-header";

interface AddInventoryProps {
  isbn: string;
}

export default function AddInventory({ isbn }: AddInventoryProps) {
  const [, setLocationPath] = useLocation();
  const { toast } = useToast();
  const [lastCondition, setLastCondition] = useLocalStorage("last-condition", "");
  const [lastFormat, setLastFormat] = useLocalStorage("last-format", "Other");
  
  const [purchasePrice, setPurchasePrice] = useState("");
  const [condition, setCondition] = useState(lastCondition);
  const [format, setFormat] = useState(lastFormat);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: bookData } = useQuery({
    queryKey: [`/api/book-lookup/${isbn}`],
  });



  const addToInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/books", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success!",
        description: "Book added to inventory successfully",
      });
      setLocationPath("/inventory");
    },
    onError: (error: any) => {
      console.error("Add to inventory error:", error);
      let errorMessage = "Failed to add book to inventory";
      
      if (error.message && error.message.includes("409")) {
        errorMessage = "This book is already in your inventory";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purchasePrice || !condition) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Save last-used values for next session
    setLastCondition(condition);
    setLastFormat(format);
    // Location is now simplified dropdown

    const inventoryData = {
      isbn,
      title: (bookData as any)?.title || "Unknown Title",
      author: (bookData as any)?.author || "Unknown Author",
      publisher: (bookData as any)?.publisher || null,
      year: (bookData as any)?.year || null,
      imageUrl: (bookData as any)?.imageUrl || null,
      purchasePrice: purchasePrice.toString(),
      estimatedPrice: null, // Will be populated by eBay API
      condition,
      format: (bookData as any)?.format || format, // Use API format if available, otherwise user selection
      location: location || null,
      storageLocation: storageLocation || null,
      notes: notes || null,
      type: 'COGS', // Fixed classification for V2
      purchaseDate: purchaseDate,
    };

    try {
      const validatedData = insertBookSchema.parse(inventoryData);
      addToInventoryMutation.mutate(validatedData);
    } catch (error) {
      console.error("Form validation error:", error);
      if (error instanceof Error) {
        toast({
          title: "Validation Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid form data",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--pure-white)' }}>
      <GlobalHeader title="Add to Inventory" showBackButton={true} onBack={() => setLocation(`/book-details/${isbn}`)} />

      {/* Form */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Book Summary */}
        <div className="rounded-xl p-4 premium-card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-16 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--dark-surface)' }}>
              {(bookData as any)?.imageUrl ? (
                <img 
                  src={(bookData as any).imageUrl} 
                  alt="Book cover" 
                  className="w-12 h-16 object-cover rounded"
                />
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>📚</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate" style={{ color: 'var(--text-light)' }}>
                {(bookData as any)?.title || "Loading..."}
              </h3>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                {(bookData as any)?.author || "Loading..."}
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Format - Only show if ISBN API didn't provide format */}
          {!(bookData as any)?.format && (
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
                Book Format <span style={{ color: 'var(--gold-accent)' }}>*</span>
              </Label>
              <Select value={format} onValueChange={setFormat} required>
                <SelectTrigger className="text-lg" style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}>
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
                  <SelectItem value="Hardcover">Hardcover</SelectItem>
                  <SelectItem value="Mass Market Paperback">Mass Market Paperback</SelectItem>
                  <SelectItem value="Trade Paperback">Trade Paperback</SelectItem>
                  <SelectItem value="Oversize">Oversize</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchase-price" className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Purchase Price <span style={{ color: 'var(--gold-accent)' }}>*</span>
            </Label>
            <div className="relative">
              {!purchasePrice && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" 
                      style={{ color: 'var(--text-secondary)' }}>
                  $
                </span>
              )}
              <Input
                id="purchase-price"
                type="number"
                step="0.01"
                min="0"
                placeholder={purchasePrice ? "" : "0.00"}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className={`text-lg ${purchasePrice ? 'pl-3' : 'pl-8'}`}
                style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}
                required
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchase-date" className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Purchase Date <span style={{ color: 'var(--gold-accent)' }}>*</span>
            </Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="text-lg"
              style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}
              required
            />
          </div>

          {/* Purchase Location - Simplified Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Purchase Location
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="text-lg" style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}>
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
                <SelectItem value="Garage Sale">Garage Sale</SelectItem>
                <SelectItem value="Estate Sale">Estate Sale</SelectItem>
                <SelectItem value="Thrift Store">Thrift Store</SelectItem>
                <SelectItem value="Online Retailer">Online Retailer</SelectItem>
                <SelectItem value="Local Retailer">Local Retailer</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition + Notes - Grouped together */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Condition <span style={{ color: 'var(--gold-accent)' }}>*</span>
            </Label>
            <Select value={condition} onValueChange={setCondition} required>
              <SelectTrigger className="text-lg" style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}>
                <SelectValue placeholder="Select condition..." />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
                <SelectItem value="Brand New">Brand New</SelectItem>
                <SelectItem value="Like New">Like New</SelectItem>
                <SelectItem value="Very Good">Very Good</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Acceptable">Acceptable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Condition details, inscriptions, damage notes, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="text-lg min-h-[80px]"
              style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}
              rows={3}
            />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {notes.length}/500 characters
            </p>
          </div>

          {/* Storage Location */}
          <div className="space-y-2">
            <Label htmlFor="storageLocation" className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Storage Location
            </Label>
            <Input
              id="storageLocation"
              type="text"
              placeholder="Shelf A, Box 1, etc."
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="text-lg"
              style={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-light)' }}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={addToInventoryMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold text-lg"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {addToInventoryMutation.isPending ? "Saving..." : "Save to Inventory"}
          </Button>
        </form>
      </div>
    </div>
  );
}
