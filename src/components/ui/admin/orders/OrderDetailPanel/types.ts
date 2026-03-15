import type { OrderDetail } from "../OrderDetailPage/types";

export type { DeliveryInfo } from "../OrderDetailPage/types";

export interface OrderDetailPanelProps {
  order: OrderDetail;
  /** Hide action buttons when embedded in route detail (Phase 100) */
  showActions?: boolean;
}
