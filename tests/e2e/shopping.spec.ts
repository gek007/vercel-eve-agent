import { test, expect } from "@playwright/test";
test("cart persists and lost checkout response recovers one order", async ({
  page,
}) => {
  test.skip(
    !process.env.LEDGER_E2E_STATE,
    "Requires real signed-in shopper session.",
  );
  await page.goto("/shop");
  await expect(
    page.getByRole("heading", { name: "Good things. Thoughtfully picked." }),
  ).toBeVisible();
  // Start with an empty cart through the same authenticated API used by the UI.
  await page.evaluate(async () => {
    const r = await fetch("/api/shop?operation=cart");
    const c = await r.json();
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
  });
  await page
    .getByRole("button", {
      name: "Add Arc wireless headphones to cart",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("added to your cart");
  await page.goto("/cart");
  await page
    .getByRole("button", {
      name: "Increase Arc wireless headphones quantity",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Arc wireless headphones quantity", { exact: true }),
  ).toHaveText("2");
  await page.reload();
  await expect(
    page.getByLabel("Arc wireless headphones quantity", { exact: true }),
  ).toHaveText("2");
  const before = await page.evaluate(async () => {
    const r = await fetch("/api/shop?operation=orders");
    return (await r.json()).total;
  });
  let lost = false;
  await page.route("**/api/shop", async (route) => {
    const body = route.request().postDataJSON();
    if (body?.operation === "checkout" && !lost) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check order result", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check order result", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your demo order is placed." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Your cart has room for something good.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View order", exact: true }).click();
  await expect(page.locator(".order-detail")).toContainText(
    "Arc wireless headphones",
  );
  await expect(page.locator(".order-detail footer")).toContainText("$298.00");
  const after = await page.evaluate(async () => {
    const r = await fetch("/api/shop?operation=orders");
    return (await r.json()).total;
  });
  expect(after).toBe(before + 1);
});
