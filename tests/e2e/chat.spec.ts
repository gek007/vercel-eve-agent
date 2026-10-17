import { expect, test } from "@playwright/test";
test("new conversation after first message resets the session and preserves replay", async ({
  page,
}) => {
  test.skip(
    !process.env.LEDGER_E2E_STATE,
    "Requires a real Clerk Pro test session and seeded account.",
  );
  await page.goto("/chat");
  await page
    .getByLabel("Ask about your business", { exact: true })
    .fill(
      "What was completed-order revenue from January 1 through September 30, 2026?",
    );
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page
      .locator(".assistant-message .message-text")
      .filter({ hasText: "2,098,181" })
      .first(),
  ).toBeVisible({ timeout: 90000 });
  const firstUrl = page.url();
  await page
    .getByRole("link", { name: "New conversation", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "What would you like to understand?" }),
  ).toBeVisible();
  await expect(page.locator(".chat-message")).toHaveCount(0);
  await page
    .getByLabel("Ask about your business", { exact: true })
    .fill(
      "How many completed orders are in our January through September 2026 data?",
    );
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page
      .locator(".assistant-message .message-text")
      .filter({ hasText: "1,641" })
      .first(),
  ).toBeVisible({ timeout: 90000 });
  expect(page.url()).not.toBe(firstUrl);
  await page.reload();
  await expect(
    page
      .locator(".assistant-message .message-text")
      .filter({ hasText: "1,641" })
      .first(),
  ).toBeVisible({ timeout: 30000 });
});
