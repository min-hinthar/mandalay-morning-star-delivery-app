"use client";

import { useState, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadMenuPhotoViaServer } from "@/lib/supabase/storage";
import { toast } from "@/lib/hooks/useToastV8";

interface MatchableMenuItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
}

interface MatchedFile {
  file: File;
  slug: string;
  menuItem: MatchableMenuItem | null;
  willReplace: boolean;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface BulkUploadMatcherProps {
  files: File[];
  menuItems: MatchableMenuItem[];
  onComplete: () => void;
  onCancel: () => void;
}

function slugify(filename: string): string {
  const ext = filename.lastIndexOf(".");
  const name = ext > 0 ? filename.slice(0, ext) : filename;
  return name.replace(/\s+/g, "-").toLowerCase();
}

export function BulkUploadMatcher({
  files,
  menuItems,
  onComplete,
  onCancel,
}: BulkUploadMatcherProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [matchedFiles, setMatchedFiles] = useState<MatchedFile[]>(() =>
    files.map((file) => {
      const slug = slugify(file.name);
      const menuItem = menuItems.find((item) => item.slug === slug) || null;
      return {
        file,
        slug,
        menuItem,
        willReplace: menuItem !== null && menuItem.imageUrl !== null,
        status: "pending",
      };
    })
  );

  const summary = useMemo(() => {
    const matched = matchedFiles.filter((f) => f.menuItem !== null);
    const unmatched = matchedFiles.filter((f) => f.menuItem === null);
    const replacing = matchedFiles.filter((f) => f.willReplace);
    return {
      matched: matched.length,
      unmatched: unmatched.length,
      replacing: replacing.length,
      total: matchedFiles.length,
    };
  }, [matchedFiles]);

  const handleUploadAll = useCallback(async () => {
    setUploading(true);
    setUploadProgress(0);

    let completed = 0;

    for (let i = 0; i < matchedFiles.length; i++) {
      const entry = matchedFiles[i];

      // Mark as uploading
      setMatchedFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
      );

      try {
        const result = await uploadMenuPhotoViaServer(entry.file, entry.menuItem?.id);

        // If matched, update the menu item's image_url via PATCH
        if (entry.menuItem) {
          const patchRes = await fetch(`/api/admin/menu/${entry.menuItem.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: result.publicUrl }),
          });
          if (!patchRes.ok) {
            const errData = await patchRes.json();
            throw new Error(errData.error || "Failed to assign photo");
          }
        }

        setMatchedFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success" } : f))
        );
        completed++;
      } catch (err) {
        setMatchedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : f
          )
        );
      }

      setUploadProgress(i + 1);
    }

    setUploading(false);

    if (completed === matchedFiles.length) {
      toast({ message: `All ${completed} photos uploaded`, type: "success" });
    } else {
      toast({
        message: `${completed}/${matchedFiles.length} photos uploaded`,
        type: completed > 0 ? "success" : "error",
      });
    }

    onComplete();
  }, [matchedFiles, onComplete]);

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50 p-4"
    >
      <m.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-surface-primary rounded-card-sm border border-border shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-text-primary text-lg">Bulk Upload</h2>
              <p className="font-body text-sm text-text-secondary">
                {summary.total} files selected
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={uploading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary Badges */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-border bg-surface-secondary">
          <Badge className="bg-green/10 text-green border-green/30">
            {summary.matched} matched
          </Badge>
          <Badge className="bg-yellow/10 text-yellow border-yellow/30">
            {summary.unmatched} unmatched
          </Badge>
          {summary.replacing > 0 && (
            <Badge className="bg-status-error/10 text-status-error border-status-error/30">
              {summary.replacing} will replace
            </Badge>
          )}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {matchedFiles.map((entry, index) => (
              <m.div
                key={`${entry.file.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-input",
                  "bg-surface-secondary border border-border"
                )}
              >
                {/* Thumbnail */}
                <div className="h-10 w-10 rounded-input bg-surface-tertiary overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(entry.file)}
                    alt={entry.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-text-primary truncate">
                    {entry.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.menuItem ? (
                      <span className="text-xs font-body text-green flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {entry.menuItem.name}
                        {entry.willReplace && (
                          <span className="text-status-error ml-1">(replace)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs font-body text-yellow flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Unmatched — will upload as unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {entry.status === "uploading" && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {entry.status === "success" && <CheckCircle className="h-5 w-5 text-green" />}
                  {entry.status === "error" && (
                    <AlertTriangle className="h-5 w-5 text-status-error" />
                  )}
                  {entry.status === "pending" && <ImageIcon className="h-5 w-5 text-text-muted" />}
                </div>
              </m.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-border bg-surface-secondary">
          {uploading ? (
            <div className="flex items-center gap-2 text-sm font-body text-text-secondary">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>
                {uploadProgress}/{matchedFiles.length} uploaded
              </span>
            </div>
          ) : (
            <p className="text-xs font-body text-text-muted">
              Photos auto-processed to WebP (4:3, 800x600)
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadAll}
              disabled={uploading}
              className="bg-primary hover:bg-primary-hover text-text-inverse"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload All
                </>
              )}
            </Button>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}
