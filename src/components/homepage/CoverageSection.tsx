"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLoadScript } from "@react-google-maps/api";
import { CheckCircle, XCircle, MapPin, Clock, Ruler, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";
import { PlacesAutocomplete } from "@/components/map/PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import {
  v6StaggerContainer,
  v6StaggerItem,
  v6ViewportOnce,
  v6FadeInUp,
} from "@/lib/motion";
import { COVERAGE_LIMITS } from "@/types/address";

// Dynamically import map to avoid SSR issues
const CoverageMap = dynamic(
  () => import("@/components/map/CoverageMap").then((mod) => mod.CoverageMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] md:h-[400px] bg-cream rounded-2xl animate-pulse flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    ),
  }
);

const libraries: ("places")[] = ["places"];

interface UserLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export function CoverageSection() {
  const shouldReduceMotion = useReducedMotion();
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();
  const [addressInput, setAddressInput] = useState("");
  const { mutate, data: coverageResult, isPending, reset } = useCoverageCheck();

  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(
    (place: { formattedAddress: string; lat: number; lng: number }) => {
      setUserLocation({
        lat: place.lat,
        lng: place.lng,
        formattedAddress: place.formattedAddress,
      });
      setAddressInput(place.formattedAddress);

      // Trigger coverage check
      reset();
      mutate({ lat: place.lat, lng: place.lng });
    },
    [mutate, reset]
  );

  // Handle manual form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!addressInput.trim()) return;

      reset();
      mutate({ address: addressInput.trim() });
    },
    [addressInput, mutate, reset]
  );

  // Clear results
  const handleClear = useCallback(() => {
    setUserLocation(undefined);
    setAddressInput("");
    reset();
  }, [reset]);

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-v6-surface-primary to-v6-surface-secondary/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={v6StaggerContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={v6ViewportOnce.viewport}
          className="text-center mb-12"
        >
          <motion.div variants={v6StaggerItem} className="inline-flex items-center gap-2 px-4 py-2 bg-v6-accent-teal/10 rounded-v6-pill mb-4">
            <MapPin className="w-4 h-4 text-v6-accent-teal" />
            <span className="text-sm font-v6-body font-medium text-v6-accent-teal">Delivery Coverage</span>
          </motion.div>

          <motion.h2
            variants={v6StaggerItem}
            className="font-v6-display text-3xl md:text-4xl lg:text-5xl font-bold text-v6-primary mb-4"
          >
            Check If We Deliver To You
          </motion.h2>

          <motion.p variants={v6StaggerItem} className="font-v6-body text-v6-text-secondary max-w-2xl mx-auto">
            We deliver within {COVERAGE_LIMITS.maxDistanceMiles} miles of our Covina kitchen every
            Saturday. Enter your address to see if you&apos;re in our delivery zone!
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Form */}
          <motion.div
            {...v6FadeInUp}
            initial={shouldReduceMotion ? undefined : v6FadeInUp.initial}
            whileInView={shouldReduceMotion ? undefined : v6FadeInUp.animate}
            viewport={v6ViewportOnce.viewport}
          >
            <div className="bg-v6-surface-primary rounded-v6-card p-6 md:p-8 shadow-v6-card border border-v6-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-v6-body font-medium text-v6-text-primary mb-2">
                    Your Delivery Address
                  </label>
                  {isLoaded ? (
                    <PlacesAutocomplete
                      onPlaceSelect={handlePlaceSelect}
                      value={addressInput}
                      onChange={setAddressInput}
                      placeholder="Start typing your address..."
                      disabled={isPending}
                    />
                  ) : (
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Enter your delivery address"
                      className="w-full px-4 py-4 rounded-v6-input border-2 border-v6-border bg-v6-surface-primary font-v6-body text-v6-text-primary placeholder:text-v6-text-muted focus:border-v6-primary focus:ring-2 focus:ring-v6-primary/20 outline-none transition-colors duration-v6-fast"
                      disabled={isPending}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!addressInput.trim()}
                    isLoading={isPending}
                    loadingText="Checking..."
                    className="flex-1 h-14"
                  >
                    Check Coverage
                  </Button>

                  {(coverageResult || userLocation) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="py-6 px-6"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>

              {/* Coverage Result */}
              {coverageResult && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="mt-6"
                >
                  {coverageResult.isValid ? (
                    <div className="p-6 rounded-v6-card-sm bg-v6-green/10 border-2 border-v6-green/30">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-v6-green/20 rounded-full">
                          <CheckCircle className="w-6 h-6 text-v6-green" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-v6-display text-xl text-v6-green font-semibold mb-2">
                            Great News! We Deliver Here
                          </h3>
                          <p className="font-v6-body text-v6-text-secondary text-sm mb-4">
                            {coverageResult.formattedAddress}
                          </p>

                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm font-v6-body">
                              <Ruler className="w-4 h-4 text-v6-green" />
                              <span className="font-medium text-v6-text-primary">
                                {coverageResult.distanceMiles.toFixed(1)} miles
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-v6-body">
                              <Clock className="w-4 h-4 text-v6-green" />
                              <span className="font-medium text-v6-text-primary">
                                ~{coverageResult.durationMinutes} min drive
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-v6-green/20">
                            <div className="flex items-center gap-2 text-v6-green">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm font-v6-body font-medium">
                                Free delivery on orders over $100!
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-v6-card-sm bg-v6-status-error/10 border-2 border-v6-status-error/30">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-v6-status-error/20 rounded-full">
                          <XCircle className="w-6 h-6 text-v6-status-error" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-v6-display text-xl text-v6-status-error font-semibold mb-2">
                            Outside Delivery Area
                          </h3>
                          <p className="font-v6-body text-v6-text-secondary text-sm mb-2">
                            {coverageResult.formattedAddress || "This address is outside our delivery zone."}
                          </p>
                          <p className="text-sm font-v6-body text-v6-status-error">
                            {coverageResult.reason === "DISTANCE_EXCEEDED" &&
                              `This location is ${coverageResult.distanceMiles.toFixed(1)} miles away (max ${COVERAGE_LIMITS.maxDistanceMiles} miles).`}
                            {coverageResult.reason === "DURATION_EXCEEDED" &&
                              `The drive time is ${coverageResult.durationMinutes} minutes (max ${COVERAGE_LIMITS.maxDurationMinutes} minutes).`}
                            {coverageResult.reason === "GEOCODE_FAILED" &&
                              "We couldn't find this address. Please try a different address."}
                            {coverageResult.reason === "INVALID_ADDRESS" &&
                              "Please enter a valid street address."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 rounded-v6-card-sm bg-v6-accent-teal/5 border border-v6-accent-teal/20">
                <p className="text-sm font-v6-body text-v6-text-secondary">
                  <strong className="text-v6-accent-teal">Delivery Times:</strong> Every Saturday, 11am - 7pm PT.
                  Order by Friday 3pm to get delivery this Saturday!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Map */}
          <motion.div
            {...v6FadeInUp}
            initial={shouldReduceMotion ? undefined : v6FadeInUp.initial}
            whileInView={shouldReduceMotion ? undefined : v6FadeInUp.animate}
            viewport={v6ViewportOnce.viewport}
            className="h-[300px] md:h-[500px] lg:h-full lg:min-h-[500px]"
          >
            {isLoaded ? (
              <CoverageMap
                userLocation={
                  userLocation ||
                  (coverageResult?.lat && coverageResult?.lng
                    ? {
                        lat: coverageResult.lat,
                        lng: coverageResult.lng,
                        formattedAddress: coverageResult.formattedAddress || "",
                      }
                    : undefined)
                }
                routeInfo={
                  coverageResult
                    ? {
                        distanceMiles: coverageResult.distanceMiles,
                        durationMinutes: coverageResult.durationMinutes,
                      }
                    : undefined
                }
                showRoute={!!coverageResult?.isValid}
                className="w-full h-full min-h-[300px]"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] bg-v6-surface-secondary rounded-v6-card flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-v6-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-v6-body text-v6-text-muted">Loading map...</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default CoverageSection;
