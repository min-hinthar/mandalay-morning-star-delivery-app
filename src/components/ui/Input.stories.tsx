import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

/**
 * V5 Input System
 *
 * High contrast design with V5 semantic tokens.
 * Height: 44px minimum for accessibility.
 */
const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "success"],
      description: "Visual state of the input",
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Size of the input",
    },
    disabled: {
      control: "boolean",
      description: "Disable the input",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    helperText: {
      control: "text",
      description: "Helper text to display",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

// Default state
export const Default: Story = {
  args: {
    placeholder: "Enter your name",
  },
};

// With value
export const WithValue: Story = {
  args: {
    value: "John Doe",
    onChange: () => {},
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: "sm",
    placeholder: "Small input",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    placeholder: "Large input",
  },
};

// States
export const ErrorState: Story = {
  args: {
    id: "email",
    placeholder: "Enter email",
    value: "invalid-email",
    error: "Please enter a valid email address",
    onChange: () => {},
  },
};

export const SuccessState: Story = {
  args: {
    variant: "success",
    placeholder: "Enter email",
    value: "john@example.com",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "This input is disabled",
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: "phone",
    placeholder: "Enter phone number",
    helperText: "We'll only use this to contact you about your order",
  },
};

// Input types
export const EmailInput: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
};

export const PasswordInput: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
};

export const NumberInput: Story = {
  args: {
    type: "number",
    placeholder: "Quantity",
    min: 1,
    max: 10,
  },
};

export const SearchInput: Story = {
  args: {
    type: "search",
    placeholder: "Search menu...",
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]"
        >
          Full Name
        </label>
        <Input id="name" placeholder="Enter your full name" />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]"
        >
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          helperText="We'll never share your email"
        />
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium mb-1.5 text-[var(--color-text-primary)]"
        >
          Phone Number
        </label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          error="Please enter a valid phone number"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of inputs used in a form with labels, helper text, and error state",
      },
    },
  },
};

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input size="sm" placeholder="Small (36px)" />
      <Input size="default" placeholder="Default (44px)" />
      <Input size="lg" placeholder="Large (48px)" />
    </div>
  ),
};
