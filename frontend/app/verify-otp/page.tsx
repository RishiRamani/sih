"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/context";
import { RedirectIfAuthed } from "@/lib/auth/guard";
import { ApiError } from "@/lib/api/client";
import { resendOtp } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base" />}>
      <VerifyOtpPageInner />
    </Suspense>
  );
}

function VerifyOtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const next = searchParams.get("next") ?? "/dashboard";
  const { verify } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first box on mount
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // If no email in URL, bounce back to register
  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  function focusBox(index: number) {
    const el = inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))];
    el?.focus();
    el?.select();
  }

  function handleChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // Support paste into a single box
    if (clean.length > 1) {
      const chars = clean.slice(0, OTP_LENGTH - index).split("");
      const updated = [...digits];
      chars.forEach((c, i) => {
        updated[index + i] = c;
      });
      setDigits(updated);
      focusBox(index + chars.length);
      return;
    }

    const updated = [...digits];
    updated[index] = clean;
    setDigits(updated);
    if (index < OTP_LENGTH - 1) focusBox(index + 1);
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const updated = [...digits];
      if (updated[index]) {
        updated[index] = "";
        setDigits(updated);
      } else if (index > 0) {
        updated[index - 1] = "";
        setDigits(updated);
        focusBox(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    } else if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === OTP_LENGTH) void submit(code);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const chars = pasted.slice(0, OTP_LENGTH).split("");
    const updated = Array(OTP_LENGTH).fill("");
    chars.forEach((c, i) => {
      updated[i] = c;
    });
    setDigits(updated);
    focusBox(Math.min(chars.length, OTP_LENGTH - 1));
  }

  async function submit(code: string) {
    setSubmitting(true);
    setError(null);
    try {
      await verify(email, code);
      
      router.replace(next);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Verification failed.";
      setError(message);
      // Clear boxes and refocus so user can retry
      setDigits(Array(OTP_LENGTH).fill(""));
      focusBox(0);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError(`Enter all ${OTP_LENGTH} digits.`);
      return;
    }
    await submit(code);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp(email);
      
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  const masked = email || "your email";

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
              Verify your email
            </h2>
           <div className="mt-3 rounded border border-accent/30 bg-accent-soft px-3 py-3 text-[13px] leading-relaxed text-text-secondary">
    <p>
      We sent a {OTP_LENGTH}-digit code from{" "}
      <span className="font-semibold text-text-primary">Qrypta</span> to{" "}
      <span className="font-semibold text-text-primary">{masked}</span>.
    </p>
    <p className="mt-1.5">
      Don&apos;t see it? Check your{" "}
      <span className="font-semibold text-text-primary">spam</span> or{" "}
      <span className="font-semibold text-text-primary">junk</span> folder —
      the message is sent from a new domain and may be filtered on first
      contact.
    </p>
  </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex justify-between gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={d}
                    disabled={submitting}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className={cn(
                      "h-12 w-11 rounded border bg-elevated text-center font-mono text-xl font-semibold text-text-primary",
                      "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
                      "disabled:opacity-60",
                      d
                        ? "border-accent/60"
                        : "border-border"
                    )}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {error ? (
                <div className="mt-4 rounded border border-crimson/40 bg-crimson/8 px-3 py-2.5 text-sm text-crimson">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={submitting || digits.some((d) => !d)}
                className="mt-5 w-full"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {submitting ? "Verifying…" : "Verify and continue"}
              </Button>
            </form>

            <div className="mt-5 border-t border-border pt-4 text-center text-[12px] text-text-secondary">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-text-secondary disabled:no-underline"
              >
                {resending
                  ? "Sending…"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend code"}
              </button>
            </div>

            <div className="mt-3 text-center text-[12px] text-text-secondary">
              Wrong email?{" "}
              <Link
                href="/register"
                className="font-medium text-accent hover:underline"
              >
                Go back
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </RedirectIfAuthed>
  );
}