import type { ProfileRole, ProfilesRow, AddressesRow, OrdersRow } from "@/types/database";
import type { RoutesRow, DriversRow, RouteStopsRow } from "@/types/driver";

export interface ProfileCheck {
  role: ProfileRole;
}

export interface RouteDetailRow extends RoutesRow {
  drivers:
    | (DriversRow & {
        profiles: Pick<ProfilesRow, "email" | "full_name" | "phone"> | null;
      })
    | null;
  route_stops: (RouteStopsRow & {
    orders:
      | (Pick<
          OrdersRow,
          | "id"
          | "status"
          | "total_cents"
          | "delivery_window_start"
          | "delivery_window_end"
          | "special_instructions"
        > & {
          addresses: Pick<
            AddressesRow,
            "id" | "label" | "line_1" | "line_2" | "city" | "state" | "postal_code" | "lat" | "lng"
          > | null;
          profiles: Pick<ProfilesRow, "id" | "full_name" | "phone" | "email"> | null;
          order_items: Array<{ quantity: number }>;
        })
      | null;
    delivery_exceptions: Array<{
      id: string;
      exception_type: string;
      description: string | null;
      photo_url: string | null;
      resolved_at: string | null;
    }>;
  })[];
}

export interface RouteParams {
  params: Promise<{ id: string }>;
}
