import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AfterDarkAmbient } from "./AfterDarkAmbient";

/**
 * The shared After Dark living-texture backdrop. Shown on the `.after-dark-canvas`
 * gradient with a sample warm-paper card on top — toggle light/dark + the mobile
 * viewport to confirm the grids + triad aurora read on both themes and that the
 * heavier layers gate to md+.
 */
const meta: Meta<typeof AfterDarkAmbient> = {
  title: "After Dark/AfterDarkAmbient",
  component: AfterDarkAmbient,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OnCanvas: Story = {
  render: () => (
    <div className="after-dark-canvas relative min-h-screen overflow-hidden p-8">
      <AfterDarkAmbient />
      <div className="relative z-10 mx-auto max-w-md">
        <div className="hero-surface-paper relative overflow-hidden rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-hero-ink">
            Warm paper on ambient
          </h2>
          <p className="mt-1 text-sm text-hero-ink-muted">
            Cream card floats over the living texture + triad aurora.
          </p>
        </div>
      </div>
    </div>
  ),
};
