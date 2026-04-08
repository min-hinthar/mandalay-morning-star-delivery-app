import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address, AddressFormData } from "@/types/address";
import { queryKeys } from "@/lib/queryKeys";

interface AddressListResponse {
  data: Address[];
}

interface AddressResponse {
  data: Address;
}

/**
 * Phase 111 CHKP-03 D-22..D-26 — Canonical fetch function for /api/addresses.
 *
 * Exported as a named function so Plan 04's step-prefetch in CheckoutClient
 * can call queryClient.prefetchQuery({ queryKey: queryKeys.addresses.list(),
 * queryFn: addressesQueryFn }) using the SAME fetch implementation that
 * useAddresses() uses. Without this export, the prefetch would need a
 * duplicate inline queryFn that could drift from this hook's error handling
 * / response shape (AddressListResponse wrapper preserved 1:1).
 *
 * Mirrors Plan 03's `menuQueryFn` pattern from `useMenu.ts`.
 */
export const addressesQueryFn = async (): Promise<AddressListResponse> => {
  const res = await fetch("/api/addresses");
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error?.message ?? "Failed to fetch addresses");
  }
  return res.json();
};

export function useAddresses() {
  return useQuery<AddressListResponse>({
    queryKey: queryKeys.addresses.list(),
    queryFn: addressesQueryFn,
  });
}

export function useAddress(id: string) {
  return useQuery<AddressResponse>({
    queryKey: queryKeys.addresses.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/addresses/${id}`);
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error?.message ?? "Failed to fetch address");
      }
      return res.json();
    },
    enabled: Boolean(id),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddressFormData) => {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw payload;
      }
      return payload as AddressResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormData }) => {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw payload;
      }
      return payload as AddressResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw payload;
      }
      return payload as { data: { success: boolean } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) {
        throw payload;
      }
      return payload as AddressResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}
