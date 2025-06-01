import { useState, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

const COMMON_LOCATIONS = [
  "Estate Sale",
  "Thrift Store", 
  "Garage Sale",
  "Online",
  "Book Fair",
  "Library Sale",
  "Flea Market",
  "Antique Store",
  "Consignment Shop",
  "Yard Sale"
];

export function useLocationAutocomplete() {
  const [recentLocations, setRecentLocations] = useLocalStorage<string[]>("recent-locations", []);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const addLocation = (location: string) => {
    if (!location.trim()) return;
    
    const trimmedLocation = location.trim();
    const updated = [trimmedLocation, ...recentLocations.filter(l => l !== trimmedLocation)].slice(0, 10);
    setRecentLocations(updated);
  };

  const getSuggestions = (input: string): string[] => {
    if (!input.trim()) {
      // Show recent locations first, then common presets
      const combined = [...recentLocations, ...COMMON_LOCATIONS.filter(loc => !recentLocations.includes(loc))];
      return combined.slice(0, 8);
    }

    const query = input.toLowerCase();
    const allLocations = [...recentLocations, ...COMMON_LOCATIONS];
    
    return allLocations
      .filter(location => location.toLowerCase().includes(query))
      .slice(0, 6);
  };

  return {
    getSuggestions,
    addLocation,
    recentLocations
  };
}