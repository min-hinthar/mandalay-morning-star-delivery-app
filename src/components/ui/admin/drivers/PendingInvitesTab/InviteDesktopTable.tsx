"use client";

import {
  Mail,
  MailPlus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils/cn";
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
import type { PendingInvite } from "./types";

interface InviteDesktopTableProps {
  invites: PendingInvite[];
  actionLoading: string | null;
  onResend: (invite: PendingInvite) => void;
  onRevokeClick: (invite: PendingInvite) => void;
}

export function InviteDesktopTable({
  invites,
  actionLoading,
  onResend,
  onRevokeClick,
}: InviteDesktopTableProps) {
  return (
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
                        onClick={() => onResend(invite)}
                        className="cursor-pointer"
                      >
                        <MailPlus className="mr-2 h-4 w-4" />
                        Resend Invite
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onRevokeClick(invite)}
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
  );
}
