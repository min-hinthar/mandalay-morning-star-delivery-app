import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CutoffCountdown } from "./CutoffCountdown";

/**
 * The "Morning Star" cutoff ritual across its three phases. `now` is frozen so
 * each story renders a stable phase without a live tick.
 */
const meta: Meta<typeof CutoffCountdown> = {
  title: "Customer/CutoffCountdown",
  component: CutoffCountdown,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof CutoffCountdown>;

const NOW = new Date("2026-06-04T12:00:00.000Z");
const offset = (ms: number) => new Date(NOW.getTime() + ms);

export const Calm: Story = {
  args: {
    cutoffAt: offset(6 * 60 * 60 * 1000),
    deliveryDayLabel: "Saturday",
    cutoffLabel: "Thu 6:00 PM",
    now: NOW,
  },
};

export const Urgent: Story = {
  args: {
    cutoffAt: offset(83 * 60 * 1000),
    deliveryDayLabel: "Saturday",
    cutoffLabel: "Thu 6:00 PM",
    now: NOW,
  },
};

export const Locked: Story = {
  args: {
    cutoffAt: offset(-60 * 60 * 1000),
    deliveryDayLabel: "Saturday",
    cutoffLabel: "Thu 6:00 PM",
    now: NOW,
  },
};

/** Post-order: forced locked regardless of the clock (confirmation/tracking). */
export const Confirmed: Story = {
  args: {
    cutoffAt: offset(2 * 60 * 60 * 1000), // future cutoff, but forceLocked wins
    deliveryDayLabel: "Saturday",
    forceLocked: true,
    lockedSubline: "Arriving Saturday, June 6, 2026",
    now: NOW,
  },
};

export const Dark: Story = {
  args: Urgent.args,
  parameters: { backgrounds: { default: "dark" } },
  globals: { theme: "dark" },
};
