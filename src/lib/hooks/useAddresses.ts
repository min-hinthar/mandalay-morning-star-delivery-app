import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address, AddressFormData } from "@/types/address";

interface AddressListResponse {
  data: Address[];
}

interface AddressResponse {
  data: Address;
}

export function useAddresses() {
  return useQuery<AddressListResponse>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await fetch("/api/addresses");
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error?.message ?? "Failed to fetch addresses");
      }
      return res.json();
    },
  });
}

export function useAddress(id: string) {
  return useQuery<AddressResponse>({
    queryKey: ["addresses", id],
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
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: AddressFormData;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
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
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
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
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
