"use client";

import { useState, useEffect, useRef } from "react";
import { calculateBearing, bearingInRange, DEFAULT_ZONES } from "@/lib/utils/delivery-zones";
import type { SimulatedPin } from "./types";

const CITY_COORDINATES = [
  // West LA / Coast
  { name: "Santa Monica", lat: 34.0195, lng: -118.4912 },
  { name: "Culver City", lat: 34.0211, lng: -118.3965 },
  { name: "Inglewood", lat: 33.9617, lng: -118.3531 },
  { name: "Long Beach", lat: 33.7701, lng: -118.1937 },
  { name: "Torrance", lat: 33.8358, lng: -118.3406 },
  // Central / Downtown LA
  { name: "Downtown LA", lat: 34.0407, lng: -118.2468 },
  { name: "Hollywood", lat: 34.0928, lng: -118.3287 },
  { name: "Koreatown", lat: 34.0578, lng: -118.3004 },
  // North / Valley
  { name: "Burbank", lat: 34.1808, lng: -118.309 },
  { name: "Glendale", lat: 34.1425, lng: -118.2551 },
  { name: "Pasadena", lat: 34.1478, lng: -118.1445 },
  // East (existing coverage area)
  { name: "West Covina", lat: 34.0686, lng: -117.939 },
  { name: "Pomona", lat: 34.0551, lng: -117.75 },
  { name: "Diamond Bar", lat: 33.9997, lng: -117.8103 },
  { name: "Rancho Cucamonga", lat: 34.1064, lng: -117.5931 },
  // South / Southeast
  { name: "Whittier", lat: 33.9792, lng: -118.0328 },
  { name: "Fullerton", lat: 33.8703, lng: -117.9253 },
  { name: "Anaheim", lat: 33.8366, lng: -117.9143 },
  { name: "Irvine", lat: 33.6846, lng: -117.8265 },
  { name: "Riverside", lat: 33.9533, lng: -117.3962 },
] as const;

/** Direction → eligible short day names */
const DIRECTION_DAYS: Record<string, readonly string[]> = {
  east: ["Mon", "Sat"],
  west: ["Wed", "Sat"],
  south: ["Thu", "Sat"],
};

/** Pre-compute direction for each city (pure math, no side effects) */
const CITY_DATA = CITY_COORDINATES.map((city) => {
  const bearing = calculateBearing(city.lat, city.lng);
  const zone = DEFAULT_ZONES.find((z) => bearingInRange(bearing, z.bearingStart, z.bearingEnd));
  const direction = zone?.direction ?? "east";
  const days = DIRECTION_DAYS[direction] ?? ["Sat"];
  return { ...city, direction, days };
});

const MAX_PINS = 20;
const INITIAL_PINS = 12;
const CYCLE_INTERVAL_MS = 7000;

function createPin(index: number): SimulatedPin {
  const city = CITY_DATA[index % CITY_DATA.length];
  const day = city.days[index % city.days.length];
  return {
    id: `pin-${Date.now()}-${index}`,
    lat: city.lat,
    lng: city.lng,
    areaName: city.name,
    deliveryDate: `${day} delivery`,
    direction: city.direction,
    delay: index * 200,
  };
}

export function useSimulatedPins() {
  const [pins, setPins] = useState<SimulatedPin[]>(() =>
    Array.from({ length: INITIAL_PINS }, (_, i) => createPin(i))
  );
  const counterRef = useRef(INITIAL_PINS);

  useEffect(() => {
    const interval = setInterval(() => {
      setPins((prev) => {
        const newPin = createPin(counterRef.current++);
        newPin.delay = 0; // No stagger for cycled pins
        if (prev.length >= MAX_PINS) {
          return [...prev.slice(1), newPin];
        }
        return [...prev, newPin];
      });
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return pins;
}
