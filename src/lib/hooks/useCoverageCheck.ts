"use client";

import { useMutation } from "@tanstack/react-query";
import type {
  CoverageCheckRequest,
  CoverageCheckResult,
} from "@/types/address";

export function useCoverageCheck() {
  return useMutation<CoverageCheckResult, Error, CoverageCheckRequest>({
    mutationFn: async (params) => {
      const response = await fetch("/api/coverage/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Coverage check failed.");
      }

      if (!payload?.data) {
        throw new Error("Coverage check returned no data.");
      }

      return payload.data;
    },
  });
}
