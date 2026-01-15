"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, Ruler, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  COVERAGE_LIMITS,
  type CoverageCheckResult,
  type CoverageFailureReason,
} from "@/types/address";

interface CoverageStatusProps {
  result: CoverageCheckResult;
  className?: string;
}

const ERROR_TITLES: Record<CoverageFailureReason, string> = {
  DISTANCE_EXCEEDED: "Outside delivery area",
  DURATION_EXCEEDED: "Outside delivery area",
  GEOCODE_FAILED: "Unable to verify address",
  ROUTE_FAILED: "Route unavailable",
  INVALID_ADDRESS: "Invalid address",
};

const getErrorMessage = (
  reason: CoverageFailureReason | undefined,
  distanceMiles: number,
  durationMinutes: number
): string => {
  switch (reason) {
    case "DISTANCE_EXCEEDED":
      return `This address is ${distanceMiles} miles away. We deliver within ${COVERAGE_LIMITS.maxDistanceMiles} miles.`;
    case "DURATION_EXCEEDED":
      return `This address is ~${durationMinutes} minutes away. We deliver within ${COVERAGE_LIMITS.maxDurationMinutes} minutes drive time.`;
    case "INVALID_ADDRESS":
      return "Please enter a complete street address.";
    case "GEOCODE_FAILED":
      return "We could not verify this address. Please check and try again.";
    case "ROUTE_FAILED":
    default:
      return "We could not calculate a route to this address.";
  }
};

export function CoverageStatus({ result, className }: CoverageStatusProps) {
  const distanceMiles = result.distanceMiles ?? 0;
  const durationMinutes = result.durationMinutes ?? 0;

  if (result.isValid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm shadow-sm",
          className
        )}
      >
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
        <div>
          <p className="font-medium text-emerald-800">Delivery available!</p>
          <p className="text-emerald-700">
            {distanceMiles} miles · ~{durationMinutes} min drive
          </p>
        </div>
      </motion.div>
    );
  }

  const title = result.reason
    ? ERROR_TITLES[result.reason] ?? "Outside delivery area"
    : "Coverage unavailable";
  const message = getErrorMessage(result.reason, distanceMiles, durationMinutes);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-3 rounded-lg bg-rose-50 p-4 text-sm shadow-sm",
        className
      )}
    >
      <XCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
      <div className="flex-1">
        <p className="font-medium text-rose-800">{title}</p>
        <p className="mt-1 text-rose-700">{message}</p>
        {(distanceMiles || durationMinutes) > 0 && (
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-rose-600">
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" aria-hidden />
              {distanceMiles} mi
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              ~{durationMinutes} min
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
