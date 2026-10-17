import { requireAuthenticatedPage } from "@/lib/auth/page";
import { queryShop } from "@/lib/shop/client";
import { Catalog } from "@/components/shop/catalog";
import { AccessState } from "@/components/access-state";
export default async function ShopPage() {
  const caller = await requireAuthenticatedPage();
  let data;
  try {
    data = await queryShop(caller, { operation: "catalog" });
  } catch {}
  if (data?.kind === "catalog") return <Catalog initial={data} />;
  return (
    <AccessState message="The shop could not be loaded. Please try again." />
  );
}
