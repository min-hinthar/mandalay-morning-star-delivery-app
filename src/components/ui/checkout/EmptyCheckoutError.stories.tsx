import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyCheckoutError } from "./EmptyCheckoutError";

/**
 * Phase 110 CFIX-02 — Storybook stories for the render-time empty cart
 * error component. Verifies visual parity across light/dark/mobile viewports
 * without needing an end-to-end cart state setup.
 */
const meta: Meta<typeof EmptyCheckoutError> = {
  title: "Checkout/EmptyCheckoutError",
  component: EmptyCheckoutError,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof EmptyCheckoutError>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const Dark: Story = {
  parameters: { backgrounds: { default: "dark" } },
  globals: { theme: "dark" },
};
