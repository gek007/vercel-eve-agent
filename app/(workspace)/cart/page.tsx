import { requireAuthenticatedPage } from "@/lib/auth/page";
import { queryShop } from "@/lib/shop/client";
import { Cart } from "@/components/shop/cart";
import { AccessState } from "@/components/access-state";
export default async function CartPage() {
  const caller = await requireAuthenticatedPage();
  let data;
  try {
    data = await queryShop(caller, { operation: "cart" });
  } catch {}
  if (data?.kind === "cart") return <Cart initial={data} />;
  return (
    <AccessState message="Your cart could not be loaded. Please try again." />
  );
}
