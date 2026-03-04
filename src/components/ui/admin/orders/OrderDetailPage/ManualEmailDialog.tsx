"use client";

import { useState, useCallback } from "react";
import { Loader2, ArrowLeft, Send, Eye } from "lucide-react";
import { Modal, ModalHeader, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import { TiptapEditor } from "./TiptapEditor";

// ===========================================
// TYPES
// ===========================================

interface ManualEmailDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  orderSummary: string;
  onSent?: () => void;
}

type Step = "compose" | "preview";

// ===========================================
// COMPONENT
// ===========================================

export function ManualEmailDialog({
  open,
  onClose,
  orderId,
  orderNumber,
  customerEmail,
  orderSummary,
  onSent,
}: ManualEmailDialogProps) {
  const [step, setStep] = useState<Step>("compose");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [sending, setSending] = useState(false);

  const footerHtml = `<hr style="margin:16px 0;border:none;border-top:1px solid #e5e5e5" /><p style="font-size:12px;color:#6b7280">Regarding Order #${orderNumber}: ${orderSummary}</p>`;

  const resetForm = useCallback(() => {
    setStep("compose");
    setSubject("");
    setHtmlBody("");
    setSending(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handlePreview = useCallback(() => {
    if (!subject.trim()) {
      toast({ message: "Subject is required", type: "error" });
      return;
    }
    if (!htmlBody.trim() || htmlBody === "<p></p>") {
      toast({ message: "Email body is required", type: "error" });
      return;
    }
    setStep("preview");
  }, [subject, htmlBody]);

  const handleSend = useCallback(async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/emails/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          subject: subject.trim(),
          htmlBody,
          recipientEmail: customerEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(extractErrorMessage(data, "Failed to send email"));
      }

      toast({ message: "Email sent successfully", type: "success" });
      handleClose();
      onSent?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send";
      toast({ message, type: "error" });
      setSending(false);
    }
  }, [orderId, subject, htmlBody, customerEmail, handleClose, onSent]);

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Compose Email"
      size="lg"
      header={<ModalHeader>{step === "compose" ? "Compose Email" : "Preview Email"}</ModalHeader>}
      footer={
        <ModalFooter>
          {step === "compose" ? (
            <>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-1" />
                Preview Email
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("compose")}
                disabled={sending}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Edit
              </Button>
              <Button size="sm" onClick={handleSend} disabled={sending}>
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Send Email
              </Button>
            </>
          )}
        </ModalFooter>
      }
    >
      {step === "compose" ? (
        <div className="space-y-4">
          {/* Recipient (read-only) */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
            <div className="text-sm text-text-primary bg-surface-secondary/50 rounded px-3 py-2 border border-border-subtle">
              {customerEmail}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="email-subject"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Subject
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full text-sm text-text-primary bg-surface-primary border border-border-subtle rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-interactive-primary/30 focus:border-interactive-primary transition-colors"
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Body</label>
            <TiptapEditor
              content={htmlBody}
              onChange={setHtmlBody}
              placeholder="Write your email..."
            />
          </div>

          {/* Auto-footer preview */}
          <div className="rounded border border-border-subtle bg-surface-secondary/30 p-3">
            <p className="text-xs font-medium text-text-secondary mb-1">Auto-included footer</p>
            <p className="text-xs text-text-muted">
              Regarding Order #{orderNumber}: {orderSummary}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview: Recipient */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-text-secondary">To:</span>
            <span className="text-text-primary">{customerEmail}</span>
          </div>

          {/* Preview: Subject */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-text-secondary">Subject:</span>
            <span className="text-text-primary font-medium">{subject}</span>
          </div>

          {/* Preview: Body */}
          <div className="rounded border border-border-subtle bg-surface-primary p-4">
            <div
              className="prose prose-sm max-w-none text-text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: htmlBody + footerHtml }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
