"use client";

import { useState, useEffect, useRef } from "react";
import type { SimulatedPin } from "./types";

const CITY_COORDINATES = [
  { name: "Pasadena", lat: 34.1478, lng: -118.1445 },
  { name: "Arcadia", lat: 34.1397, lng: -118.0353 },
  { name: "Glendora", lat: 34.1361, lng: -117.8653 },
  { name: "West Covina", lat: 34.0686, lng: -117.939 },
  { name: "Diamond Bar", lat: 33.9997, lng: -117.8103 },
  { name: "Azusa", lat: 34.1336, lng: -117.9076 },
  { name: "Pomona", lat: 34.0551, lng: -117.75 },
  { name: "Monrovia", lat: 34.1442, lng: -117.9901 },
  { name: "El Monte", lat: 34.0686, lng: -118.0276 },
  { name: "Whittier", lat: 33.9792, lng: -118.0328 },
  { name: "Rowland Heights", lat: 33.9761, lng: -117.9053 },
  { name: "Walnut", lat: 34.0203, lng: -117.8653 },
  { name: "San Dimas", lat: 34.1067, lng: -117.8067 },
  { name: "Rancho Cucamonga", lat: 34.1064, lng: -117.5931 },
  { name: "Fullerton", lat: 33.8703, lng: -117.9253 },
] as const;

const DELIVERY_DAYS = ["Mon", "Wed", "Thu", "Sat"] as const;

const MAX_PINS = 15;
const INITIAL_PINS = 10;
const CYCLE_INTERVAL_MS = 7000;

function createPin(index: number): SimulatedPin {
  const city = CITY_COORDINATES[index % CITY_COORDINATES.length];
  const day = DELIVERY_DAYS[index % DELIVERY_DAYS.length];
  return {
    id: `pin-${Date.now()}-${index}`,
    lat: city.lat,
    lng: city.lng,
    areaName: city.name,
    deliveryDate: `${day} delivery`,
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
