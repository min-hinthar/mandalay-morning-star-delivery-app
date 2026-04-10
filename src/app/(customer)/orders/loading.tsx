import { LoadingWithTimeout } from "@/components/ui/LoadingWithTimeout";
import { OrdersListSkeleton } from "@/components/ui/orders/OrdersListSkeleton";

export default function OrdersPageLoading() {
  return <LoadingWithTimeout skeleton={<OrdersListSkeleton />} timeoutMs={15000} />;
}
