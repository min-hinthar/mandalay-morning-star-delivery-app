import { test, expect } from "@playwright/test";

/**
 * E2E Customer Feedback Tests
 *
 * Tests the customer feedback flow including:
 * - Accessing feedback page for delivered orders
 * - Star rating interaction
 * - Feedback submission
 *
 * Note: Full tests require customer authentication and a delivered order.
 * These tests verify authentication flows and page structure.
 */

test.describe("Customer Feedback Authentication", () => {
  test("feedback page requires authentication", async ({ page }) => {
    // Use a mock order ID
    await page.goto("/orders/00000000-0000-0000-0000-000000000001/feedback");

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test("feedback page with invalid order ID shows error", async ({ page }) => {
    await page.goto("/orders/invalid-id/feedback");

    // Should redirect to login or show error
    await expect(page).toHaveURL(/login/);
  });
});

/**
 * Authenticated Customer Feedback Tests
 *
 * These tests would use a test fixture that authenticates as a customer
 * with a delivered order.
 */
test.describe.skip("Authenticated Feedback Flow", () => {
  test("feedback page shows rating form for delivered order", async ({
    page,
  }) => {
    // Navigate to feedback page for a delivered order
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Should show the feedback form header
    await expect(
      page.getByRole("heading", { name: "How was your delivery?" })
    ).toBeVisible();

    // Should show star rating component
    await expect(page.locator("[data-testid='star-rating']")).toBeVisible();

    // Should show optional feedback textarea
    await expect(
      page.getByPlaceholder("Tell us more about your experience...")
    ).toBeVisible();

    // Should show submit button (disabled without rating)
    const submitButton = page.getByRole("button", { name: "Submit Feedback" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test("can select star rating", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Click on the 4th star
    const stars = page.locator("[data-testid='star-button']");
    await stars.nth(3).click();

    // Submit button should now be enabled
    const submitButton = page.getByRole("button", { name: "Submit Feedback" });
    await expect(submitButton).toBeEnabled();
  });

  test("can submit feedback with rating only", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Select 5 stars
    const stars = page.locator("[data-testid='star-button']");
    await stars.nth(4).click();

    // Submit the feedback
    await page.getByRole("button", { name: "Submit Feedback" }).click();

    // Should show success message
    await expect(page.getByText("Thank You!")).toBeVisible();
    await expect(
      page.getByText("Your feedback helps us improve our service.")
    ).toBeVisible();
  });

  test("can submit feedback with rating and text", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Select 4 stars
    const stars = page.locator("[data-testid='star-button']");
    await stars.nth(3).click();

    // Add feedback text
    await page
      .getByPlaceholder("Tell us more about your experience...")
      .fill("Great delivery! The driver was very friendly.");

    // Submit the feedback
    await page.getByRole("button", { name: "Submit Feedback" }).click();

    // Should show success message
    await expect(page.getByText("Thank You!")).toBeVisible();
  });

  test("shows error when submitting without rating", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Try to submit without selecting a rating (button should be disabled)
    const submitButton = page.getByRole("button", { name: "Submit Feedback" });
    await expect(submitButton).toBeDisabled();
  });

  test("shows already rated state for previously rated order", async ({
    page,
  }) => {
    await page.goto("/orders/test-already-rated-order-id/feedback");

    // Should show thank you message
    await expect(page.getByText("Thanks for your feedback!")).toBeVisible();

    // Should show the previous rating
    await expect(page.getByText("You rated this delivery on")).toBeVisible();

    // Should show Order Again button
    await expect(
      page.getByRole("link", { name: "Order Again" })
    ).toBeVisible();
  });

  test("success state shows navigation options", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Submit rating
    const stars = page.locator("[data-testid='star-button']");
    await stars.nth(4).click();
    await page.getByRole("button", { name: "Submit Feedback" }).click();

    // Should show Order Again link
    await expect(
      page.getByRole("link", { name: "Order Again" })
    ).toBeVisible();

    // Should show View Order link
    await expect(
      page.getByRole("link", { name: "View Order" })
    ).toBeVisible();
  });

  test("back button returns to order page", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Click back button
    await page.getByRole("link", { name: "Back to Order" }).click();

    // Should navigate to order page
    await expect(page).toHaveURL(/\/orders\/test-delivered-order-id$/);
  });

  test("character counter shows feedback text length", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Type some feedback
    await page
      .getByPlaceholder("Tell us more about your experience...")
      .fill("Test feedback message");

    // Should show character count
    await expect(page.getByText("21/500")).toBeVisible();
  });

  test("feedback text is limited to 500 characters", async ({ page }) => {
    await page.goto("/orders/test-delivered-order-id/feedback");

    // Get the textarea
    const textarea = page.getByPlaceholder(
      "Tell us more about your experience..."
    );

    // Check maxLength attribute
    await expect(textarea).toHaveAttribute("maxLength", "500");
  });
});
