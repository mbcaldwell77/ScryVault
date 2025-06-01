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

interface AddInventoryProps {
  isbn: string;
}

export default function AddInventory({ isbn }: AddInventoryProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getSuggestions, addLocation } = useLocationAutocomplete();
  const [lastCondition, setLastCondition] = useLocalStorage("last-condition", "");
  const [lastFormat, setLastFormat] = useLocalStorage("last-format", "Other");
  
  const [purchasePrice, setPurchasePrice] = useState("");
  const [condition, setCondition] = useState(lastCondition);
  const [format, setFormat] = useState(lastFormat);
  const [location, setLocationField] = useState("");
  const [notes, setNotes] = useState("");
  const [classification, setClassification] = useState("COGS");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const { data: bookData } = useQuery({
    queryKey: [`/api/book-lookup/${isbn}`],
  });

  // Handle location autocomplete
  useEffect(() => {
    const suggestions = getSuggestions(location);
    setLocationSuggestions(suggestions);
  }, [location, getSuggestions]);

  const handleLocationFocus = () => {
    setShowLocationSuggestions(true);
    const suggestions = getSuggestions(location);
    setLocationSuggestions(suggestions);
  };

  const handleLocationBlur = () => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => setShowLocationSuggestions(false), 200);
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setLocationField(suggestion);
    setShowLocationSuggestions(false);
    locationInputRef.current?.focus();
  };

  const addToInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/books", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success!",
        description: "Book added to inventory successfully",
      });
      setLocation("/inventory");
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
    if (location.trim()) {
      addLocation(location.trim());
    }

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
      format,
      location: location || null,
      type: classification,
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
    <div className="flex-1 flex flex-col pb-24 min-h-screen">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setLocation(`/book-details/${isbn}`)}
          className="text-white hover:bg-green-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-semibold">Add to Inventory</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Book Summary */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-16 bg-slate-300 rounded flex items-center justify-center">
              {(bookData as any)?.imageUrl ? (
                <img 
                  src={(bookData as any).imageUrl} 
                  alt="Book cover" 
                  className="w-12 h-16 object-cover rounded"
                />
              ) : (
                <span className="text-slate-500">📚</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 truncate">
                {(bookData as any)?.title || "Loading..."}
              </h3>
              <p className="text-sm text-slate-600 truncate">
                {(bookData as any)?.author || "Loading..."}
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchase-price" className="text-sm font-medium text-slate-700">
              Purchase Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              <Input
                id="purchase-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="pl-8 text-lg"
                required
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchase-date" className="text-sm font-medium text-slate-700">
              Purchase Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="text-lg"
              required
            />
          </div>



          {/* Condition */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Condition <span className="text-red-500">*</span>
            </Label>
            <Select value={condition} onValueChange={setCondition} required>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Select condition..." />
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

          {/* Book Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Book Format <span className="text-red-500">*</span>
            </Label>
            <Select value={format} onValueChange={setFormat} required>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Select format..." />
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Condition details, inscriptions, damage notes, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="text-lg min-h-[80px]"
              rows={3}
            />
            <p className="text-xs text-slate-500">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-slate-700">
              Purchase Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="Estate sale, thrift store, etc."
              value={location}
              onChange={(e) => setLocationField(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Type Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Classification</Label>
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setClassification("COGS")}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  classification === "COGS" 
                    ? "bg-green-600 text-white shadow-sm" 
                    : "text-slate-600 hover:bg-slate-200 bg-transparent"
                }`}
              >
                COGS
              </button>
              <button
                type="button"
                onClick={() => setClassification("Expense")}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  classification === "Expense" 
                    ? "bg-green-600 text-white shadow-sm" 
                    : "text-slate-600 hover:bg-slate-200 bg-transparent"
                }`}
              >
                Expense
              </button>
            </div>
            <p className="text-xs text-slate-600">
              COGS for resale inventory, Expense for reference/research books
            </p>
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
