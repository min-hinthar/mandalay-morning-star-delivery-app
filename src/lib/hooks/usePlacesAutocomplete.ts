"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

const LIBRARIES: ("places")[] = ["places"];

export function usePlacesAutocomplete(
  options: UsePlacesAutocompleteOptions = {}
) {
  const {
    debounceMs = 300,
    types = ["address"],
    componentRestrictions = { country: "us" },
  } = options;

  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedInput = useDebounce(input, debounceMs);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current =
        new google.maps.places.AutocompleteService();
      // PlacesService requires a DOM element
      const dummyDiv = document.createElement("div");
      placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  // Fetch predictions when debounced input changes
  useEffect(() => {
    if (
      !debouncedInput ||
      debouncedInput.length < 3 ||
      !autocompleteServiceRef.current
    ) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: debouncedInput,
        types,
        componentRestrictions,
        sessionToken: sessionTokenRef.current || undefined,
      },
      (results, status) => {
        setIsLoading(false);

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(
            results.map((r) => ({
              placeId: r.place_id,
              description: r.description,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text,
            }))
          );
        } else if (
          status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          setPredictions([]);
        } else {
          setError("Failed to fetch suggestions");
          setPredictions([]);
        }
      }
    );
  }, [debouncedInput, types, componentRestrictions]);

  // Get place details (including lat/lng)
  const getPlaceDetails = useCallback(
    (placeId: string): Promise<PlaceDetails | null> => {
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
            sessionTokenRef.current =
              new google.maps.places.AutocompleteSessionToken();

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
    },
    []
  );

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
