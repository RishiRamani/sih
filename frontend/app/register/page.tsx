"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/context";
import { RedirectIfAuthed } from "@/lib/auth/guard";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base" />}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const toast = useToast();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
setError(null);
try {
  await register({ email: email.trim(), password });
  const params = new URLSearchParams({ email: email.trim() });
  if (next !== "/dashboard") params.set("next", next);
  router.replace(`/verify-otp?${params.toString()}`);
} catch (err) {
  setError(err instanceof Error ? err.message : "Registration failed.");
} finally {
  setSubmitting(false);
}
  }

  return (
    <RedirectIfAuthed>
      <div className="flex min-h-screen items-center justify-center bg-base px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <span className="flex h-11 w-11 items-center justify-center rounded border border-accent/40 bg-accent-soft">
              <ShieldCheck size={18} className="text-accent" />
            </span>
            <h1 className="mt-4 font-mono text-[22px] font-semibold tracking-[0.18em] text-text-primary">
              QR Y P T A
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              Cryptographic inventory
            </p>
          </div>

          <Card bodyClassName="px-6 py-6">
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-text-primary">
              Create account
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              You&apos;ll receive a 6-digit code to verify your email.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary"
                >
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
                  placeholder="Re-enter your password"
                />
              </div>

              {error ? (
                <div className="rounded border border-crimson/40 bg-crimson/8 px-3 py-2.5 text-sm text-crimson">
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <div className="mt-5 border-t border-border pt-4 text-center text-[12px] text-text-secondary">
              Already have an account?{" "}
              <Link
                href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-medium text-accent hover:underline"
              >
                Sign in
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </RedirectIfAuthed>
  );
}