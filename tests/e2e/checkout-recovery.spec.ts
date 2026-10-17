import { test, expect, type Page } from "@playwright/test";
async function prepare(page: Page) {
  await page.goto("/shop");
  await page.evaluate(async () => {
    const c = await (await fetch("/api/shop?operation=cart")).json();
    for (const l of c.lines)
      await fetch("/api/shop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation: "cart.set",
          productId: l.product.id,
          quantity: 0,
          operationId: crypto.randomUUID(),
        }),
      });
    const products = await (
      await fetch("/api/shop?operation=catalog&search=Arc%20wireless")
    ).json();
    await fetch("/api/shop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operation: "cart.add",
        productId: products.rows[0].id,
        quantity: 1,
        operationId: crypto.randomUUID(),
      }),
    });
  });
  await page.goto("/cart");
}
test("an unresolved checkout survives a stale checkout in another tab", async ({
  page,
  context,
}) => {
  test.skip(!process.env.LEDGER_E2E_STATE, "Requires real shopper session.");
  await prepare(page);
  const second = await context.newPage();
  await second.goto("/cart");
  await second.waitForTimeout(500);
  await expect(
    second.getByRole("button", { name: "Place demo order", exact: true }),
  ).toBeEnabled();
  let dropped = false;
  await page.route("**/api/shop", async (route) => {
    if (route.request().postDataJSON()?.operation === "checkout" && !dropped) {
      dropped = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check order result" }),
  ).toBeVisible();
  await second
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(second.locator(".error-notice")).toContainText("changed");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Check order result", exact: true }),
  ).toBeVisible({ timeout: 5000 });
  await page
    .getByRole("button", { name: "Check order result", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your demo order is placed." }),
  ).toBeVisible();
});
test("checkout still completes when browser storage is unavailable", async ({
  page,
}) => {
  test.skip(!process.env.LEDGER_E2E_STATE, "Requires real shopper session.");
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("circuit-checkout:"))
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await prepare(page);
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your demo order is placed." }),
  ).toBeVisible({ timeout: 5000 });
});
