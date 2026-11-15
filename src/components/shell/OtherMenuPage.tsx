"use client";

import { ArrowRight, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/primitives";
import { MAIN_SITE_URL } from "@/lib/nav";

export function OtherMenuPage({ label, icon }: { label: string; icon: string }) {
  return (
    <AppShell title={label} crumbs={["SVP", label]}>
      <Card className="mx-auto mt-6 max-w-[640px] overflow-hidden">
        <div className="h-1.5 bg-brand" />
        <div className="px-8 py-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <i className={`${icon} text-[30px]`} />
          </span>
          <h2 className="mt-5 text-[20px] font-bold">{label} is not part of this prototype</h2>
          <p className="mx-auto mt-2 max-w-[460px] leading-relaxed text-muted">
            This is a dummy project made only to show the <span className="font-semibold text-ink">Schedule Management</span> feature.
            All data here is dummy data. To use {label} and the rest of the portal, visit the main GlobalWings site.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={MAIN_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark"
            >
              Visit GlobalWings <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/schedule"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-soft px-5 py-2.5 font-semibold text-brand transition hover:bg-[#d4ebf7]"
            >
              <CalendarDays className="h-4 w-4" /> Open Schedule <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
