import { LoadingWithTimeout } from "@/components/ui/LoadingWithTimeout";
import { AccountSkeleton } from "@/components/ui/account/AccountSkeleton";

export default function AccountLoading() {
  return <LoadingWithTimeout skeleton={<AccountSkeleton />} timeoutMs={15000} />;
}
