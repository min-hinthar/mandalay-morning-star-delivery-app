export interface AdminProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  authProvider: string;
  memberSince: string;
  createdAt: string;
}

export interface AdminStats {
  lastLoginAt: string | null;
  ordersProcessed: number;
}

export interface NotificationPrefs {
  orderConfirmation: boolean;
  orderCancellation: boolean;
  orderDelivered: boolean;
  newOrderAlert: boolean;
}
