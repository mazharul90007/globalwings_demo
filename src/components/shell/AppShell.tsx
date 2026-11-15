"use client";

import { Bell, Check, ChevronDown, ChevronRight, Menu, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STAFF, staffById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import { NAV } from "@/lib/nav";


function Sidebar({ open }: { open: boolean }) {
  const path = usePathname();
  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 z-40 flex w-[250px] flex-col border-r border-[#e5e7eb] bg-[#f9fafb] transition-transform lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <Link href="/menu/dashboard" className="flex h-[70px] shrink-0 items-center px-[1.3rem]">
        <Image src="/globalwings.png" alt="Global Wings" width={180} height={34} priority style={{ width: 180, height: 34 }} />
      </Link>
      <ul className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        <li className="px-5 pb-2 pt-4">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-[#9ca3af]">Menu</span>
        </li>
        {NAV.map((item) => {
          const active = (path === item.href || path.startsWith(item.href + "/"));
          const cls = `flex items-center gap-[0.875rem] border-l-[3px] px-5 py-3 text-[0.9375rem] text-black transition-all duration-150 ${
            active ? "border-[#3b82f6] bg-[#e5e7eb] font-medium text-[#111827]" : "border-transparent font-normal hover:bg-[#f3f4f6] hover:text-[#111827]"
          }`;
          const inner = (
            <>
              <i className={`${item.icon} inline-flex w-5 items-center justify-center text-[1.125rem] ${active ? "text-[#3b82f6]" : "text-black"}`} />
              <span>{item.label}</span>
              {item.isNew && <span className="ml-auto rounded bg-ok px-1.5 py-px text-[10px] font-bold uppercase text-white">New</span>}
            </>
          );
          return (
            <li key={item.label} className="mb-0.5">
              <Link href={item.href} className={cls}>{inner}</Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function NotificationBell() {
  const { notifications, markAllRead } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const dot = { ok: "bg-ok", bad: "bg-bad", info: "bg-info", warn: "bg-warn" };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#495057] transition hover:bg-brand-soft hover:text-brand"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            key={unread}
            className="absolute right-1 top-1 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-bad px-1 text-[10.5px] font-bold text-white"
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] animate-pop overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-line">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <p className="font-semibold">Notifications</p>
            <button onClick={markAllRead} className="text-[12px] text-white/80 hover:text-white">
              Mark all as read
            </button>
          </div>
          <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className={`flex gap-3 px-4 py-3 ${n.unread ? "bg-brand-soft/50" : ""}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.tone]}`} />
                <div>
                  <p className="leading-snug">{n.text}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Demo only: switch between staff accounts to see the schedule from each person's side. */
function ProfileSwitcher() {
  const { me: meId, switchUser } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const me = staffById(meId);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative ml-2 border-l border-line pl-4" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition hover:bg-page"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={me.name} color={me.color} size={34} />
        <span className="hidden leading-tight sm:block">
          <span className="block font-semibold">{me.name}</span>
          <span className="block text-[12px] text-muted">{me.role}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-14 z-50 w-[290px] animate-pop overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-line">
          <div className="border-b border-line px-4 py-3">
            <p className="font-semibold">Switch account</p>
            <p className="text-[12px] text-muted">Demo only. See the schedule from another staff member&apos;s side.</p>
          </div>
          <ul className="max-h-[360px] overflow-y-auto p-1.5 scrollbar-thin">
            {STAFF.map((s) => {
              const active = s.id === meId;
              return (
                <li key={s.id}>
                  <button
                    role="menuitem"
                    onClick={() => {
                      if (!active) switchUser(s.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${active ? "bg-brand-soft" : "hover:bg-page"}`}
                  >
                    <Avatar name={s.name} color={s.color} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className={`block font-medium ${active ? "text-brand" : ""}`}>{s.name}</span>
                      <span className="block text-[11.5px] text-muted">{s.role}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  title,
  crumbs,
  children,
  actions,
}: {
  title: string;
  crumbs: string[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar open={open} />
      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-30 flex h-[70px] items-center gap-3 bg-white px-4 shadow-[0_1px_2px_rgba(56,65,74,0.15)] lg:px-6">
          <button className="text-[#495057] lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search students, files, meetings..."
              className="h-9.5 w-[300px] rounded-lg bg-page pl-9 pr-3 outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ProfileSwitcher />
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[17px] font-bold uppercase tracking-wide text-[#495057]">{title}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                {crumbs.map((c, i) => (
                  <span key={c} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    {c}
                  </span>
                ))}
              </p>
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
