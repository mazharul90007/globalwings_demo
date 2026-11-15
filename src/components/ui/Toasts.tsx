"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const ICON = { ok: CheckCircle2, bad: XCircle, info: Info, warn: TriangleAlert };
const COLOR = { ok: "text-ok", bad: "text-bad", info: "text-info", warn: "text-warn" };
const BAR = { ok: "bg-ok", bad: "bg-bad", info: "bg-info", warn: "bg-warn" };

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  const path = usePathname();
  // Invitee-facing pages are outside SVP, so staff toasts do not show there.
  if (path === "/respond" || path === "/email") return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[340px] flex-col gap-2.5">
      {toasts.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            className="pointer-events-auto relative flex animate-toast-in gap-3 overflow-hidden rounded-xl bg-white p-3.5 pl-4 shadow-[0_10px_30px_-8px_rgba(33,37,41,0.25)] ring-1 ring-line"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${BAR[t.tone]}`} />
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${COLOR[t.tone]}`} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12.5px] text-muted">{t.body}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-muted hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
