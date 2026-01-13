export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Order = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
};
