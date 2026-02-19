import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriverPageHeader } from "@/components/ui/driver/DriverPageHeader";
import { StopDetailView } from "@/components/ui/driver/StopDetailView";
import { Skeleton } from "@/components/ui/skeleton/base";
import type { RouteStopStatus } from "@/types/driver";

interface PageProps {
  params: Promise<{ stopId: string }>;
}

interface DriverQueryResult {
  id: string;
}

interface StopQueryResult {
  id: string;
  stop_index: number;
  status: RouteStopStatus;
  delivery_notes: string | null;
  route: {
    id: string;
    status: string;
    driver_id: string;
    route_stops: { count: number }[];
  };
  order: {
    id: string;
    delivery_window_start: string | null;
    delivery_window_end: string | null;
    customer: {
      full_name: string | null;
      phone: string | null;
    };
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      zip_code: string;
      latitude: number | null;
      longitude: number | null;
    };
    items: Array<{
      id: string;
      quantity: number;
      menu_item: {
        name: string;
      };
      modifiers: Array<{
        modifier: {
          name: string;
        };
      }>;
    }>;
  };
}

async function getStopDetail(stopId: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver/route");
  }

  // Get driver
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverQueryResult[]>()
    .single();

  if (!driver) {
    redirect("/driver");
  }

  // Get stop with all related data
  const { data: stop } = await supabase
    .from("route_stops")
    .select(
      `
      id,
      stop_index,
      status,
      delivery_notes,
      route:routes (
        id,
        status,
        driver_id,
        route_stops (count)
      ),
      order:orders (
        id,
        delivery_window_start,
        delivery_window_end,
        customer:profiles!orders_customer_id_fkey (
          full_name,
          phone
        ),
        address:addresses!orders_delivery_address_id_fkey (
          line1,
          line2,
          city,
          state,
          zip_code,
          latitude,
          longitude
        ),
        items:order_items (
          id,
          quantity,
          menu_item:menu_items (
            name
          ),
          modifiers:order_item_modifiers (
            modifier:modifiers (
              name
            )
          )
        )
      )
    `
    )
    .eq("id", stopId)
    .returns<StopQueryResult[]>()
    .single();

  if (!stop) {
    return null;
  }

  // Verify driver owns this route
  if (stop.route?.driver_id !== driver.id) {
    return null;
  }

  return stop;
}

function StopDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Timeline / header skeleton */}
      <Skeleton width="100%" height={80} radius="xl" />
      {/* Map skeleton */}
      <Skeleton width="100%" height={200} radius="xl" />
      {/* Info sections */}
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={60} radius="xl" />
      ))}
      {/* Action buttons skeleton */}
      <Skeleton width="100%" height={48} radius="xl" />
    </div>
  );
}

function StopLoading() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <DriverPageHeader title="Stop Details" showBack backHref="/driver/route" />
      <div className="p-4">
        <StopDetailSkeleton />
      </div>
    </div>
  );
}

export default async function StopDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<StopLoading />}>
      <StopDetailPageContent params={params} />
    </Suspense>
  );
}

async function StopDetailPageContent({ params }: PageProps) {
  const { stopId } = await params;
  const stop = await getStopDetail(stopId);

  if (!stop) {
    notFound();
  }

  // Transform order items
  const orderItems = (stop.order?.items ?? []).map((item) => ({
    id: item.id,
    name: item.menu_item?.name ?? "Unknown Item",
    quantity: item.quantity,
    modifiers: item.modifiers?.map((m) => m.modifier?.name).filter(Boolean) as string[],
  }));

  return (
    <div className="min-h-screen bg-surface-secondary pb-20">
      <DriverPageHeader title={`Stop #${stop.stop_index}`} showBack backHref="/driver/route" />
      <div className="p-4">
        <StopDetailView
          routeId={stop.route?.id ?? ""}
          stopId={stop.id}
          stopIndex={stop.stop_index}
          totalStops={stop.route?.route_stops?.[0]?.count ?? stop.stop_index}
          status={stop.status}
          customer={{
            fullName: stop.order?.customer?.full_name ?? null,
            phone: stop.order?.customer?.phone ?? null,
          }}
          address={{
            line1: stop.order?.address?.line1 ?? "",
            line2: stop.order?.address?.line2 ?? null,
            city: stop.order?.address?.city ?? "",
            state: stop.order?.address?.state ?? "",
            zipCode: stop.order?.address?.zip_code ?? "",
            latitude: stop.order?.address?.latitude ?? null,
            longitude: stop.order?.address?.longitude ?? null,
          }}
          timeWindow={{
            start: stop.order?.delivery_window_start ?? null,
            end: stop.order?.delivery_window_end ?? null,
          }}
          deliveryNotes={stop.delivery_notes}
          orderItems={orderItems}
        />
      </div>
    </div>
  );
}
