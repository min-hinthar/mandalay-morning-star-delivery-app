import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ProfileRole } from "@/types/database";

// ============================================
// TYPES
// ============================================

interface ProfileCheck {
  role: ProfileRole;
}

interface RatingRow {
  id: string;
  rating: number;
  feedback_text: string | null;
  submitted_at: string;
  orders: {
    id: string;
    profiles: {
      full_name: string | null;
    } | null;
  };
}

type SortOption = "date" | "stars";

interface RatingsPageProps {
  searchParams: Promise<{ sort?: string }>;
}

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Ratings | Mandalay Morning Star",
  description: "View customer delivery ratings",
};

// ============================================
// HELPERS
// ============================================

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-status-warning text-status-warning" : "fill-none text-text-muted"
          )}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================
// PAGE
// ============================================

export default async function RatingsPage({ searchParams }: RatingsPageProps) {
  const resolvedParams = await searchParams;
  const sort: SortOption = resolvedParams.sort === "stars" ? "stars" : "date";

  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin/ratings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileCheck[]>()
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
  }

  // Build query with sort
  let query = supabase
    .from("driver_ratings")
    .select(
      `
      id,
      rating,
      feedback_text,
      submitted_at,
      orders!inner (
        id,
        profiles!orders_user_id_fkey (
          full_name
        )
      )
    `
    )
    .returns<RatingRow[]>();

  if (sort === "stars") {
    query = query.order("rating", { ascending: false }).order("submitted_at", { ascending: false });
  } else {
    query = query.order("submitted_at", { ascending: false });
  }

  const { data: ratings, error: ratingsError } = await query;

  if (ratingsError) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-status-error">Failed to load ratings.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Ratings</h1>
        <span className="rounded-full bg-accent-teal/10 px-3 py-1 text-sm font-semibold text-accent-teal">
          {ratings?.length ?? 0}
        </span>
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">Sort by:</span>
        <Link
          href="/admin/ratings?sort=date"
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            sort === "date"
              ? "bg-primary text-text-inverse"
              : "bg-surface-secondary text-text-secondary hover:text-text-primary"
          )}
        >
          Date
        </Link>
        <Link
          href="/admin/ratings?sort=stars"
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            sort === "stars"
              ? "bg-primary text-text-inverse"
              : "bg-surface-secondary text-text-secondary hover:text-text-primary"
          )}
        >
          Stars
        </Link>
      </div>

      {/* Table */}
      {!ratings || ratings.length === 0 ? (
        <div className="rounded-card border border-border-subtle bg-surface-primary p-12 text-center">
          <Star className="mx-auto h-12 w-12 text-text-muted" />
          <p className="mt-4 text-lg font-medium text-text-primary">No ratings yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Customer ratings will appear here once orders are reviewed.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-card border border-border-subtle bg-surface-primary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-secondary">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Order #</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Stars</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Feedback</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {ratings.map((r) => (
                <tr key={r.id} className="hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">
                    #{r.orders.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {r.orders.profiles?.full_name ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <StarDisplay rating={r.rating} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-text-secondary">
                    {r.feedback_text ?? "--"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {formatDate(r.submitted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <StarDisplay rating={r.rating} />
                <span className="text-xs text-text-muted">{formatDate(r.submitted_at)}</span>
              </div>
              <p className="text-sm font-medium mt-1">
                {r.orders.profiles?.full_name ?? "Unknown"}
              </p>
              <p className="text-xs text-text-secondary font-mono">
                Order #{r.orders.id.slice(0, 8).toUpperCase()}
              </p>
              {r.feedback_text && (
                <p className="text-sm text-text-secondary line-clamp-2 mt-2">
                  {r.feedback_text}
                </p>
              )}
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
