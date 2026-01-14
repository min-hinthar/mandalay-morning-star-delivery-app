import { fireEvent, render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { SignupForm } from "../signup-form";
import { signUp } from "@/lib/supabase/actions";

vi.mock("@/lib/supabase/actions", () => ({
  signUp: vi.fn(),
}));

describe("SignupForm", () => {
  it("renders the magic link signup form", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send magic link" })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Password")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("We'll email you a magic link to finish signup.")
    ).toBeInTheDocument();
  });

  it("submits the email and shows success text", async () => {
    const signUpMock = signUp as Mock;
    signUpMock.mockResolvedValue({ success: "Signup link sent" });

    const { container } = render(<SignupForm />);
    const input = screen.getByLabelText("Email");
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText("Signup link sent")).toBeInTheDocument();
    expect(signUpMock).toHaveBeenCalledTimes(1);
    const formData = signUpMock.mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("test@example.com");
  });
});
