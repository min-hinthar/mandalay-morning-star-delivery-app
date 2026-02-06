/**
 * AddressInput Types
 */

import type { Address } from "@/types/address";

export interface AddressInputProps {
  /** List of saved addresses */
  savedAddresses?: Address[];
  /** Currently selected address */
  selectedAddress: Address | null;
  /** Callback when address is selected */
  onAddressSelect: (address: Address) => void;
  /** Callback when new address is added */
  onAddAddress?: (address: Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  /** Whether to show add new address form */
  showAddForm?: boolean;
  /** Additional className */
  className?: string;
}

export interface AddressAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
}
