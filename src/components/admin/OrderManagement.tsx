"use client";

/**
 *  Order Management - Motion-First Drag & Drop
 *
 * Sprint 8: Admin Dashboard
 * Features: Drag-drop polish, status columns, animated transitions,
 * quick actions, order preview cards
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Package,
  GripVertical,
  Clock,
  User,
  MapPin,
  ChevronRight,
  Truck,
  CheckCircle2,
  XCircle,
  Timer,
  Eye,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import {
  spring,
  staggerContainer,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { OrderStatus } from "@/types/database";

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string | null;
  customerEmail: string;
  totalCents: number;
  itemCount: number;
  placedAt: string;
  deliveryWindowStart: string | null;
  address?: string;
  driverName?: string | null;
}

export interface OrderManagementProps {
  /** Orders to display */
  orders: OrderItem[];
  /** Callback when order status changes */
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  /** Callback when order is clicked for details */
  onOrderClick?: (orderId: string) => void;
  /** Column view mode */
  viewMode?: "kanban" | "list";
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// STATUS CONFIGURATION
// ============================================

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: typeof Package;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-accent-teal",
    bgColor: "bg-accent-teal/10",
    borderColor: "border-accent-teal/30",
  },
  preparing: {
    label: "Preparing",
    icon: Timer,
    color: "text-accent-magenta",
    bgColor: "bg-accent-magenta/10",
    borderColor: "border-accent-magenta/30",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green",
    bgColor: "bg-green/10",
    borderColor: "border-green/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-status-error",
    bgColor: "bg-status-error/10",
    borderColor: "border-status-error/30",
  },
};

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

// ============================================
// ORDER CARD
// ============================================

interface OrderCardProps {
  order: OrderItem;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onOrderClick?: (orderId: string) => void;
  isDragging?: boolean;
}

function OrderCard({
  order,
  onStatusChange,
  onOrderClick,
  isDragging,
}: OrderCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const dragControls = useDragControls();

  const config = STATUS_CONFIG[order.status];
  const Icon = config.icon;

  // Get next possible status
  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const nextStatus = currentIndex < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIndex + 1]
    : null;

  const handleAdvanceStatus = async () => {
    if (!nextStatus || isUpdating) return;

    setIsUpdating(true);
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    try {
      await onStatusChange(order.id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? {
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging
          ? "0 20px 40px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)",
      } : undefined}
      exit={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
      transition={getSpring(spring.snappy)}
      whileHover={shouldAnimate ? { y: -2 } : undefined}
      onHoverStart={() => setShowQuickActions(true)}
      onHoverEnd={() => setShowQuickActions(false)}
      className={cn(
        "relative p-4 rounded-xl",
        "bg-white border",
        "cursor-grab active:cursor-grabbing",
        "transition-colors",
        config.borderColor,
        isDragging && "ring-2 ring-primary/30"
      )}
    >
      {/* Drag handle */}
      <motion.div
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical className="w-4 h-4 text-text-muted" />
      </motion.div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            transition={spring.ultraBouncy}
            className={cn("p-1.5 rounded-lg", config.bgColor)}
          >
            <Icon className={cn("w-4 h-4", config.color)} />
          </motion.div>
          <div>
            <p className="font-mono text-sm font-semibold text-text-primary">
              #{order.orderNumber}
            </p>
            <p className="text-xs text-text-muted">
              {format(parseISO(order.placedAt), "h:mm a")}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <motion.span
          layout
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            config.bgColor,
            config.color
          )}
        >
          {config.label}
        </motion.span>
      </div>

      {/* Customer info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="text-text-primary truncate">
            {order.customerName || order.customerEmail}
          </span>
        </div>

        {order.deliveryWindowStart && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="text-text-secondary">
              {format(parseISO(order.deliveryWindowStart), "EEE, MMM d")}
            </span>
          </div>
        )}

        {order.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="text-text-secondary truncate">{order.address}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-secondary">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        <p className="font-semibold text-text-primary">
          {formatPrice(order.totalCents)}
        </p>
      </div>

      {/* Quick actions overlay */}
      <AnimatePresence>
        {showQuickActions && nextStatus && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            transition={spring.snappy}
            className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-white via-white to-transparent rounded-b-xl"
          >
            <div className="flex gap-2">
              <motion.button
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                onClick={handleAdvanceStatus}
                disabled={isUpdating}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2",
                  "px-3 py-2 rounded-lg",
                  "bg-primary text-white",
                  "text-sm font-medium",
                  "disabled:opacity-50"
                )}
              >
                {isUpdating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Move to {STATUS_CONFIG[nextStatus].label}
                  </>
                )}
              </motion.button>

              {onOrderClick && (
                <motion.button
                  whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  onClick={() => onOrderClick(order.id)}
                  className="p-2 rounded-lg bg-surface-secondary text-text-secondary hover:text-text-primary"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Driver assigned badge */}
      {order.driverName && order.status === "out_for_delivery" && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-white text-xs shadow-lg"
        >
          <Truck className="w-3 h-3" />
          {order.driverName.split(" ")[0]}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// KANBAN COLUMN
// ============================================

interface KanbanColumnProps {
  status: OrderStatus;
  orders: OrderItem[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onOrderClick?: (orderId: string) => void;
  onReorder: (orders: OrderItem[]) => void;
}

function KanbanColumn({
  status,
  orders,
  onStatusChange,
  onOrderClick,
  onReorder,
}: KanbanColumnProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className="flex-1 min-w-[300px] max-w-[350px]"
    >
      {/* Column header */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-t-xl border-b-2",
        "bg-surface-secondary",
        config.borderColor
      )}>
        <motion.div
          animate={shouldAnimate && orders.length > 0 ? { scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 0.3 }}
          className={cn("p-1 rounded-lg", config.bgColor)}
        >
          <Icon className={cn("w-4 h-4", config.color)} />
        </motion.div>
        <span className="font-semibold text-text-primary">{config.label}</span>
        <motion.span
          key={orders.length}
          initial={shouldAnimate ? { scale: 1.3 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          className={cn(
            "ml-auto px-2 py-0.5 rounded-full text-xs font-bold",
            config.bgColor,
            config.color
          )}
        >
          {orders.length}
        </motion.span>
      </div>

      {/* Column content */}
      <div className="h-[calc(100vh-300px)] overflow-y-auto p-3 bg-surface-secondary/50 rounded-b-xl">
        {orders.length === 0 ? (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className={cn("p-3 rounded-full mb-3", config.bgColor)}>
              <Icon className={cn("w-6 h-6", config.color, "opacity-50")} />
            </div>
            <p className="text-sm text-text-muted">No orders</p>
          </motion.div>
        ) : (
          <Reorder.Group
            axis="y"
            values={orders}
            onReorder={onReorder}
            className="space-y-3"
          >
            {orders.map((order) => (
              <Reorder.Item key={order.id} value={order}>
                <OrderCard
                  order={order}
                  onStatusChange={onStatusChange}
                  onOrderClick={onOrderClick}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// LIST VIEW ROW
// ============================================

interface ListRowProps {
  order: OrderItem;
  index: number;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onOrderClick?: (orderId: string) => void;
}

function ListRow({ order, index, onStatusChange, onOrderClick }: ListRowProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isUpdating, setIsUpdating] = useState(false);

  const config = STATUS_CONFIG[order.status];
  const Icon = config.icon;

  // Get next possible status
  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const nextStatus = currentIndex < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIndex + 1]
    : null;

  const handleAdvanceStatus = async () => {
    if (!nextStatus || isUpdating) return;

    setIsUpdating(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    try {
      await onStatusChange(order.id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      exit={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
      transition={{ ...getSpring(spring.snappy), delay: index * 0.03 }}
      whileHover={shouldAnimate ? { backgroundColor: "rgba(164, 16, 52, 0.02)" } : undefined}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "bg-surface-primary border border-border",
        "hover:border-primary/30",
        "transition-colors"
      )}
    >
      {/* Status icon */}
      <motion.div
        whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
        className={cn("p-2 rounded-lg", config.bgColor)}
      >
        <Icon className={cn("w-5 h-5", config.color)} />
      </motion.div>

      {/* Order info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono font-semibold text-text-primary">
            #{order.orderNumber}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            config.bgColor,
            config.color
          )}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-text-secondary truncate">
          {order.customerName || order.customerEmail}
        </p>
      </div>

      {/* Items & total */}
      <div className="text-right">
        <p className="font-semibold text-text-primary">
          {formatPrice(order.totalCents)}
        </p>
        <p className="text-sm text-text-muted">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Delivery date */}
      <div className="text-right w-24">
        {order.deliveryWindowStart ? (
          <p className="text-sm text-text-secondary">
            {format(parseISO(order.deliveryWindowStart), "MMM d")}
          </p>
        ) : (
          <p className="text-sm text-text-muted">—</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {nextStatus && (
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            onClick={handleAdvanceStatus}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg",
              "bg-primary/10 text-primary",
              "text-sm font-medium",
              "hover:bg-primary/20",
              "disabled:opacity-50"
            )}
          >
            {isUpdating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                Next
              </>
            )}
          </motion.button>
        )}

        {onOrderClick && (
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            onClick={() => onOrderClick(order.id)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary"
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OrderManagement({
  orders,
  onStatusChange,
  onOrderClick,
  viewMode = "kanban",
  loading = false,
  className,
}: OrderManagementProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderStatus, OrderItem[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      out_for_delivery: [],
      delivered: [],
      cancelled: [],
    };

    orders.forEach((order) => {
      grouped[order.status].push(order);
    });

    return grouped;
  }, [orders]);

  // Handle reorder within a column
  const handleReorder = useCallback(
    (status: OrderStatus) => (reorderedOrders: OrderItem[]) => {
      // In a real app, you'd persist the order here
      console.log(`Reordered ${status}:`, reorderedOrders.map((o) => o.id));
    },
    []
  );

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-surface-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        className={cn(
          "flex flex-col items-center justify-center py-16",
          "bg-surface-secondary rounded-2xl",
          className
        )}
      >
        <motion.div
          animate={shouldAnimate ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-4 rounded-full bg-primary/10 mb-4"
        >
          <Package className="w-8 h-8 text-primary" />
        </motion.div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          No orders yet
        </h3>
        <p className="text-text-muted">Orders will appear here as they come in</p>
      </motion.div>
    );
  }

  return (
    <div className={cn("", className)}>
      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.filter((s) => s !== "delivered").map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={ordersByStatus[status]}
              onStatusChange={onStatusChange}
              onOrderClick={onOrderClick}
              onReorder={handleReorder(status)}
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={shouldAnimate ? staggerContainer(0.03, 0.1) : undefined}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {orders
              .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
              .map((order, index) => (
                <ListRow
                  key={order.id}
                  order={order}
                  index={index}
                  onStatusChange={onStatusChange}
                  onOrderClick={onOrderClick}
                />
              ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default OrderManagement;
