import { requireAuthenticatedPage } from "@/lib/auth/page";
import { AppShell } from "@/components/app-shell";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedPage();
  return <AppShell>{children}</AppShell>;
}
