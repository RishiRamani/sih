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
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const toast = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      toast({ tone: "success", title: "Signed in", description: `Welcome back, ${email.trim()}.` });
      router.replace(next);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed.";
      // Unverified user → send them to OTP verification
      if (err instanceof ApiError && err.status === 403 && err.message.toLowerCase().includes("not verified")) {
        toast({ tone: "info", title: "Verify your email", description: "Enter the code we sent you." });
        router.replace(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(message);
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
              Q R Y P T A
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              Cryptographic inventory
            </p>
          </div>

          <Card bodyClassName="px-6 py-6">
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-text-primary">
              Sign in
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Enter your credentials to access your scans.
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="rounded border border-crimson/40 bg-crimson/8 px-3 py-2.5 text-sm text-crimson">
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-5 border-t border-border pt-4 text-center text-[12px] text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-medium text-accent hover:underline"
              >
                Create one
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </RedirectIfAuthed>
  );
}