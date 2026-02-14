"use client";

import { Mail } from "lucide-react";
import { EmailHistory } from "@/app/(admin)/admin/orders/[id]/EmailHistory";
import { CollapsibleCard } from "./CollapsibleCard";

interface EmailHistoryCardProps {
  orderId: string;
}

export function EmailHistoryCard({ orderId }: EmailHistoryCardProps) {
  return (
    <CollapsibleCard
      title="Email History"
      icon={<Mail className="h-4 w-4" />}
      defaultOpen={false}
    >
      <EmailHistory orderId={orderId} />
    </CollapsibleCard>
  );
}
