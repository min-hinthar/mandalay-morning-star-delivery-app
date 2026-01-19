"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLoadScript } from "@react-google-maps/api";
import { CheckCircle, XCircle, MapPin, Clock, Ruler, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";
import { PlacesAutocomplete } from "@/components/map/PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, scrollReveal, viewportSettings } from "@/lib/animations/variants";
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
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background to-cream/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={viewportSettings}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-interactive/10 rounded-full mb-4">
            <MapPin className="w-4 h-4 text-interactive" />
            <span className="text-sm font-medium text-interactive">Delivery Coverage</span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl text-accent-tertiary mb-4"
          >
            Check If We Deliver To You
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
            We deliver within {COVERAGE_LIMITS.maxDistanceMiles} miles of our Covina kitchen every
            Saturday. Enter your address to see if you&apos;re in our delivery zone!
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Form */}
          <motion.div
            variants={scrollReveal}
            initial={shouldReduceMotion ? undefined : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={viewportSettings}
          >
            <div className="glass rounded-2xl p-6 md:p-8 shadow-premium">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
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
                      className="w-full px-4 py-4 rounded-xl border-2 border-border bg-white focus:border-interactive focus:ring-0 outline-none transition-colors"
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
                      className="py-6 px-6 rounded-xl"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>

              {/* Coverage Result */}
              {coverageResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  {coverageResult.isValid ? (
                    <div className="p-6 rounded-xl bg-accent-secondary/10 border-2 border-accent-secondary/30">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-accent-secondary/20 rounded-full">
                          <CheckCircle className="w-6 h-6 text-accent-secondary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-xl text-accent-secondary font-semibold mb-2">
                            Great News! We Deliver Here
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            {coverageResult.formattedAddress}
                          </p>

                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Ruler className="w-4 h-4 text-accent-secondary" />
                              <span className="font-medium">
                                {coverageResult.distanceMiles.toFixed(1)} miles
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-accent-secondary" />
                              <span className="font-medium">
                                ~{coverageResult.durationMinutes} min drive
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-accent-secondary/20">
                            <div className="flex items-center gap-2 text-accent-secondary">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Free delivery on orders over $100!
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-red-50 border-2 border-red-200">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-full">
                          <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-xl text-red-600 font-semibold mb-2">
                            Outside Delivery Area
                          </h3>
                          <p className="text-muted-foreground text-sm mb-2">
                            {coverageResult.formattedAddress || "This address is outside our delivery zone."}
                          </p>
                          <p className="text-sm text-red-500">
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
              <div className="mt-6 p-4 rounded-xl bg-interactive/5 border border-interactive/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-interactive">Delivery Times:</strong> Every Saturday, 11am - 7pm PT.
                  Order by Friday 3pm to get delivery this Saturday!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Map */}
          <motion.div
            variants={scrollReveal}
            initial={shouldReduceMotion ? undefined : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={viewportSettings}
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
              <div className="w-full h-full min-h-[300px] bg-cream rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-interactive border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading map...</p>
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
