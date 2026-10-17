import { requireAuthenticatedPage } from "@/lib/auth/page";
import { queryShop } from "@/lib/shop/client";
import { OrderHistory } from "@/components/shop/order-history";
import { AccessState } from "@/components/access-state";
import { notFound } from "next/navigation";
import { AccessError } from "@/lib/auth/policy";
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const caller = await requireAuthenticatedPage();
  const { order } = await searchParams;
  let data, detail;
  try {
    data = await queryShop(caller, { operation: "orders" });
    if (order)
      detail = await queryShop(caller, { operation: "order", orderId: order });
  } catch (e) {
    if (e instanceof AccessError && e.status === 404) notFound();
    return (
      <AccessState message="Your orders could not be loaded. Please try again." />
    );
  }
  if (data.kind === "orders")
    return (
      <OrderHistory
        initial={data}
        detail={detail?.kind === "order" ? detail : undefined}
      />
    );
}
