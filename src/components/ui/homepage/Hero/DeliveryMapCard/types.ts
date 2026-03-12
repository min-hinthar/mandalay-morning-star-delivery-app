export interface SimulatedPin {
  id: string;
  lat: number;
  lng: number;
  areaName: string;
  deliveryDate: string;
  direction: string;
  delay: number;
}

export interface DeliveryMapCardProps {
  deliveriesThisMonth: number;
  nextDeliveryDate: string;
  deliverySchedule?: string;
}
