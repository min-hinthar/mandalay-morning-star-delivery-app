import type { Address } from "@/types/address";
import type { Database } from "@/types/database";
import type { DeliveryZoneConfig } from "@/types/delivery";
import { getDirectionsForCoords, DEFAULT_ZONES } from "@/lib/utils/delivery-zones";

export type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

const LONG_DISTANCE_THRESHOLD_MILES = 25;

export function transformAddress(row: AddressRow, deliveryZones?: DeliveryZoneConfig[]): Address {
  const distanceMiles = (row as Record<string, unknown>).distance_miles as number | null;
  const lat = row.lat ?? 0;
  const lng = row.lng ?? 0;
  const zones = deliveryZones ?? DEFAULT_ZONES;

  let directions: string[] | undefined;
  let feeTier: "standard" | "extended" | undefined;

  if (lat && lng && zones.length > 0) {
    directions = getDirectionsForCoords(lat, lng, zones);

    if (distanceMiles != null) {
      feeTier = distanceMiles > LONG_DISTANCE_THRESHOLD_MILES ? "extended" : "standard";
    }
  }

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
    lat,
    lng,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    distanceMiles,
    directions,
    feeTier,
  };
}
