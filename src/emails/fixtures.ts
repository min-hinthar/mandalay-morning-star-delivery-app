/**
 * Sample data fixtures for email template previews.
 * Uses realistic Burmese menu items and pricing.
 */

export const SAMPLE_ORDER_CONFIRMATION = {
  orderId: 'abc12345-6789-0def-ghij-klmnopqrstuv',
  customerName: 'Aung Myo',
  customerEmail: 'aung.myo@example.com',
  status: 'confirmed' as const,
  placedAt: '2026-02-14T18:30:00Z',
  confirmedAt: '2026-02-14T18:31:00Z',

  items: [
    {
      name: 'Mohinga',
      quantity: 2,
      lineTotalCents: 2800,
      category: 'Soups',
      modifiers: [
        { name: 'Extra Fish Cake', priceDelta: 200 },
        { name: 'Spicy Level: Medium' },
      ],
    },
    {
      name: 'Shan Noodles',
      quantity: 1,
      lineTotalCents: 1500,
      category: 'Noodles',
      modifiers: [{ name: 'No Onions' }],
    },
    {
      name: 'Tea Leaf Salad',
      quantity: 1,
      lineTotalCents: 1200,
      category: 'Salads',
      modifiers: [],
    },
    {
      name: 'Samosa (4 pcs)',
      quantity: 1,
      lineTotalCents: 800,
      category: 'Appetizers',
      modifiers: [],
    },
  ],

  totals: {
    subtotalCents: 6300,
    deliveryFeeCents: 500,
    taxCents: 535,
    totalCents: 7335,
  },

  delivery: {
    address: {
      line1: '456 Elm Street',
      line2: 'Apt 12B',
      city: 'Covina',
      state: 'CA',
      postalCode: '91723',
    },
    windowStart: '2026-02-15T18:00:00Z',
    windowEnd: '2026-02-15T20:00:00Z',
    instructions: 'Gate code #1234. Please ring the doorbell twice.',
    driverName: 'Ko Zaw',
  },
};

export const SAMPLE_CANCELLATION = {
  orderId: 'abc12345-6789-0def-ghij-klmnopqrstuv',
  customerName: 'Aung Myo',
  customerEmail: 'aung.myo@example.com',
  status: 'cancelled' as const,
  placedAt: '2026-02-14T18:30:00Z',
  cancelledAt: '2026-02-14T19:15:00Z',
  reason: 'Changed my mind',
  refundIssued: true,

  items: [
    {
      name: 'Mohinga',
      quantity: 2,
      lineTotalCents: 2800,
      category: 'Soups',
      modifiers: [
        { name: 'Extra Fish Cake', priceDelta: 200 },
        { name: 'Spicy Level: Medium' },
      ],
    },
    {
      name: 'Shan Noodles',
      quantity: 1,
      lineTotalCents: 1500,
      category: 'Noodles',
      modifiers: [{ name: 'No Onions' }],
    },
    {
      name: 'Tea Leaf Salad',
      quantity: 1,
      lineTotalCents: 1200,
      category: 'Salads',
      modifiers: [],
    },
    {
      name: 'Samosa (4 pcs)',
      quantity: 1,
      lineTotalCents: 800,
      category: 'Appetizers',
      modifiers: [],
    },
  ],

  totals: {
    subtotalCents: 6300,
    deliveryFeeCents: 500,
    taxCents: 535,
    totalCents: 7335,
  },
};

export const SAMPLE_REFUND = {
  orderId: 'abc12345-6789-0def-ghij-klmnopqrstuv',
  customerName: 'Aung Myo',
  customerEmail: 'aung.myo@example.com',
  refundedAt: '2026-02-14T20:00:00Z',
  reason: 'Item quality issue',

  // Partial refund: 2 of 4 items
  refundedItems: [
    {
      name: 'Mohinga',
      quantity: 2,
      lineTotalCents: 2800,
      category: 'Soups',
      modifiers: [
        { name: 'Extra Fish Cake', priceDelta: 200 },
        { name: 'Spicy Level: Medium' },
      ],
    },
    {
      name: 'Tea Leaf Salad',
      quantity: 1,
      lineTotalCents: 1200,
      category: 'Salads',
      modifiers: [],
    },
  ],

  originalAmountCents: 7335,
  refundAmountCents: 4000,
  refundMethod: 'Visa ending in 4242',
  refundTimeline: '3-5 business days',
  isPartial: true,
};

export const SAMPLE_DELIVERY_REMINDER = {
  orderId: 'abc12345-6789-0def-ghij-klmnopqrstuv',
  customerName: 'Aung Myo',
  customerEmail: 'aung.myo@example.com',
  itemCount: 4,

  // Tomorrow's delivery
  delivery: {
    address: {
      line1: '456 Elm Street',
      line2: 'Apt 12B',
      city: 'Covina',
      state: 'CA',
      postalCode: '91723',
    },
    windowStart: '2026-02-15T18:00:00Z',
    windowEnd: '2026-02-15T20:00:00Z',
    instructions: 'Gate code #1234. Please ring the doorbell twice.',
  },

  // Highlight items for the excitement header
  highlightItems: ['Mohinga', 'Shan Noodles', 'Tea Leaf Salad', 'Samosa'],
};
