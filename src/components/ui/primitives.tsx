"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { colorFor, initials } from "@/lib/logic";
import type { ParticipantStatus } from "@/lib/types";

const RING: Record<ParticipantStatus, string> = {
  accepted: "ring-ok",
  rejected: "ring-bad",
  pending: "ring-[#ced4da]",
  expired: "ring-warn",
};

export function Avatar({
  name,
  color,
  size = 32,
  status,
  className = "",
}: {
  name: string;
  color?: string;
  size?: number;
  status?: ParticipantStatus;
  className?: string;
}) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${
        status ? `ring-2 ring-offset-2 ring-offset-white ${RING[status]}` : ""
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: color ?? colorFor(name) }}
    >
      {initials(name)}
    </span>
  );
}

const BADGE = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-[#08907e]",
  bad: "bg-bad-soft text-[#d4492c]",
  warn: "bg-warn-soft text-[#b77d14]",
  info: "bg-info-soft text-[#1d7fb6]",
  gray: "bg-[#f1f2f4] text-muted",
};

export function Badge({
  tone = "gray",
  children,
  className = "",
}: {
  tone?: keyof typeof BADGE;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${BADGE[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function statusTone(s: ParticipantStatus) {
  return s === "accepted" ? "ok" : s === "rejected" ? "bad" : s === "expired" ? "warn" : "gray";
}

export function statusLabel(s: ParticipantStatus) {
  return s === "accepted" ? "Accepted" : s === "rejected" ? "Rejected" : s === "expired" ? "Expired" : "Pending";
}

const BTN = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/30",
  ok: "bg-ok text-white hover:bg-[#099885] shadow-sm shadow-ok/30",
  bad: "bg-bad text-white hover:bg-[#d9573c]",
  soft: "bg-brand-soft text-brand hover:bg-[#d4ebf7]",
  ghost: "bg-white text-ink ring-1 ring-line hover:bg-[#f8f9fb]",
  "bad-ghost": "bg-white text-bad ring-1 ring-bad/40 hover:bg-bad-soft",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN;
  size?: "sm" | "md";
}) {
  return (
    <button
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9.5 px-4"
      } ${BTN[variant]} ${className}`}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 440,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex overflow-y-auto bg-[#212529]/40 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="m-auto w-full animate-pop rounded-2xl bg-white shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-[#212529]/30 animate-fade-in" onClick={onClose}>
      <aside
        className="absolute inset-y-0 right-0 flex w-full animate-slide-in flex-col bg-white shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[#495057]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-9.5 w-full rounded-lg border border-[#ced4da] bg-white px-3 text-[13.5px] outline-none transition placeholder:text-[#adb5bd] focus:border-brand focus:ring-3 focus:ring-brand/15";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white shadow-[0_1px_2px_rgba(56,65,74,0.15)] ${className}`}>{children}</div>;
}
