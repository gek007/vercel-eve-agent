import { expect, test } from "@playwright/test";
test("Scout changes the cart on request and new conversations preserve replay", async ({
  page,
}) => {
  test.skip(
    !process.env.LEDGER_E2E_STATE,
    "Requires a real Clerk Pro session.",
  );
  await page.goto("/agent");
  await page
    .getByLabel("Ask Scout", { exact: true })
    .fill("Please add one Arc wireless headphones to my cart.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const r = await fetch("/api/shop?operation=cart");
          const c = await r.json();
          return c.lines.some(
            (l: { product: { sku: string }; quantity: number }) =>
              l.product.sku === "CC-001" && l.quantity >= 1,
          );
        }),
      { timeout: 90000 },
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Stop response", exact: true }),
  ).toHaveCount(0, { timeout: 60000 });
  const url = page.url();
  expect(url).toContain("/agent/");
  await page
    .getByRole("link", { name: "New conversation", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "What can I help you find?" }),
  ).toBeVisible();
  await expect(page.locator(".chat-message")).toHaveCount(0);
  await page.goto(url);
  await expect(
    page.locator(".assistant-message .message-text").first(),
  ).toBeVisible({ timeout: 30000 });
  await page
    .getByLabel("Ask Scout", { exact: true })
    .fill("What is currently in my cart?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.locator(".assistant-message .message-text").last(),
  ).toContainText("Arc", { timeout: 90000 });
  await expect(
    page.getByRole("button", { name: "Stop response", exact: true }),
  ).toHaveCount(0, { timeout: 60000 });
  await page.reload();
  await expect(
    page.locator(".assistant-message .message-text").last(),
  ).toContainText("Arc", { timeout: 30000 });
});
