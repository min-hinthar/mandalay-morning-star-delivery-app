import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StarsBalance } from "./StarsBalance";

const meta: Meta<typeof StarsBalance> = {
  title: "Customer/StarsBalance",
  component: StarsBalance,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof StarsBalance>;

export const Progressing: Story = {
  args: { stars: 4, nextRewardAt: 7, tierLabel: "Moon" },
};

export const RewardReady: Story = {
  args: { stars: 7, nextRewardAt: 7, tierLabel: "Sun" },
};

export const Fresh: Story = {
  args: { stars: 1, nextRewardAt: 7, tierLabel: "Star" },
};

export const Dark: Story = {
  args: Progressing.args,
  parameters: { backgrounds: { default: "dark" } },
  globals: { theme: "dark" },
};
