import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
export default function SignUpPage() {
  return (
    <main className="auth-page">
      <Link href="/" className="brand">
        Ledger
        <span className="brand-dot" />
      </Link>
      <SignUp />
    </main>
  );
}
