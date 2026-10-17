import { redirect, notFound } from "next/navigation";
export default async function LegacyChat({
  params,
}: {
  params: Promise<{ sessionId?: string[] }>;
}) {
  const { sessionId } = await params;
  if (sessionId && sessionId.length !== 1) notFound();
  redirect(
    "/agent" + (sessionId?.[0] ? "/" + encodeURIComponent(sessionId[0]) : ""),
  );
}
