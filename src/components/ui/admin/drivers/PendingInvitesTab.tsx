/**
 * V6 Pending Invites Tab - Pepper Aesthetic
 *
 * Displays a table of pending driver invites with resend/revoke actions.
 * Features desktop table view and mobile card view.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MailPlus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Clock,
  AlertCircle,
  Copy,
  Link,
  Check,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface PendingInvite {
  id: string;
  email: string;
  invitedBy: { id: string; name: string };
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

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
      if (!response.ok) {
        throw new Error("Failed to fetch invites");
      }
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
      const response = await fetch(
        `/api/admin/drivers/${invite.id}/resend-invite`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend invite");
      }

      const data = await response.json();

      // Always show magic link dialog (unified flow)
      if (data.magicLink) {
        setMagicLink(data.magicLink);
        setMagicLinkEmail(invite.email);
        setMagicLinkDialogOpen(true);
        setCopied(false);
      }

      // Refresh to get updated expiration
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
      toast({
        title: "Link Copied",
        description: "Magic link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
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
      const response = await fetch(
        `/api/admin/drivers/${selectedInvite.id}/revoke-invite`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke invite");
      }

      toast({
        title: "Invite Revoked",
        description: `Invite to ${selectedInvite.email} has been revoked`,
      });

      // Remove from list
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
      <motion.div
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
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card-sm border border-border bg-surface-primary shadow-sm overflow-hidden"
      >
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-secondary hover:bg-surface-tertiary">
                <TableHead className="font-display">Email</TableHead>
                <TableHead className="font-display">Invited By</TableHead>
                <TableHead className="font-display">Sent</TableHead>
                <TableHead className="font-display">Expires</TableHead>
                <TableHead className="text-center font-display">Status</TableHead>
                <TableHead className="w-[100px] font-display">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const isLoading = actionLoading === invite.id;

                return (
                  <TableRow
                    key={invite.id}
                    className={cn(
                      "group transition-colors duration-fast",
                      invite.isExpired && "bg-surface-tertiary/50"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-input bg-primary-light text-primary">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="font-body font-medium text-text-primary">
                          {invite.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-body text-text-secondary">
                        {invite.invitedBy.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-body text-text-secondary">
                        {formatDistanceToNow(new Date(invite.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-body text-text-secondary">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(invite.expiresAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "transition-all duration-fast",
                          invite.isExpired
                            ? "bg-status-error/10 text-status-error border border-status-error/20"
                            : "bg-green/10 text-green border border-green/20"
                        )}
                      >
                        {invite.isExpired ? "Expired" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleResend(invite)}
                            className="cursor-pointer"
                          >
                            <MailPlus className="mr-2 h-4 w-4" />
                            Resend Invite
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRevokeClick(invite)}
                            className="cursor-pointer text-status-error focus:text-status-error"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border/50">
          <AnimatePresence>
            {invites.map((invite, index) => {
              const isLoading = actionLoading === invite.id;

              return (
                <motion.div
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
                        <p className="font-body font-medium text-text-primary">
                          {invite.email}
                        </p>
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
                      <span>
                        Expires {format(new Date(invite.expiresAt), "MMM d, h:mm a")}
                      </span>
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent className="bg-surface-primary border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display text-text-primary">
              <AlertCircle className="h-5 w-5 text-status-error" />
              Revoke Invite
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-text-secondary">
              Are you sure you want to revoke the invite for{" "}
              <span className="font-medium text-text-primary">
                {selectedInvite?.email}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-surface-tertiary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-status-error hover:bg-status-error/90 text-text-inverse"
            >
              Revoke Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Magic Link Dialog */}
      <AlertDialog open={magicLinkDialogOpen} onOpenChange={setMagicLinkDialogOpen}>
        <AlertDialogContent className="bg-surface-primary border-border max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display text-text-primary">
              <Link className="h-5 w-5 text-primary" />
              Invite Link Generated
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-text-secondary">
              Share this link with{" "}
              <span className="font-medium text-text-primary">
                {magicLinkEmail}
              </span>{" "}
              to let them complete driver registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={magicLink || ""}
                className="flex-1 px-3 py-2 text-sm bg-surface-secondary border border-border rounded-input font-mono truncate"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              This link expires in 24 hours. The recipient should open it in a browser where they are not already logged in.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-surface-tertiary">
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCopyLink}
              className="bg-primary hover:bg-primary/90 text-text-inverse"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
