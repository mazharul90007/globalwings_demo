"use client";

import { ChevronDown, Mail, Phone, Plus, Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { staffById } from "@/lib/data";
import type { staffAvailability } from "@/lib/logic";
import { fmtRange } from "@/lib/time";
import { Avatar, Button, inputCls } from "@/components/ui/primitives";

export type Invitee = { key: string; staffId?: number; email: string; name: string; whatsapp?: string };
type Availability = ReturnType<typeof staffAvailability>;

/** Staff invitees who are busy at the chosen time. Invites cannot be sent while this list is not empty. */
export const busyInvitees = (invitees: Invitee[], availability: Availability) =>
  invitees.filter((i) => i.staffId && availability.find((a) => a.staff.id === i.staffId)?.busy);

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "agent", label: "Agent" },
  { key: "counsellor", label: "Counsellor" },
] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number]["key"];

/** "Counsellor" also matches "Senior Counsellor". */
const matchesRole = (role: string, filter: RoleFilter) => filter === "all" || role.toLowerCase().includes(filter);

const subLabel = "mb-1.5 block text-[12.5px] font-semibold text-[#495057]";

/**
 * Two parts:
 * - Internal staffs: role filter (All, Agent, Counsellor) and a searchable staff field.
 *   Available staff come first; busy staff are greyed out with their busy time.
 * - External person: name, email and WhatsApp number for people outside the team.
 * `taken` holds people who are already on the meeting, so they cannot be added twice.
 */
export function InviteePicker({
  value,
  onChange,
  availability,
  taken = [],
  timeOk = true,
  showExternal = true,
  allowBusy = false,
  staffLabel = "Internal staffs",
}: {
  value: Invitee[];
  onChange: (list: Invitee[]) => void;
  availability: Availability;
  taken?: { staffId?: number; email: string }[];
  /** False while the date or time is not valid. Availability depends on it, so the list waits. */
  timeOk?: boolean;
  /** Tasks are for staff only, so they hide the external person fields. */
  showExternal?: boolean;
  /** Tasks may overlap: busy staff can still be picked, with a warning. Meetings block them. */
  allowBusy?: boolean;
  staffLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [ext, setExt] = useState({ name: "", email: "", whatsapp: "" });
  const [extErr, setExtErr] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const all = [...taken, ...value];
  const isIn = (staffId: number) => all.some((i) => i.staffId === staffId);
  const q = query.trim().toLowerCase();
  const shown = availability.filter(
    (a) => !isIn(a.staff.id) && matchesRole(a.staff.role, role) && (!q || a.staff.name.toLowerCase().includes(q)),
  );
  const free = shown.filter((a) => !a.busy);
  const busyStaff = shown.filter((a) => a.busyAt);
  const busyChosen = allowBusy ? [] : busyInvitees(value, availability);

  const pickStaff = (id: number) => {
    const staff = staffById(id);
    onChange([
      ...value,
      { key: `s${staff.id}`, staffId: staff.id, email: `${staff.name.split(" ")[0].toLowerCase()}@globalwings.example`, name: staff.name },
    ]);
    setQuery("");
    setOpen(false);
  };

  const addExternal = () => {
    const name = ext.name.trim();
    const email = ext.email.trim().toLowerCase();
    const whatsapp = ext.whatsapp.trim();
    if (!name) return setExtErr("Enter the person's name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setExtErr("Enter a valid email address. The invite is sent there.");
    if (whatsapp && !/^\+?[\d\s-]{8,18}$/.test(whatsapp)) return setExtErr("Enter a valid WhatsApp number, for example +880 1712 345678.");
    if (all.some((i) => i.email.toLowerCase() === email)) return setExtErr("This person is already invited.");
    onChange([...value, { key: email, email, name, whatsapp: whatsapp || undefined }]);
    setExt({ name: "", email: "", whatsapp: "" });
    setExtErr("");
  };

  const extField = (k: keyof typeof ext, v: string) => {
    setExt((e) => ({ ...e, [k]: v }));
    setExtErr("");
  };
  const onExtKey = (e: React.KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), addExternal());

  return (
    <div className="space-y-4">
      {/* Internal staffs */}
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className={`${subLabel} mb-0`}>{staffLabel}</span>
          <div className="flex rounded-lg bg-page p-0.5" role="radiogroup" aria-label="Filter staff by role">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={role === r.key}
                onClick={() => {
                  setRole(r.key);
                  setOpen(true);
                  inputRef.current?.focus();
                }}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                  role === r.key ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative" ref={dropRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              // Enter picks the first available match.
              if (e.key === "Enter") {
                e.preventDefault();
                const first = allowBusy ? shown[0] : free[0];
                if (timeOk && first) pickStaff(first.staff.id);
              }
            }}
            placeholder={
              role === "all" ? "Search staff by name" : `Search ${role === "agent" ? "agents" : "counsellors"} by name`
            }
            className={`${inputCls} pl-9 pr-9`}
            role="combobox"
            aria-expanded={open}
            aria-controls="staff-options"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((o) => !o)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted"
            aria-label="Show staff list"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          {open && (
            <div id="staff-options" className="absolute inset-x-0 top-11 z-20 max-h-64 animate-pop overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-line">
              {!timeOk ? (
                <p className="p-3 text-center text-muted">Set a valid date and time first. Then you will see who is available.</p>
              ) : (
                <>
                  {free.length === 0 && busyStaff.length === 0 && (
                    <p className="p-3 text-center text-muted">
                      {q ? `No staff match "${query.trim()}".` : "Nobody else is available at this time."}
                    </p>
                  )}
                  {free.map(({ staff }) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => pickStaff(staff.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-page"
                    >
                      <span className="relative">
                        <Avatar name={staff.name} color={staff.color} size={30} />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-ok ring-2 ring-white" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{staff.name}</span>
                        <span className="text-[11.5px] text-muted">{staff.role}</span>
                      </span>
                      <span className="text-[11.5px] font-semibold text-ok">Available</span>
                    </button>
                  ))}
                  {busyStaff.length > 0 && (
                    <>
                      <p className="mt-1 border-t border-line px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                        Busy at this time
                      </p>
                      {busyStaff.map(({ staff, busyAt }) => (
                        <div
                          key={staff.id}
                          role={allowBusy ? "button" : undefined}
                          aria-disabled={!allowBusy}
                          onClick={allowBusy ? () => pickStaff(staff.id) : undefined}
                          title={`${staff.name} is busy: ${busyAt!.title}, ${fmtRange(busyAt!.start, busyAt!.end)}`}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 ${
                            allowBusy ? "cursor-pointer opacity-80 hover:bg-page" : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span className="relative grayscale">
                            <Avatar name={staff.name} color={staff.color} size={30} />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-bad ring-2 ring-white" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{staff.name}</span>
                            <span className="block truncate text-[11.5px] text-muted">
                              {staff.role} · {busyAt!.title}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-[11.5px] font-semibold text-bad">
                            Busy {fmtRange(busyAt!.start, busyAt!.end)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* External person */}
      {showExternal && <div>
        <span className={subLabel}>External person</span>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={ext.name}
              onChange={(e) => extField("name", e.target.value)}
              onKeyDown={onExtKey}
              placeholder="Name"
              aria-label="External person name"
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={ext.email}
              onChange={(e) => extField("email", e.target.value)}
              onKeyDown={onExtKey}
              placeholder="Email"
              aria-label="External person email"
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="tel"
              value={ext.whatsapp}
              onChange={(e) => extField("whatsapp", e.target.value)}
              onKeyDown={onExtKey}
              placeholder="WhatsApp number"
              aria-label="External person WhatsApp number"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={`text-[12px] ${extErr ? "text-bad" : "text-muted"}`}>
            {extErr || "For students, agents or anyone outside the team. Name and email are required."}
          </p>
          <Button type="button" variant="soft" size="sm" onClick={addExternal}>
            <Plus className="h-4 w-4" /> Add person
          </Button>
        </div>
      </div>}

      {/* Chosen people */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          {value.map((i) => {
            const busy = i.staffId ? availability.find((a) => a.staff.id === i.staffId)?.busyAt : null;
            return (
              <span
                key={i.key}
                title={i.staffId ? staffById(i.staffId).role : [i.email, i.whatsapp].filter(Boolean).join(" · ")}
                className={`flex animate-pop items-center gap-2 rounded-full py-1 pl-1 pr-2 text-[12.5px] font-medium ring-1 ${
                  !busy ? "bg-white ring-line" : allowBusy ? "bg-warn-soft text-[#8a5c06] ring-warn/50" : "bg-bad-soft text-[#b33b22] ring-bad/40"
                }`}
              >
                <Avatar name={i.name} size={22} color={i.staffId ? staffById(i.staffId).color : undefined} />
                {i.name}
                {!i.staffId && <span className="rounded bg-info-soft px-1 text-[10px] font-bold text-[#1d7fb6]">EXTERNAL</span>}
                {busy && <span className="text-[11px] font-semibold">· Busy {fmtRange(busy.start, busy.end)}</span>}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x.key !== i.key))}
                  className="text-muted hover:text-bad"
                  aria-label={`Remove ${i.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {busyChosen.length > 0 && <p className="text-[12px] text-bad">Remove the busy staff or pick another time to send the invites.</p>}
    </div>
  );
}
