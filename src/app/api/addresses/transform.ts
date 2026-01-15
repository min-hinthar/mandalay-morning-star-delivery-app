import type { Address } from "@/types/address";
import type { Database } from "@/types/database";

export type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export function transformAddress(row: AddressRow): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    line1: row.line_1,
    line2: row.line_2 ?? null,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    formattedAddress: row.formatted_address ?? row.line_1,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
