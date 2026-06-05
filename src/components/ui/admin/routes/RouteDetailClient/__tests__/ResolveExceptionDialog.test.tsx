import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResolveExceptionDialog } from "../ResolveExceptionDialog";

afterEach(() => cleanup());

function setup(overrides: Partial<Parameters<typeof ResolveExceptionDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(<ResolveExceptionDialog open onConfirm={onConfirm} onCancel={onCancel} {...overrides} />);
  return { onConfirm, onCancel };
}

describe("ResolveExceptionDialog", () => {
  it("disables Resolve and shows a neutral (non-error) hint while pristine", () => {
    setup();
    const help = document.getElementById("resolution-notes-help")!;
    expect(help).toHaveTextContent("At least 10 characters required.");
    // Pristine: no error color, textarea not flagged invalid.
    expect(help.className).not.toContain("text-destructive");
    expect(screen.getByLabelText("Resolution notes")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("button", { name: "Resolve" })).toBeDisabled();
  });

  it("announces the error (aria-live + error color + aria-invalid) once dirty but too short", async () => {
    setup();
    const textarea = screen.getByLabelText("Resolution notes");
    await userEvent.type(textarea, "short");

    const help = document.getElementById("resolution-notes-help")!;
    // Live region drives the announcement.
    expect(help).toHaveAttribute("aria-live", "polite");
    expect(help.className).toContain("text-destructive");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "resolution-notes-help");
    // Counter reflects trimmed length.
    expect(screen.getByText("5/10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resolve" })).toBeDisabled();
  });

  it("clears the error and confirms with trimmed notes once valid", async () => {
    const { onConfirm } = setup();
    const textarea = screen.getByLabelText("Resolution notes");
    await userEvent.type(textarea, "  redelivered same day  ");

    const help = document.getElementById("resolution-notes-help")!;
    expect(help).toHaveTextContent("Looks good.");
    expect(help.className).not.toContain("text-destructive");
    expect(textarea).toHaveAttribute("aria-invalid", "false");

    const resolve = screen.getByRole("button", { name: "Resolve" });
    expect(resolve).toBeEnabled();
    await userEvent.click(resolve);
    expect(onConfirm).toHaveBeenCalledWith("redelivered same day");
  });

  it("hides the visual heading duplicate from screen readers", () => {
    setup();
    // Modal's title prop names the dialog; the visual <h3> is aria-hidden.
    const heading = screen.getByText("Resolve Exception", { selector: "h3" });
    expect(heading).toHaveAttribute("aria-hidden", "true");
  });
});
