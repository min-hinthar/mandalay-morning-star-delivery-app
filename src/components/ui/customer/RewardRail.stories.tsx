import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Truck, Star, Crown } from "lucide-react";
import { RewardRail } from "./RewardRail";

const meta: Meta<typeof RewardRail> = {
  title: "Customer/RewardRail",
  component: RewardRail,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof RewardRail>;

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const DualRail: Story = {
  args: {
    goals: [
      {
        id: "delivery",
        label: "Free delivery",
        icon: Truck,
        value: 8800,
        target: 10000,
        formatRemaining: money,
        reachedLabel: "Unlocked!",
        tone: "delivery",
      },
      {
        id: "reward",
        label: "Next Star reward",
        icon: Star,
        value: 7000,
        target: 15000,
        formatRemaining: money,
        reachedLabel: "Ready to redeem",
        tone: "reward",
      },
    ],
  },
};

export const OneReached: Story = {
  args: {
    goals: [
      {
        id: "delivery",
        label: "Free delivery",
        icon: Truck,
        value: 10000,
        target: 10000,
        formatRemaining: money,
        reachedLabel: "Unlocked!",
        tone: "delivery",
      },
      {
        id: "tier",
        label: "Moon tier",
        icon: Crown,
        value: 42000,
        target: 60000,
        formatRemaining: money,
        reachedLabel: "You're a Moon!",
        tone: "tier",
      },
    ],
  },
};

export const Dark: Story = {
  args: DualRail.args,
  parameters: { backgrounds: { default: "dark" } },
  globals: { theme: "dark" },
};
