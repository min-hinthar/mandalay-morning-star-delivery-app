import { LoadingWithTimeout } from "@/components/ui/LoadingWithTimeout";
import { OrderDetailSkeleton } from "@/components/ui/orders/OrderDetailSkeleton";

export default function OrderDetailPageLoading() {
  return <LoadingWithTimeout skeleton={<OrderDetailSkeleton />} timeoutMs={15000} />;
}
