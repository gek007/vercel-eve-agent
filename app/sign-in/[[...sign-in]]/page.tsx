import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
export default function SignInPage() { return <main className="auth-page"><Link href="/" className="brand">Ledger<span className="brand-dot" /></Link><SignIn /></main>; }
