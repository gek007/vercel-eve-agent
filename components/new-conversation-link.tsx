"use client";
import Link from "next/link";
export function NewConversationLink({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href="/agent"
      className={className}
      aria-label={ariaLabel}
      prefetch={false}
      onClick={(event) => {
        // URL updates after first send do not remount the sessionless React store.
        // A document navigation guarantees a fresh store while retaining old history.
        event.preventDefault();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Full navigation intentionally remounts Eve; client routing retains the old session.
        window.location.assign("/agent");
      }}
    >
      {children}
    </Link>
  );
}
