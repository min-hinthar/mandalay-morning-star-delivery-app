import { Car, Bike, Truck } from "lucide-react";
import type { VehicleType } from "@/types/driver";

export interface AdminDriver {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  licensePlate: string | null;
  isActive: boolean;
  ratingAvg: number | null;
  deliveriesCount: number;
  createdAt: string;
}

export interface DriverListTableProps {
  drivers: AdminDriver[];
  onToggleActive: (driverId: string, isActive: boolean) => Promise<void>;
  onViewDriver: (driverId: string) => void;
  searchQuery: string;
}

export type SortField = "fullName" | "ratingAvg" | "deliveriesCount" | "createdAt";
export type SortDirection = "asc" | "desc";

export const VehicleIcon = ({ type }: { type: VehicleType | null }) => {
  switch (type) {
    case "car":
      return <Car className="h-4 w-4" />;
    case "motorcycle":
      return <Bike className="h-4 w-4" />;
    case "bicycle":
      return <Bike className="h-4 w-4" />;
    case "van":
    case "truck":
      return <Truck className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4 text-muted-foreground" />;
  }
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  van: "Van",
  truck: "Truck",
};
