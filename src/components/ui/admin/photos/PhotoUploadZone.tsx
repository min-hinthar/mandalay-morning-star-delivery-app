"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { validateFile, uploadMenuPhoto, type UploadResult } from "@/lib/supabase/storage";

interface UploadingFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  result?: UploadResult;
}

interface PhotoUploadZoneProps {
  menuItemId?: string;
  onUploadComplete?: (results: UploadResult[]) => void;
  className?: string;
}

export function PhotoUploadZone({
  menuItemId,
  onUploadComplete,
  className,
}: PhotoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate and create upload entries
      const newFiles: UploadingFile[] = fileArray.map((file, index) => {
        const validation = validateFile(file);
        return {
          id: `${Date.now()}-${index}`,
          file,
          status: validation.valid ? "pending" : "error",
          progress: 0,
          error: validation.error,
        };
      });

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Upload valid files
      const validFiles = newFiles.filter((f) => f.status === "pending");
      const results: UploadResult[] = [];

      for (const uploadFile of validFiles) {
        // Update status to uploading
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "uploading" } : f
          )
        );

        try {
          const result = await uploadMenuPhoto(
            uploadFile.file,
            menuItemId,
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress: progress.percent } : f
                )
              );
            }
          );

          // If menuItemId provided, also register with the API
          if (menuItemId) {
            await fetch("/api/admin/photos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: result.publicUrl,
                menuItemId,
              }),
            });
          }

          results.push(result);

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "success", progress: 100, result }
                : f
            )
          );
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            )
          );
        }
      }

      if (results.length > 0) {
        onUploadComplete?.(results);
      }

      // Clear completed uploads after delay
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((f) => f.status !== "success")
        );
      }, 3000);
    },
    [menuItemId, onUploadComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = ""; // Reset input
      }
    },
    [handleFiles]
  );

  const removeUpload = useCallback((id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryUpload = useCallback(
    (uploadFile: UploadingFile) => {
      setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
      handleFiles([uploadFile.file]);
    },
    [handleFiles]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? "var(--primary)" : "var(--border)",
        }}
        className={cn(
          "relative rounded-card-sm border-2 border-dashed",
          "bg-surface-secondary hover:bg-surface-tertiary/50",
          "transition-colors duration-fast",
          isDragging && "border-primary bg-primary/5"
        )}
      >
        <label className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer">
          <motion.div
            animate={{ y: isDragging ? -4 : 0 }}
            className="rounded-full bg-primary/10 p-4"
          >
            <Upload className="h-8 w-8 text-primary" />
          </motion.div>

          <div className="text-center">
            <p className="font-body font-medium text-text-primary">
              {isDragging ? "Drop photos here" : "Drag and drop photos"}
            </p>
            <p className="text-sm font-body text-text-muted mt-1">
              or click to browse (JPEG, PNG, max 10MB)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-none"
          >
            Select Files
          </Button>

          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
      </motion.div>

      {/* Upload Progress List */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map((uploadFile) => (
              <motion.div
                key={uploadFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-input",
                  "bg-surface-secondary border border-border"
                )}
              >
                {/* Thumbnail */}
                <div className="h-10 w-10 rounded-input bg-surface-tertiary overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(uploadFile.file)}
                    alt={uploadFile.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-text-primary truncate">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {uploadFile.status === "uploading" && (
                      <>
                        <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-body text-text-muted">
                          {Math.round(uploadFile.progress)}%
                        </span>
                      </>
                    )}
                    {uploadFile.status === "success" && (
                      <span className="text-xs font-body text-green flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Uploaded
                      </span>
                    )}
                    {uploadFile.status === "error" && (
                      <span className="text-xs font-body text-status-error flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {uploadFile.error}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Icon / Actions */}
                <div className="shrink-0">
                  {uploadFile.status === "uploading" && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {uploadFile.status === "success" && (
                    <CheckCircle className="h-5 w-5 text-green" />
                  )}
                  {uploadFile.status === "error" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryUpload(uploadFile)}
                        className="h-7 px-2 text-xs"
                      >
                        Retry
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(uploadFile.id)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
