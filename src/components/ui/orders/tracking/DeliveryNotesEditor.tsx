/**
 * DeliveryNotesEditor - Editable delivery instructions
 *
 * Shows current delivery notes with edit/save/cancel flow.
 * Patches /api/orders/{orderId}/notes to persist changes.
 * Read-only when order is delivered or cancelled.
 */

"use client";

import { useState, useRef } from "react";
import { Pencil, Save, X, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/useToastV8";

const MAX_NOTES_LENGTH = 500;

interface DeliveryNotesEditorProps {
  orderId: string;
  initialNotes: string | null;
  isEditable: boolean;
  className?: string;
}

export function DeliveryNotesEditor({
  orderId,
  initialNotes,
  isEditable,
  className,
}: DeliveryNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEdit = () => {
    setEditValue(notes);
    setIsEditing(true);
    // Focus textarea after render
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(data?.error?.message ?? "Failed to update delivery instructions");
      }

      setNotes(trimmed);
      setIsEditing(false);
      toast({ message: "Delivery instructions updated", type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update delivery instructions";
      toast({ message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const displayText = notes || "No delivery instructions";
  const hasNotes = notes.length > 0;

  return (
    <div className={cn("rounded-xl bg-surface-primary p-4 shadow-warm-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-charcoal-400" />
          <h4 className="text-sm font-semibold text-charcoal">Delivery Instructions</h4>
        </div>
        {isEditable && !isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8 text-charcoal-400 hover:text-charcoal-600"
            aria-label="Edit delivery instructions"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* View mode */}
      {!isEditing && (
        <p className={cn("text-sm", hasNotes ? "text-charcoal-600" : "text-charcoal-400 italic")}>
          {displayText}
        </p>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.slice(0, MAX_NOTES_LENGTH))}
              placeholder="Add delivery instructions (e.g., Leave at door, ring bell...)"
              className={cn(
                "w-full rounded-lg border border-charcoal-200 bg-surface-primary p-3",
                "text-sm text-charcoal placeholder:text-charcoal-400",
                "focus:border-jade-400 focus:outline-none focus:ring-2 focus:ring-jade-100",
                "resize-none"
              )}
              rows={3}
              maxLength={MAX_NOTES_LENGTH}
              disabled={isSaving}
            />
            <span className="absolute bottom-2 right-2 text-xs text-charcoal-400">
              {editValue.length}/{MAX_NOTES_LENGTH}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-charcoal-500"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-jade-600 hover:bg-jade-700 text-text-inverse"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
