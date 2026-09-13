"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastContext = createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[380px] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const toneStyles = {
  success: "border-safe/40 bg-safe-soft text-safe",
  error:   "border-danger/40 bg-danger-soft text-danger",
  info:    "border-accent/40 bg-accent-soft text-accent",
}[toast.tone];

  const Icon = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
  }[toast.tone];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 border bg-surface px-4 py-3 shadow-panel",
        "animate-[slideIn_200ms_ease-out]",
        toneStyles.split(" ").slice(0, 2).join(" ")
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", toneStyles.split(" ").slice(2).join(" "))} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
          {toast.title}
        </p>
        {toast.description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-text-dim hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}