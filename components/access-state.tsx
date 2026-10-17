import Link from "next/link";
import { Database, RefreshCcw } from "lucide-react";
export function AccessState({
  message,
  title = "Your data is unavailable",
}: {
  message: string;
  title?: string;
}) {
  return (
    <section className="empty-state">
      <Database size={36} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      <Link href="/dashboard" className="button secondary">
        <RefreshCcw size={16} aria-hidden="true" />
        Try again
      </Link>
    </section>
  );
}
