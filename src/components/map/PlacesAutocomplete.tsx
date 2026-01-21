"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, X, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: {
    formattedAddress: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function PlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Enter your delivery address",
  disabled = false,
  className = "",
  value: externalValue,
  onChange: externalOnChange,
}: PlacesAutocompleteProps) {
  const [internalValue, setInternalValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Use external value if provided, otherwise use internal state
  const value = externalValue !== undefined ? externalValue : internalValue;
  const setValue = externalOnChange || setInternalValue;

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (typeof google !== "undefined" && google.maps && google.maps.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      // Create a dummy element for PlacesService
      const dummyElement = document.createElement("div");
      placesServiceRef.current = new google.maps.places.PlacesService(dummyElement);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionTokenRef.current = new (google.maps.places as any).AutocompleteSessionToken();
    }
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        sessionToken: sessionTokenRef.current || undefined,
        componentRestrictions: { country: "us" },
        // Bias towards Southern California
        location: new google.maps.LatLng(34.0858, -117.8896),
        radius: 150000, // 150km radius
        types: ["address"],
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(
              predictions.slice(0, 5).map((p) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting.main_text,
                secondaryText: p.structured_formatting.secondary_text,
              }))
            );
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch {
      setIsLoading(false);
      setSuggestions([]);
    }
  }, []);

  // Debounced input handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setSelectedIndex(-1);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    },
    [setValue, fetchSuggestions]
  );

  // Handle suggestion selection
  const handleSelect = useCallback(
    (suggestion: Suggestion) => {
      if (!placesServiceRef.current) return;

      setIsLoading(true);

      placesServiceRef.current.getDetails(
        {
          placeId: suggestion.placeId,
          fields: ["formatted_address", "geometry"],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (place, status) => {
          setIsLoading(false);
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place &&
            place.geometry?.location
          ) {
            const formattedAddress = place.formatted_address || suggestion.description;
            setValue(formattedAddress);
            setSuggestions([]);
            setIsFocused(false);

            onPlaceSelect({
              formattedAddress,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });

            // Create new session token for next search
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionTokenRef.current = new (google.maps.places as any).AutocompleteSessionToken();
          }
        }
      );
    },
    [setValue, onPlaceSelect]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setSuggestions([]);
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    },
    [suggestions, selectedIndex, handleSelect]
  );

  // Clear input
  const handleClear = useCallback(() => {
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  }, [setValue]);

  return (
    <div className={cn("relative", className)}>
      {/* Input Container */}
      <div
        className={cn(
          "relative flex items-center rounded-xl border-2 transition-all duration-200",
          isFocused
            ? "border-gold shadow-glow-gold bg-white"
            : "border-border bg-white/80 hover:border-gold/50",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="pl-4">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on suggestions
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-4 bg-transparent outline-none text-foreground placeholder:text-muted-foreground",
            "font-body text-base"
          )}
          autoComplete="off"
        />

        {/* Loading / Clear buttons */}
        <div className="pr-3 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-gold animate-spin" />
          )}
          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-[var(--z-dropdown)] mt-2 bg-[var(--color-surface-primary)] border border-border rounded-xl shadow-elevated overflow-hidden"
          >
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={suggestion.placeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 transition-colors text-left",
                      selectedIndex === index
                        ? "bg-gold/10"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <MapPin
                      className={cn(
                        "w-5 h-5 mt-0.5 flex-shrink-0",
                        selectedIndex === index
                          ? "text-gold"
                          : "text-muted-foreground"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-medium truncate",
                          selectedIndex === index
                            ? "text-brand-red"
                            : "text-foreground"
                        )}
                      >
                        {suggestion.mainText}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {suggestion.secondaryText}
                      </p>
                    </div>
                  </button>
                </motion.li>
              ))}
            </ul>

            {/* Powered by Google attribution */}
            <div className="px-4 py-2 border-t border-border/50 flex justify-end">
              <span className="text-xs text-muted-foreground">
                Powered by Google
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlacesAutocomplete;
