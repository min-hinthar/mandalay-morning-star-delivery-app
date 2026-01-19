import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Mail, Phone, User, Lock } from "lucide-react";
import {
  ValidatedInput,
  ValidatedTextarea,
  ValidationMessage,
  FormValidationProvider,
  ValidatedForm,
  validationRules,
  useFieldValidation,
} from "./FormValidation";
import { Button } from "./button";

/**
 * V5 Form Validation System
 *
 * Real-time inline form validation with animated error display.
 * Validates on blur, re-validates on change after error.
 *
 * Features:
 * - Shake animation on error
 * - Animated error message appearance
 * - Success state with check icon
 * - Common validation rules (required, email, phone, minLength, etc.)
 */
const meta: Meta<typeof ValidatedInput> = {
  title: "UI/FormValidation",
  component: ValidatedInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ValidatedInput>;

// Basic required field
export const RequiredField: Story = {
  render: () => {
    const RequiredDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedInput
          label="Full Name"
          placeholder="Enter your name"
          value={value}
          onChange={setValue}
          rules={[validationRules.required("Name is required")]}
          required
        />
      );
    };

    return <RequiredDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Basic required field validation - validates on blur",
      },
    },
  },
};

// Email validation
export const EmailValidation: Story = {
  render: () => {
    const EmailDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedInput
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={value}
          onChange={setValue}
          rules={[
            validationRules.required("Email is required"),
            validationRules.email("Please enter a valid email address"),
          ]}
          leftIcon={<Mail className="h-4 w-4" />}
          helperText="We'll never share your email"
          required
        />
      );
    };

    return <EmailDemo />;
  },
};

// Phone validation
export const PhoneValidation: Story = {
  render: () => {
    const PhoneDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedInput
          label="Phone Number"
          type="tel"
          placeholder="(555) 123-4567"
          value={value}
          onChange={setValue}
          rules={[
            validationRules.required("Phone number is required"),
            validationRules.phone("Please enter a valid phone number"),
          ]}
          leftIcon={<Phone className="h-4 w-4" />}
          required
        />
      );
    };

    return <PhoneDemo />;
  },
};

// Password with min length
export const PasswordValidation: Story = {
  render: () => {
    const PasswordDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedInput
          label="Password"
          type="password"
          placeholder="Enter password"
          value={value}
          onChange={setValue}
          rules={[
            validationRules.required("Password is required"),
            validationRules.minLength(8, "Password must be at least 8 characters"),
          ]}
          leftIcon={<Lock className="h-4 w-4" />}
          helperText="Must be at least 8 characters"
          required
        />
      );
    };

    return <PasswordDemo />;
  },
};

// Custom pattern validation
export const PatternValidation: Story = {
  render: () => {
    const PatternDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedInput
          label="Promo Code"
          placeholder="XXXX-XXXX"
          value={value}
          onChange={setValue}
          rules={[
            validationRules.pattern(
              /^[A-Z0-9]{4}-[A-Z0-9]{4}$/,
              "Format: XXXX-XXXX (letters and numbers)"
            ),
          ]}
          helperText="Enter your promotional code"
        />
      );
    };

    return <PatternDemo />;
  },
};

// Textarea with character count
export const TextareaWithCount: Story = {
  render: () => {
    const TextareaDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedTextarea
          label="Special Instructions"
          placeholder="Add any special requests for your order..."
          value={value}
          onChange={setValue}
          rules={[validationRules.maxLength(200, "Maximum 200 characters")]}
          showCharCount
          maxChars={200}
          helperText="Optional - let us know any special requests"
        />
      );
    };

    return <TextareaDemo />;
  },
};

// Required textarea
export const RequiredTextarea: Story = {
  render: () => {
    const TextareaDemo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedTextarea
          label="Feedback"
          placeholder="Tell us about your experience..."
          value={value}
          onChange={setValue}
          rules={[
            validationRules.required("Please provide your feedback"),
            validationRules.minLength(20, "Please write at least 20 characters"),
          ]}
          showCharCount
          required
        />
      );
    };

    return <TextareaDemo />;
  },
};

// Without success state
export const NoSuccessIndicator: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");

      return (
        <ValidatedInput
          label="Username"
          placeholder="Enter username"
          value={value}
          onChange={setValue}
          rules={[validationRules.required()]}
          showSuccess={false}
          required
        />
      );
    };

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Validation without showing the success check icon",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <ValidatedInput
      label="Email (Verified)"
      value="verified@example.com"
      onChange={() => {}}
      disabled
      helperText="Contact support to change your email"
    />
  ),
};

// Validation states showcase
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <ValidatedInput
        label="Idle State"
        placeholder="Not yet validated"
        onChange={() => {}}
      />
      <ValidatedInput
        label="Valid State"
        value="john@example.com"
        onChange={() => {}}
        validationState="valid"
        leftIcon={<Mail className="h-4 w-4" />}
      />
      <ValidatedInput
        label="Invalid State"
        value="invalid-email"
        onChange={() => {}}
        validationState="invalid"
        errorMessage="Please enter a valid email address"
        leftIcon={<Mail className="h-4 w-4" />}
      />
      <ValidatedInput
        label="Disabled State"
        value="disabled@example.com"
        onChange={() => {}}
        disabled
      />
    </div>
  ),
};

// Standalone validation message
export const ValidationMessages: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <p className="text-sm font-medium mb-2">Error Message</p>
        <ValidationMessage
          message="This field is required"
          type="error"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Success Message</p>
        <ValidationMessage
          message="Email verified successfully"
          type="success"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Standalone validation messages for custom implementations",
      },
    },
  },
};

// Full form example
export const CompleteForm: Story = {
  render: () => {
    const FormDemo = () => {
      const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });

      const handleSubmit = () => {
        alert("Form submitted successfully!\n" + JSON.stringify(formData, null, 2));
      };

      return (
        <FormValidationProvider>
          <ValidatedForm
            onValidSubmit={handleSubmit}
            onInvalidSubmit={() => alert("Please fix the errors above")}
            className="space-y-4 w-80"
          >
            <ValidatedInput
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
              rules={[validationRules.required("Name is required")]}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            <ValidatedInput
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
              rules={[
                validationRules.required("Email is required"),
                validationRules.email(),
              ]}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <ValidatedInput
              label="Phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(v) => setFormData((p) => ({ ...p, phone: v }))}
              rules={[
                validationRules.required("Phone is required"),
                validationRules.phone(),
              ]}
              leftIcon={<Phone className="h-4 w-4" />}
              required
            />

            <ValidatedInput
              label="Delivery Address"
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={(v) => setFormData((p) => ({ ...p, address: v }))}
              rules={[
                validationRules.required("Address is required"),
                validationRules.minLength(10, "Please enter a complete address"),
              ]}
              required
            />

            <ValidatedTextarea
              label="Special Instructions"
              placeholder="Any notes for your order..."
              value={formData.notes}
              onChange={(v) => setFormData((p) => ({ ...p, notes: v }))}
              showCharCount
              maxChars={200}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full">
                Place Order
              </Button>
            </div>
          </ValidatedForm>
        </FormValidationProvider>
      );
    };

    return <FormDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Complete checkout form with multiple validated fields",
      },
    },
  },
};

// Using the validation hook
export const WithHook: Story = {
  render: () => {
    const HookDemo = () => {
      const [value, setValue] = useState("");
      const validation = useFieldValidation([
        validationRules.required("This field is required"),
        validationRules.minLength(3, "Minimum 3 characters"),
      ]);

      const handleBlur = () => {
        validation.validate(value);
      };

      return (
        <div className="space-y-2 w-80">
          <label className="block text-sm font-medium">
            Custom Input (using hook)
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (validation.state === "invalid") {
                validation.validate(e.target.value);
              }
            }}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border-2 rounded-lg transition-colors ${
              validation.state === "invalid"
                ? "border-[var(--color-status-error)] bg-[var(--color-status-error-bg)]"
                : validation.state === "valid"
                  ? "border-[var(--color-accent-secondary)]"
                  : "border-[var(--color-border)]"
            }`}
            placeholder="Type something..."
          />
          <ValidationMessage message={validation.message} type="error" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            State: {validation.state}
          </p>
        </div>
      );
    };

    return <HookDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: "Using useFieldValidation hook for custom input implementations",
      },
    },
  },
};
