"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useDebounce } from "./useDebounce";

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface UsePlacesAutocompleteOptions {
  debounceMs?: number;
  types?: string[];
  componentRestrictions?: { country: string | string[] };
}

// Must match libraries in CoverageRouteMap to avoid loader conflicts
const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

// Default values (stable references)
const DEFAULT_TYPES = ["address"];
const DEFAULT_RESTRICTIONS = { country: "us" };

/**
 * Custom hook for Google Places Autocomplete using the new Places API
 * Uses google.maps.places.AutocompleteSuggestion and google.maps.places.Place
 * when available, falling back to legacy APIs for compatibility.
 */
export function usePlacesAutocomplete(
  options: UsePlacesAutocompleteOptions = {}
) {
  const {
    debounceMs = 300,
    types = DEFAULT_TYPES,
    componentRestrictions = DEFAULT_RESTRICTIONS,
  } = options;

  // Memoize options to prevent infinite loops from object reference changes
  const country = useMemo(() => {
    const c = componentRestrictions.country;
    return Array.isArray(c) ? c.join(",") : c;
  }, [componentRestrictions.country]);

  // Memoize componentRestrictions for legacy API
  const stableRestrictions = useMemo(() => ({
    country: componentRestrictions.country
  }), [componentRestrictions.country]);

  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mount state to prevent setState on unmounted component
  const isMountedRef = useRef(true);

  const debouncedInput = useDebounce(input, debounceMs);

  // Session token for billing optimization
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Flag to track if new API is available
  const useNewApiRef = useRef<boolean | null>(null);

  // Legacy services (fallback)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded) return;

    // Check if new API is available
    const hasNewApi = typeof google.maps.places.AutocompleteSuggestion?.fetchAutocompleteSuggestions === "function";
    useNewApiRef.current = hasNewApi;

    // Always create session token (works for both APIs)
    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

    // Initialize legacy services as fallback
    if (!hasNewApi) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
    }
  }, [isLoaded]);

  // Track mount state for async cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch predictions using new API
  const fetchPredictionsNew = useCallback(async (searchInput: string): Promise<PlacePrediction[] | null> => {
    try {
      const request: google.maps.places.AutocompleteRequest = {
        input: searchInput,
        sessionToken: sessionTokenRef.current || undefined,
        includedPrimaryTypes: types.includes("address") ? ["street_address", "route", "premise"] : types,
        includedRegionCodes: country.split(","),
      };

      const response = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (response?.suggestions) {
        return response.suggestions
          .filter((s): s is google.maps.places.AutocompleteSuggestion & { placePrediction: google.maps.places.PlacePrediction } =>
            s.placePrediction !== null && s.placePrediction.mainText !== null
          )
          .map((suggestion) => ({
            placeId: suggestion.placePrediction.placeId,
            description: suggestion.placePrediction.text.text,
            mainText: suggestion.placePrediction.mainText!.text,
            secondaryText: suggestion.placePrediction.secondaryText?.text || "",
          }));
      }
      return [];
    } catch {
      return null; // Return null to trigger fallback
    }
  }, [types, country]);

  // Fetch predictions using legacy API (fallback)
  const fetchPredictionsLegacy = useCallback((searchInput: string): Promise<PlacePrediction[]> => {
    return new Promise((resolve) => {
      if (!autocompleteServiceRef.current) {
        resolve([]);
        return;
      }

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchInput,
          types,
          componentRestrictions: stableRestrictions,
          sessionToken: sessionTokenRef.current || undefined,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(
              results.map((r) => ({
                placeId: r.place_id,
                description: r.description,
                mainText: r.structured_formatting.main_text,
                secondaryText: r.structured_formatting.secondary_text,
              }))
            );
          } else {
            resolve([]);
          }
        }
      );
    });
  }, [types, stableRestrictions]);

  // Fetch predictions when debounced input changes
  useEffect(() => {
    if (!debouncedInput || debouncedInput.length < 3 || !isLoaded) {
      setPredictions([]);
      return;
    }

    // Don't fetch if API not ready
    if (useNewApiRef.current === null) return;

    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        let results: PlacePrediction[] | null = null;

        // Try new API first if available
        if (useNewApiRef.current) {
          results = await fetchPredictionsNew(debouncedInput);
        }

        // Fallback to legacy API
        if (results === null) {
          results = await fetchPredictionsLegacy(debouncedInput);
        }

        // Only update state if still mounted (prevents setState on unmounted component)
        if (isMountedRef.current) {
          setPredictions(results);
        }
      } catch {
        if (isMountedRef.current) {
          setError("Failed to fetch suggestions");
          setPredictions([]);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [debouncedInput, isLoaded, fetchPredictionsNew, fetchPredictionsLegacy]);

  // Get place details using new API
  const getPlaceDetailsNew = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const place = new google.maps.places.Place({
        id: placeId,
        requestedLanguage: "en",
      });

      await place.fetchFields({
        fields: ["location", "formattedAddress"],
      });

      // Reset session token after fetch (ends billing session)
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

      if (place.location) {
        return {
          lat: place.location.lat(),
          lng: place.location.lng(),
          formattedAddress: place.formattedAddress || "",
        };
      }
      return null;
    } catch {
      return null; // Return null to trigger fallback
    }
  }, []);

  // Get place details using legacy API (fallback)
  const getPlaceDetailsLegacy = useCallback((placeId: string): Promise<PlaceDetails | null> => {
    return new Promise((resolve) => {
      if (!placesServiceRef.current) {
        resolve(null);
        return;
      }

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ["geometry", "formatted_address"],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (place, status) => {
          // Reset session token after getDetails (ends billing session)
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            resolve({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              formattedAddress: place.formatted_address || "",
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }, []);

  // Combined getPlaceDetails that tries new API first
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    // Try new API first if available
    if (useNewApiRef.current) {
      const result = await getPlaceDetailsNew(placeId);
      if (result) return result;
    }

    // Fallback to legacy API
    return getPlaceDetailsLegacy(placeId);
  }, [getPlaceDetailsNew, getPlaceDetailsLegacy]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  const clearInput = useCallback(() => {
    setInput("");
    setPredictions([]);
    setError(null);
  }, []);

  return {
    input,
    setInput,
    predictions,
    isLoading,
    error,
    isReady: isLoaded,
    getPlaceDetails,
    clearPredictions,
    clearInput,
  };
}
