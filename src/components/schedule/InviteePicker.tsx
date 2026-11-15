"use client";

import { ChevronDown, Mail, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { staffById } from "@/lib/data";
import type { staffAvailability } from "@/lib/logic";
import { fmtRange } from "@/lib/time";
import { Avatar, Button, inputCls } from "@/components/ui/primitives";

export type Invitee = { key: string; staffId?: number; email: string; name: string };
type Availability = ReturnType<typeof staffAvailability>;

/** Staff invitees who are busy at the chosen time. Invites cannot be sent while this list is not empty. */
export const busyInvitees = (invitees: Invitee[], availability: Availability) =>
  invitees.filter((i) => i.staffId && availability.find((a) => a.staff.id === i.staffId)?.busy);

/**
 * Staff dropdown (available first, busy greyed out), a free email field for people
 * outside the team, and chips for the people picked so far.
 * `taken` holds people who are already on the meeting, so they cannot be added twice.
 */
export function InviteePicker({
  value,
  onChange,
  availability,
  taken = [],
  timeOk = true,
}: {
  value: Invitee[];
  onChange: (list: Invitee[]) => void;
  availability: Availability;
  taken?: { staffId?: number; email: string }[];
  /** False while the date or time is not valid. Availability depends on it, so the list waits. */
  timeOk?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const all = [...taken, ...value];
  const isIn = (staffId: number) => all.some((i) => i.staffId === staffId);
  const free = availability.filter((a) => !a.busy && !isIn(a.staff.id));
  const busyStaff = availability.filter((a) => a.busyAt && !isIn(a.staff.id));
  const busyChosen = busyInvitees(value, availability);

  const addEmail = () => {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setEmailErr("Enter a valid email address.");
    if (all.some((i) => i.email.toLowerCase() === v)) return setEmailErr("This person is already invited.");
    const name = v.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    onChange([...value, { key: v, email: v, name }]);
    setEmail("");
    setEmailErr("");
  };

  return (
    <div>
      <div className="relative" ref={dropRef}>
        <button type="button" onClick={() => setOpen((d) => !d)} className={`${inputCls} flex items-center justify-between text-left`}>
          <span className="text-[#adb5bd]">Add staff who are available at this time</span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
        {open && (
          <div className="absolute inset-x-0 top-11 z-20 max-h-64 animate-pop overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-line">
            {!timeOk ? (
              <p className="p-3 text-center text-muted">Set a valid date and time first. Then you will see who is available.</p>
            ) : (
              free.length === 0 && <p className="p-3 text-center text-muted">Nobody else is available at this time.</p>
            )}
            {free.map(({ staff }) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => {
                  onChange([
                    ...value,
                    { key: `s${staff.id}`, staffId: staff.id, email: `${staff.name.split(" ")[0].toLowerCase()}@globalwings.example`, name: staff.name },
                  ]);
                  setOpen(false);
                }}
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
                <p className="mt-1 border-t border-line px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">Busy at this time</p>
                {busyStaff.map(({ staff, busyAt }) => (
                  <div
                    key={staff.id}
                    aria-disabled="true"
                    title={`${staff.name} is busy: ${busyAt!.title}, ${fmtRange(busyAt!.start, busyAt!.end)}`}
                    className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 opacity-60"
                  >
                    <span className="relative grayscale">
                      <Avatar name={staff.name} color={staff.color} size={30} />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-bad ring-2 ring-white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{staff.name}</span>
                      <span className="block truncate text-[11.5px] text-muted">{busyAt!.title}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11.5px] font-semibold text-bad">Busy {fmtRange(busyAt!.start, busyAt!.end)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
            placeholder="Or type any email address (student, agent...)"
            className={`${inputCls} pl-9`}
          />
        </div>
        <Button type="button" variant="soft" onClick={addEmail}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {emailErr && <p className="mt-1.5 text-[12px] text-bad">{emailErr}</p>}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((i) => {
            const busy = i.staffId ? availability.find((a) => a.staff.id === i.staffId)?.busyAt : null;
            return (
              <span
                key={i.key}
                className={`flex animate-pop items-center gap-2 rounded-full py-1 pl-1 pr-2 text-[12.5px] font-medium ring-1 ${
                  busy ? "bg-bad-soft text-[#b33b22] ring-bad/40" : "bg-white ring-line"
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
      {busyChosen.length > 0 && <p className="mt-2 text-[12px] text-bad">Remove the busy staff or pick another time to send the invites.</p>}
    </div>
  );
}
