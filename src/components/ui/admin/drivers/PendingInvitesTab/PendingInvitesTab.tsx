"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Mail, MailPlus, RefreshCw, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PendingInvite } from "./types";
import { InviteDesktopTable } from "./InviteDesktopTable";
import { RevokeDialog, MagicLinkDialog } from "./InviteDialogs";

interface PendingInvitesTabProps {
  onInviteCountChange?: (count: number) => void;
}

export function PendingInvitesTab({ onInviteCountChange }: PendingInvitesTabProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvite | null>(null);
  const [magicLinkDialogOpen, setMagicLinkDialogOpen] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/drivers/invites");
      if (!response.ok) throw new Error("Failed to fetch invites");
      const data: PendingInvite[] = await response.json();
      setInvites(data);
      onInviteCountChange?.(data.length);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch pending invites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [onInviteCountChange]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleResend = async (invite: PendingInvite) => {
    setActionLoading(invite.id);
    try {
      const response = await fetch(`/api/admin/drivers/${invite.id}/resend-invite`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend invite");
      }
      const data = await response.json();
      if (data.magicLink) {
        setMagicLink(data.magicLink);
        setMagicLinkEmail(invite.email);
        setMagicLinkDialogOpen(true);
        setCopied(false);
      }
      await fetchInvites();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resend invite",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = async () => {
    if (!magicLink) return;
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      toast({ title: "Link Copied", description: "Magic link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleRevokeClick = (invite: PendingInvite) => {
    setSelectedInvite(invite);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedInvite) return;
    setActionLoading(selectedInvite.id);
    setRevokeDialogOpen(false);
    try {
      const response = await fetch(`/api/admin/drivers/${selectedInvite.id}/revoke-invite`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke invite");
      }
      toast({
        title: "Invite Revoked",
        description: `Invite to ${selectedInvite.email} has been revoked`,
      });
      setInvites((prev) => {
        const updated = prev.filter((i) => i.id !== selectedInvite.id);
        onInviteCountChange?.(updated.length);
        return updated;
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to revoke invite",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setSelectedInvite(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-surface-tertiary rounded-input" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-tertiary rounded-input" />
        ))}
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-surface-secondary rounded-card-sm border border-border"
      >
        <div className="rounded-full bg-primary-light w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
          No pending invites
        </h2>
        <p className="text-text-secondary font-body max-w-md mx-auto">
          Use the &quot;Invite Driver&quot; button to send an invitation to a new driver.
        </p>
      </m.div>
    );
  }

  return (
    <>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card-sm border border-border bg-surface-primary shadow-sm overflow-hidden"
      >
        <InviteDesktopTable
          invites={invites}
          actionLoading={actionLoading}
          onResend={handleResend}
          onRevokeClick={handleRevokeClick}
        />

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border/50">
          <AnimatePresence>
            {invites.map((invite, index) => {
              const isLoading = actionLoading === invite.id;
              return (
                <m.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 transition-colors duration-fast",
                    invite.isExpired && "bg-surface-tertiary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-input bg-primary-light text-primary">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-body font-medium text-text-primary">{invite.email}</p>
                        <p className="text-xs font-body text-text-secondary">
                          Invited by {invite.invitedBy.name}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        invite.isExpired
                          ? "bg-status-error/10 text-status-error border border-status-error/20"
                          : "bg-green/10 text-green border border-green/20"
                      )}
                    >
                      {invite.isExpired ? "Expired" : "Pending"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm font-body text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expires {format(new Date(invite.expiresAt), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-primary/30 text-primary hover:bg-primary-light"
                      onClick={() => handleResend(invite)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MailPlus className="mr-2 h-4 w-4" />
                      )}
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-status-error/30 text-status-error hover:bg-status-error/10"
                      onClick={() => handleRevokeClick(invite)}
                      disabled={isLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>
      </m.div>

      <RevokeDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        invite={selectedInvite}
        onConfirm={handleRevokeConfirm}
      />
      <MagicLinkDialog
        open={magicLinkDialogOpen}
        onOpenChange={setMagicLinkDialogOpen}
        magicLink={magicLink}
        email={magicLinkEmail}
        copied={copied}
        onCopyLink={handleCopyLink}
      />
    </>
  );
}
