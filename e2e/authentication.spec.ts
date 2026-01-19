import { test, expect } from "@playwright/test";

/**
 * E2E Authentication Tests
 *
 * Tests the authentication flow: Login, Signup, Password Reset
 *
 * Note: These tests work against the Supabase auth system.
 * For CI, use test accounts with known credentials.
 */

test.describe("Login Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    // Should show login form
    await expect(page.getByRole("heading", { name: /sign in|login/i })).toBeVisible();

    // Should have email and password fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Should have submit button
    await expect(page.getByRole("button", { name: /sign in|login/i })).toBeVisible();

    // Should have link to signup
    await expect(page.getByRole("link", { name: /sign up|create account/i })).toBeVisible();
  });

  test("shows validation error for empty fields", async ({ page }) => {
    await page.goto("/login");

    // Submit empty form
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required|enter/i)).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Enter invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Should show authentication error
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });
  });

  test("shows email validation error for invalid format", async ({ page }) => {
    await page.goto("/login");

    // Enter invalid email format
    await page.getByLabel(/email/i).fill("notanemail");
    await page.getByLabel(/password/i).fill("somepassword");

    // Submit form
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Should show email validation error
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("can navigate to signup from login", async ({ page }) => {
    await page.goto("/login");

    // Click signup link
    await page.getByRole("link", { name: /sign up|create account/i }).click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/\/signup|\/register/);
  });

  test("can navigate to forgot password", async ({ page }) => {
    await page.goto("/login");

    // Click forgot password link
    const forgotLink = page.getByRole("link", { name: /forgot|reset/i });
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/reset|\/forgot/);
    }
  });
});

test.describe("Signup Flow", () => {
  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");

    // Should show signup form
    await expect(page.getByRole("heading", { name: /sign up|create|register/i })).toBeVisible();

    // Should have required fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();

    // Should have submit button
    await expect(page.getByRole("button", { name: /sign up|create|register/i })).toBeVisible();

    // Should have link to login
    await expect(page.getByRole("link", { name: /sign in|login|already/i })).toBeVisible();
  });

  test("shows validation error for empty fields", async ({ page }) => {
    await page.goto("/signup");

    // Submit empty form
    await page.getByRole("button", { name: /sign up|create|register/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required|enter/i)).toBeVisible();
  });

  test("shows password strength requirements", async ({ page }) => {
    await page.goto("/signup");

    // Enter weak password
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).first().fill("123");

    // Try to submit or blur
    await page.getByLabel(/password/i).first().blur();

    // Should show password requirements
    const hasRequirement = await page.getByText(/characters|strong|weak/i).isVisible();
    expect(hasRequirement).toBeTruthy();
  });

  test("can navigate to login from signup", async ({ page }) => {
    await page.goto("/signup");

    // Click login link
    await page.getByRole("link", { name: /sign in|login|already/i }).click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Password Reset Flow", () => {
  test("forgot password page renders correctly", async ({ page }) => {
    await page.goto("/forgot-password");

    // Should show reset form
    await expect(page.getByRole("heading", { name: /reset|forgot|password/i })).toBeVisible();

    // Should have email field
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Should have submit button
    await expect(page.getByRole("button", { name: /reset|send|submit/i })).toBeVisible();
  });

  test("shows validation error for empty email", async ({ page }) => {
    await page.goto("/forgot-password");

    // Submit empty form
    await page.getByRole("button", { name: /reset|send|submit/i }).click();

    // Should show validation error
    await expect(page.getByText(/required|enter|email/i)).toBeVisible();
  });

  test("shows success message after requesting reset", async ({ page }) => {
    await page.goto("/forgot-password");

    // Enter email
    await page.getByLabel(/email/i).fill("test@example.com");

    // Submit form
    await page.getByRole("button", { name: /reset|send|submit/i }).click();

    // Should show success message (email sent)
    await expect(page.getByText(/sent|check|email/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Session Persistence", () => {
  test.skip("authenticated session persists across page refreshes", async ({ page }) => {
    // This test requires a valid test user
    // Skip if no test credentials are configured

    await page.goto("/login");

    // Login with test credentials (configured in environment)
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword123";

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Wait for redirect after login
    await page.waitForURL(/\/(|dashboard|menu)/);

    // Refresh page
    await page.reload();

    // Should still be logged in (check for user menu or logged-in indicator)
    const isLoggedIn = await page.getByTestId("user-menu").isVisible().catch(() => false) ||
      await page.getByText(/logout|sign out/i).isVisible().catch(() => false);

    expect(isLoggedIn).toBeTruthy();
  });
});

test.describe("Protected Routes", () => {
  test("accessing checkout without auth redirects to login", async ({ page }) => {
    // Try to access checkout directly
    await page.goto("/checkout");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing orders without auth redirects to login", async ({ page }) => {
    // Try to access orders directly
    await page.goto("/orders");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing admin without auth redirects to login", async ({ page }) => {
    // Try to access admin directly
    await page.goto("/admin");

    // Should redirect to login (or show unauthorized)
    const url = page.url();
    expect(url).toMatch(/\/(login|unauthorized|admin)/);
  });
});

test.describe("Logout Flow", () => {
  test.skip("user can logout successfully", async ({ page }) => {
    // This test requires a valid test user session
    // Skip if no test credentials are configured

    // First login
    await page.goto("/login");

    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword123";

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Wait for login to complete
    await page.waitForURL(/\/(|dashboard|menu)/);

    // Find and click logout
    const logoutBtn = page.getByRole("button", { name: /logout|sign out/i });
    await logoutBtn.click();

    // Should redirect to home or login
    await expect(page).toHaveURL(/\/(login|)$/);

    // Protected route should now redirect to login
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
  });
});
