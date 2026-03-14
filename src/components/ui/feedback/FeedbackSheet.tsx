"use client";

import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useFeedbackStore } from "./feedback-store";
import { FeedbackForm } from "./FeedbackForm";

/**
 * Responsive feedback sheet.
 * Bottom Drawer on mobile (<640px), centered Modal on desktop.
 */
export function FeedbackSheet() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { isOpen, close, prefillOrderId, prefillCategory } = useFeedbackStore();

  const formContent = (
    <FeedbackForm
      onClose={close}
      prefillOrderId={prefillOrderId}
      prefillCategory={prefillCategory}
    />
  );

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} onClose={close} position="bottom" height="full">
        {formContent}
      </Drawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Send Feedback" size="lg">
      {formContent}
    </Modal>
  );
}
