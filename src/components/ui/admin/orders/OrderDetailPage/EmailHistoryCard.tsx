"use client";

import { useState, useCallback, useRef } from "react";
import { Mail, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailHistory } from "@/app/(admin)/admin/orders/[id]/EmailHistory";
import { CollapsibleCard } from "./CollapsibleCard";
import { ManualEmailDialog } from "./ManualEmailDialog";

// ===========================================
// TYPES
// ===========================================

interface EmailHistoryCardProps {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  orderSummary: string;
}

// ===========================================
// COMPONENT
// ===========================================

export function EmailHistoryCard({
  orderId,
  orderNumber,
  customerEmail,
  orderSummary,
}: EmailHistoryCardProps) {
  const [composeOpen, setComposeOpen] = useState(false);
  const refreshKeyRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSent = useCallback(() => {
    refreshKeyRef.current += 1;
    setRefreshKey(refreshKeyRef.current);
  }, []);

  return (
    <>
      <CollapsibleCard
        title="Email History"
        icon={<Mail className="h-4 w-4" />}
        defaultOpen={false}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComposeOpen(true)}
            className="text-xs"
          >
            <PenLine className="h-3.5 w-3.5 mr-1" />
            Compose
          </Button>
        }
      >
        <EmailHistory key={refreshKey} orderId={orderId} />
      </CollapsibleCard>

      <ManualEmailDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        customerEmail={customerEmail}
        orderSummary={orderSummary}
        onSent={handleSent}
      />
    </>
  );
}
