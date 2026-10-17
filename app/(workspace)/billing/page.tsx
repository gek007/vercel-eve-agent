import { auth } from "@clerk/nextjs/server";
import { requireAuthenticatedPage } from "@/lib/auth/page";
import { Billing } from "@/components/shop/billing";
export default async function BillingPage() {
  await requireAuthenticatedPage();
  const identity = await auth();
  return <Billing isPro={identity.has({ plan: "pro" })} />;
}
