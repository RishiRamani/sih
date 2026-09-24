"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./context";
import { LoadingState } from "@/components/ui/States";

/**
 * Renders children only if the user is authenticated.
 * Redirects to /login otherwise, preserving the intended destination.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing } = useAuth();

  useEffect(() => {
  if (initializing) return;
  if (!user) {
    const current = pathname || "/";
    const next =
      current === "/" || current === "/dashboard"
        ? ""
        : `?next=${encodeURIComponent(current)}`;
    router.replace(`/login${next}`);
  }
}, [user, initializing, router, pathname]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <LoadingState label="Checking session" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}

/**
 * Renders children only if the user is NOT authenticated.
 * Used on /login, /register, /verify-otp so a logged-in user
 * is sent straight to the dashboard.
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    if (user) router.replace("/dashboard");
  }, [user, initializing, router]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <LoadingState label="Checking session" />
      </div>
    );
  }

  if (user) return null;
  return <>{children}</>;
}