import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-tertiary mb-6">
        <Package className="h-8 w-8 text-text-muted" />
      </div>
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2 text-center">
        Order not found
      </h1>
      <p className="text-text-secondary text-sm mb-6 text-center max-w-md">
        The order you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Link href="/admin/orders">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go back to orders
        </Button>
      </Link>
    </div>
  );
}
