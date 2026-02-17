"use client";

import Image from "next/image";
import { User, Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CollapsibleCard } from "./CollapsibleCard";
import type { OrderDetail } from "./types";

interface CustomerInfoCardProps {
  order: OrderDetail;
}

export function CustomerInfoCard({ order }: CustomerInfoCardProps) {
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Build encoded address for static map
  let encodedAddr: string | null = null;
  if (order.address) {
    const parts = [
      order.address.street,
      order.address.apt,
      order.address.city,
      order.address.state,
      order.address.zip,
    ].filter(Boolean);
    encodedAddr = encodeURIComponent(parts.join(", "));
  }

  return (
    <CollapsibleCard
      title="Customer"
      icon={<User className="h-4 w-4" />}
      defaultOpen
    >
      <div className="space-y-3">
        {/* Customer name */}
        <p className="font-display font-semibold text-text-primary">
          {order.customerName || "Guest"}
        </p>

        {/* Contact links */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${order.customerEmail}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm",
              "bg-surface-tertiary hover:bg-primary-light text-text-secondary hover:text-primary",
              "transition-colors duration-fast"
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            {order.customerEmail}
          </a>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm",
                "bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal",
                "transition-colors duration-fast"
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              {order.customerPhone}
            </a>
          )}
        </div>

        {/* Address */}
        {order.address && (
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {order.address.street}
              {order.address.apt && `, ${order.address.apt}`}
              <br />
              {order.address.city}, {order.address.state} {order.address.zip}
            </span>
          </div>
        )}

        {/* Static map */}
        {encodedAddr && googleMapsKey && (
          <Image
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddr}&zoom=15&size=400x200&scale=2&markers=color:red|${encodedAddr}&key=${googleMapsKey}`}
            alt="Delivery location map"
            width={800}
            height={400}
            loading="lazy"
            unoptimized
            className="w-full rounded-lg"
          />
        )}

        {/* Special instructions */}
        {order.specialInstructions && (
          <div className="mt-2 rounded-lg border border-accent-teal/20 bg-accent-teal/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-teal mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Special Instructions
            </div>
            <p className="text-sm text-text-secondary italic">
              &ldquo;{order.specialInstructions}&rdquo;
            </p>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
