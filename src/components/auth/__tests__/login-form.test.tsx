import { fireEvent, render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { LoginForm } from "../LoginForm";
import { signIn } from "@/lib/supabase/actions";

vi.mock("@/lib/supabase/actions", () => ({
  signIn: vi.fn(),
}));

describe("LoginForm", () => {
  it("renders the magic link login form", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send magic link" })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Password")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("We'll email you a magic link to sign in.")
    ).toBeInTheDocument();
  });

  it("submits the email and shows success text", async () => {
    const signInMock = signIn as Mock;
    signInMock.mockResolvedValue({ success: "Magic link sent" });

    const { container } = render(<LoginForm />);
    const input = screen.getByLabelText("Email");
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText("Magic link sent")).toBeInTheDocument();
    expect(signInMock).toHaveBeenCalledTimes(1);
    const formData = signInMock.mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("test@example.com");
  });
});
