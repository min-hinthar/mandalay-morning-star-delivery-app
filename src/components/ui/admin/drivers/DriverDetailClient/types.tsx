import { Car, Bike, Truck } from "lucide-react";
import type { VehicleType } from "@/types/driver";

export interface DriverDetail {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  licensePlate: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  onboardingCompletedAt: string | null;
  ratingAvg: number;
  deliveriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  van: "Van",
  truck: "Truck",
};

export function VehicleIcon({ type }: { type: VehicleType | null }) {
  switch (type) {
    case "car":
      return <Car className="h-4 w-4" />;
    case "motorcycle":
    case "bicycle":
      return <Bike className="h-4 w-4" />;
    case "van":
    case "truck":
      return <Truck className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4 text-text-muted" />;
  }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface EditFormState {
  fullName: string;
  phone: string;
  vehicleType: VehicleType | "";
  licensePlate: string;
}
