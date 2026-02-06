export interface CreateRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRouteData) => Promise<void>;
}

export interface CreateRouteData {
  deliveryDate: string;
  driverId?: string;
  orderIds: string[];
}

export interface Driver {
  id: string;
  fullName: string | null;
  isActive: boolean;
}

export interface Order {
  id: string;
  totalCents: number;
  customerName: string | null;
  deliveryWindowStart: string | null;
  itemCount: number;
  status: string;
}

export interface FormErrors {
  deliveryDate?: string;
  orderIds?: string;
  general?: string;
}
