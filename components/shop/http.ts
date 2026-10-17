import type { ShopWrite, ShoppingWriteResult } from "@/lib/shop/contracts";
export async function shopFetch<T>(
  query: Record<string, string | number>,
): Promise<T> {
  const res = await fetch(
    "/api/shop?" +
      new URLSearchParams(
        Object.entries(query).map(([k, v]) => [k, String(v)]),
      ),
    { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error ?? "Unable to load your shop. Please try again.",
    );
  return data;
}
export class ShopRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function shopWrite(
  input: ShopWrite,
): Promise<ShoppingWriteResult> {
  const res = await fetch("/api/shop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok)
    throw new ShopRequestError(
      data.error ?? "Your change could not be saved. Please try again.",
      res.status,
    );
  window.dispatchEvent(new Event("shop:cart"));
  return data;
}
