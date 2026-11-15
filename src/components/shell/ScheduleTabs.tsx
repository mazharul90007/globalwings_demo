"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Calendar / Reports switch shown on the Schedule pages. */
export function ScheduleTabs() {
  const path = usePathname();
  const tabs = [
    { href: "/schedule", label: "Calendar", icon: "ri-calendar-2-line" },
    { href: "/schedule/reports", label: "Reports", icon: "ri-bar-chart-box-line" },
  ];
  return (
    <div className="flex rounded-lg bg-white p-1 shadow-[0_1px_2px_rgba(56,65,74,0.15)]">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition ${
            path === t.href ? "bg-brand text-white" : "text-muted hover:text-ink"
          }`}
        >
          <i className={`${t.icon} text-[15px]`} />
          {t.label}
        </Link>
      ))}
    </div>
  );
}
