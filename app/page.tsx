import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import {
  ChartNoAxesCombined,
  Sparkles,
  ArrowUpRight,
  Users,
  ShoppingBag,
  ShieldCheck,
  Check,
  ArrowUp,
} from "lucide-react";
import { generateFixtures } from "@/lib/demo/fixtures";
import { summarize } from "@/lib/demo/metrics";
import { money, number } from "@/lib/format";
import { RevenueChart } from "@/components/revenue-chart";
export default function Home() {
  const sample = summarize(
    generateFixtures(),
    { operation: "revenue", groupBy: "month" },
    true,
  );
  return (
    <main className="landing">
      <nav className="public-nav">
        <Link href="/" className="brand">
          <ChartNoAxesCombined size={25} aria-hidden="true" />
          Ledger
          <span className="brand-dot" />
        </Link>
        <div className="public-links">
          <Link href="/pricing">Pricing</Link>
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button className="button secondary">Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Link className="button" href="/dashboard">
            Open workspace
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-intro">
            <span className="status-dot" />
            Your business, in focus
          </div>
          <h1>
            Big picture.
            <br />
            Better questions.
          </h1>
          <p>
            Turn customers, orders, and revenue into a clearer understanding of
            your business. Meet the analyst you can just ask.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="button large">
              Meet your business assistant
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="hero-price">
              Pro, $20 / month
            </Link>
          </div>
          <div className="hero-assurances">
            <span>
              <Check size={15} aria-hidden="true" />
              Your own private workspace
            </span>
            <span>
              <Check size={15} aria-hidden="true" />
              Answers grounded in data
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="preview-window">
            <div className="preview-header">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>Business overview</span>
              <span className="demo-badge">Demo data</span>
            </div>
            <div className="preview-content">
              <div className="preview-revenue">
                <span>Completed revenue</span>
                <strong>{money(sample.revenueCents, true)}</strong>
                <small>January – September 2026</small>
              </div>
              <RevenueChart groups={sample.groups} />
              <div className="preview-bottom">
                <span>
                  <Users size={15} aria-hidden="true" />
                  <strong>250</strong> customers
                </span>
                <span>
                  <ShoppingBag size={15} aria-hidden="true" />
                  <strong>{number(sample.totalOrders)}</strong> orders
                </span>
              </div>
            </div>
          </div>
          <div className="floating-answer">
            <span className="answer-icon">
              <Sparkles size={19} aria-hidden="true" />
            </span>
            <div>
              <strong>The story behind the numbers</strong>
              <p>“Which products brought in the most revenue?”</p>
            </div>
            <ArrowUpRight size={18} aria-hidden="true" />
          </div>
          <div className="visual-caption">
            Sample business. Real questions. Clear answers.
          </div>
        </div>
      </section>
      <section className="feature-strip">
        <div>
          <ChartNoAxesCombined size={24} aria-hidden="true" />
          <h2>See the whole picture</h2>
          <p>Revenue, orders, and customers in one focused workspace.</p>
        </div>
        <div>
          <Sparkles size={24} aria-hidden="true" />
          <h2>Follow your curiosity</h2>
          <p>Ask a question. Compare a period. Find what changed.</p>
        </div>
        <div>
          <ShieldCheck size={24} aria-hidden="true" />
          <h2>Keep it personal</h2>
          <p>A private workspace and conversation history for every member.</p>
        </div>
      </section>
      <section className="landing-question">
        <div>
          <span className="hero-intro">From data to understanding</span>
          <h2>Start with a better question.</h2>
          <p>
            Explore a complete demo business with 250 customers, 40 products,
            and 2,000 orders. No spreadsheet hunting required.
          </p>
        </div>
        <Link className="question-card" href="/chat">
          <Sparkles size={20} aria-hidden="true" />
          <span>How did our revenue change last month?</span>
          <span className="send-button">
            <ArrowUp size={18} aria-hidden="true" />
          </span>
        </Link>
      </section>
      <footer className="landing-footer">
        <Link href="/" className="brand">
          Ledger
          <span className="brand-dot" />
        </Link>
        <span>Business intelligence, in conversation.</span>
        <Link href="/pricing">Plans & billing</Link>
      </footer>
    </main>
  );
}
