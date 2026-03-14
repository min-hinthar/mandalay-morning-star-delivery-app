"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bug,
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { FeedbackCategory } from "@/types/feedback";

// ============================================
// SCHEMA
// ============================================

const feedbackFormSchema = z.object({
  category: z.enum(["bug_report", "order_issue", "suggestion", "general"]),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(100),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_OPTIONS: {
  value: FeedbackCategory;
  label: string;
  icon: typeof Bug;
  color: string;
}[] = [
  { value: "bug_report", label: "Bug", icon: Bug, color: "text-status-error" },
  { value: "order_issue", label: "Order Issue", icon: AlertTriangle, color: "text-accent-orange" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-accent-teal" },
  { value: "general", label: "General", icon: MessageCircle, color: "text-text-secondary" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ============================================
// PROPS
// ============================================

interface FeedbackFormProps {
  onClose: () => void;
  prefillOrderId: string | null;
  prefillCategory: FeedbackCategory | null;
}

// ============================================
// COMPONENT
// ============================================

export function FeedbackForm({ onClose, prefillOrderId, prefillCategory }: FeedbackFormProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated (simple check via cookie presence)
  const [isAuthenticated] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("sb-");
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: prefillCategory ?? "general",
      subject: "",
      message: "",
      contactEmail: "",
    },
  });

  const selectedCategory = watch("category");
  const messageValue = watch("message");
  const messageLength = messageValue?.length ?? 0;

  // ── File handling ──────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ message: "Please upload a JPEG, PNG, or WebP image", type: "error" });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ message: "Image must be under 5MB", type: "error" });
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ─────────────────────────────────
  const onSubmit = async (values: FeedbackFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        category: values.category,
        subject: values.subject,
        message: values.message,
        orderId: prefillOrderId ?? undefined,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        contactEmail: !isAuthenticated ? values.contactEmail : undefined,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }));
        throw new Error(err.error ?? "Failed to submit feedback");
      }

      toast({ message: "Feedback submitted! Thank you.", type: "success" });
      onClose();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <m.div
      className="flex flex-col h-full"
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {/* Header (mobile only — Modal has its own) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle sm:hidden">
        <h2 className="font-display text-lg font-bold text-text-primary">Send Feedback</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-surface-tertiary transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-text-muted" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
      >
        {/* Category chips */}
        <div>
          <Label className="text-sm font-medium text-text-secondary mb-2 block">Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("category", value)}
                className={cn(
                  "flex items-center gap-2 rounded-card-sm px-3 py-2.5",
                  "border transition-all duration-fast text-sm font-medium",
                  selectedCategory === value
                    ? "border-primary bg-primary/5 text-text-primary ring-1 ring-primary/20"
                    : "border-border-subtle bg-surface-primary text-text-secondary hover:border-border hover:bg-surface-secondary"
                )}
              >
                <Icon
                  className={cn("h-4 w-4", selectedCategory === value ? color : "text-text-muted")}
                />
                {label}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1 text-xs text-status-error">{errors.category.message}</p>
          )}
        </div>

        {/* Email (unauthenticated only) */}
        {!isAuthenticated && (
          <div>
            <Label
              htmlFor="feedback-email"
              className="text-sm font-medium text-text-secondary mb-1 block"
            >
              Your email <span className="text-status-error">*</span>
            </Label>
            <input
              id="feedback-email"
              type="email"
              {...register("contactEmail")}
              placeholder="you@example.com"
              className={cn(
                "w-full rounded-input border px-3 py-2 text-sm",
                "bg-surface-primary text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                errors.contactEmail ? "border-status-error" : "border-border-subtle"
              )}
            />
            {errors.contactEmail && (
              <p className="mt-1 text-xs text-status-error">{errors.contactEmail.message}</p>
            )}
          </div>
        )}

        {/* Subject */}
        <div>
          <Label
            htmlFor="feedback-subject"
            className="text-sm font-medium text-text-secondary mb-1 block"
          >
            Subject <span className="text-status-error">*</span>
          </Label>
          <input
            id="feedback-subject"
            type="text"
            {...register("subject")}
            placeholder="Brief summary of your feedback"
            className={cn(
              "w-full rounded-input border px-3 py-2 text-sm",
              "bg-surface-primary text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              errors.subject ? "border-status-error" : "border-border-subtle"
            )}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-status-error">{errors.subject.message}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <Label
            htmlFor="feedback-message"
            className="text-sm font-medium text-text-secondary mb-1 block"
          >
            Message <span className="text-status-error">*</span>
          </Label>
          <Textarea
            id="feedback-message"
            {...register("message")}
            placeholder="Describe your feedback in detail..."
            rows={5}
            className={cn("w-full resize-none", errors.message ? "border-status-error" : "")}
          />
          <div className="flex justify-between mt-1">
            {errors.message ? (
              <p className="text-xs text-status-error">{errors.message.message}</p>
            ) : (
              <span />
            )}
            <span
              className={cn(
                "text-xs",
                messageLength > 1800 ? "text-status-warning" : "text-text-muted"
              )}
            >
              {messageLength}/2000
            </span>
          </div>
        </div>

        {/* Screenshot */}
        <div>
          <Label className="text-sm font-medium text-text-secondary mb-1 block">
            Screenshot (optional)
          </Label>
          {screenshotPreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="h-24 w-auto rounded-card-sm border border-border-subtle object-cover"
              />
              <button
                type="button"
                onClick={removeScreenshot}
                className="absolute -top-2 -right-2 rounded-full bg-surface-primary border border-border-subtle p-0.5 shadow-sm hover:bg-surface-secondary"
                aria-label="Remove screenshot"
              >
                <X className="h-3.5 w-3.5 text-text-muted" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex items-center gap-2 rounded-card-sm border border-dashed px-4 py-3",
                "border-border-subtle text-text-muted text-sm",
                "hover:border-border hover:text-text-secondary hover:bg-surface-secondary/50",
                "transition-colors duration-fast"
              )}
            >
              <ImagePlus className="h-4 w-4" />
              Attach screenshot
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload screenshot"
          />
        </div>

        {/* Order ID indicator */}
        {prefillOrderId && (
          <div className="flex items-center gap-2 rounded-card-sm bg-status-info/10 px-3 py-2 text-sm text-status-info">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Linked to order #{prefillOrderId.slice(0, 8).toUpperCase()}</span>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </form>
    </m.div>
  );
}
