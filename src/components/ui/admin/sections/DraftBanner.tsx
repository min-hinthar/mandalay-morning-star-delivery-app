"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/useToast";

interface DraftBannerProps {
  hasUnpublishedChanges: boolean;
  onPublishComplete?: () => void;
}

export function DraftBanner({
  hasUnpublishedChanges,
  onPublishComplete,
}: DraftBannerProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch("/api/admin/sections/publish", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to publish");
      }

      toast({
        title: "Published",
        description: "Your changes are now live on the homepage",
      });

      onPublishComplete?.();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to publish",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      {hasUnpublishedChanges && (
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-center justify-between gap-4 p-4 rounded-card-sm bg-secondary/10 border border-secondary/20"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-secondary/20 p-2">
              <AlertCircle className="h-4 w-4 text-secondary-hover" />
            </div>
            <div>
              <p className="font-body font-medium text-text-primary">
                You have unpublished changes
              </p>
              <p className="text-sm font-body text-text-secondary">
                Changes are saved but not visible on the homepage yet
              </p>
            </div>
          </div>

          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-secondary hover:bg-secondary-hover text-text-inverse shrink-0"
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
