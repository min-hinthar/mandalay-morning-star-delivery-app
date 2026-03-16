"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import {
  type EmailLogEntry,
  type PaginationMeta,
  EMAIL_TYPES,
  EMAIL_STATUSES,
  STATUS_BADGE_MAP,
  PAGE_SIZE,
  formatEmailDate,
  formatEmailType,
} from "./email-log-types";
import { EmailStatsBar } from "./EmailStatsBar";
import { EmailDetailPanel } from "./EmailDetailPanel";

// ===========================================
// COMPONENT
// ===========================================

export default function AdminEmailLogPage() {
  const [searchOrderId, setSearchOrderId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchEmails = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        if (searchOrderId.trim()) params.set("orderId", searchOrderId.trim());
        if (typeFilter) params.set("type", typeFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);

        const response = await fetch(`/api/admin/emails?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch email log");
        const result = await response.json();

        setEmails(result.data || []);
        setPagination(result.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 0 });
      } catch {
        toast({ message: "Failed to load email log", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [searchOrderId, typeFilter, statusFilter, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails]);

  const handleResend = useCallback(
    async (emailId: string) => {
      setResendingId(emailId);
      try {
        const response = await fetch(`/api/admin/emails/${emailId}/resend`, { method: "POST" });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(extractErrorMessage(data, "Failed to resend email"));
        }
        toast({ message: "Email resent successfully", type: "success" });
        fetchEmails(pagination.page);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend email";
        toast({ message, type: "error" });
      } finally {
        setResendingId(null);
      }
    },
    [fetchEmails, pagination.page]
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Email Log</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor email delivery and manage failed sends.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchEmails(pagination.page)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Stats Bar (today/week/all-time) */}
      <EmailStatsBar />

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search order ID..."
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-11 md:h-10 rounded-md border border-border-subtle bg-surface-primary px-3 text-sm text-text-primary"
        >
          {EMAIL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 md:h-10 rounded-md border border-border-subtle bg-surface-primary px-3 text-sm text-text-primary"
        >
          {EMAIL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
        />
      </div>

      {/* Results */}
      {loading && emails.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Mail className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">No emails found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-card-sm border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary">
                  <th className="w-8 px-2" />
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                    Recipient
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Sent At</th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {emails.map((email) => (
                  <Fragment key={email.id}>
                    <tr
                      className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                    >
                      <td className="px-2 py-3 text-center">
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-text-muted transition-transform ${
                            expandedId === email.id ? "rotate-180" : ""
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-text-primary truncate max-w-[180px]">
                        {email.recipient}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" size="sm">
                          {formatEmailType(email.notification_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary truncate max-w-[250px]">
                        {email.subject}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE_MAP[email.status] || "default"} size="sm">
                          {email.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {formatEmailDate(email.sent_at || email.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {email.order_id && (
                            <Link
                              href={`/admin/orders/${email.order_id}`}
                              className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center"
                            >
                              View Order
                            </Link>
                          )}
                          {email.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={resendingId === email.id}
                              onClick={() => handleResend(email.id)}
                              className="text-xs h-11 md:h-9"
                            >
                              {resendingId === email.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Resend"
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === email.id && (
                      <tr key={`${email.id}-detail`}>
                        <td colSpan={7}>
                          <EmailDetailPanel email={email} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {emails.map((email) => (
              <div key={email.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant={STATUS_BADGE_MAP[email.status] || "default"} size="sm">
                      {email.status}
                    </Badge>
                    <span className="text-sm font-medium truncate">{email.recipient}</span>
                  </div>
                  <Badge variant="outline" size="sm" className="shrink-0 ml-2">
                    {formatEmailType(email.notification_type)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{formatEmailDate(email.sent_at || email.created_at)}</span>
                  <div className="flex items-center gap-2">
                    {email.order_id && (
                      <Link
                        href={`/admin/orders/${email.order_id}`}
                        className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center"
                      >
                        View Order
                      </Link>
                    )}
                    {email.status === "failed" && (
                      <Button
                        size="sm"
                        className="h-11 md:h-9"
                        variant="ghost"
                        disabled={resendingId === email.id}
                        onClick={() => handleResend(email.id)}
                      >
                        {resendingId === email.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-muted">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchEmails(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
              const pageNum = start + i;
              if (pageNum > pagination.totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "primary" : "outline"}
                  size="sm"
                  onClick={() => fetchEmails(pageNum)}
                  disabled={loading}
                  className="min-w-[36px]"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchEmails(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
