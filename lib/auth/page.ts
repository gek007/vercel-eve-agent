import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { enforcePro, requireAuthConfig } from "./policy";
export async function requireProPage() {
  const config = requireAuthConfig();
  const identity = await auth();
  if (!identity.userId) redirect("/sign-in");
  if (!identity.has({ plan: "pro" })) redirect("/pricing");
  return enforcePro(identity, config.issuer);
}
