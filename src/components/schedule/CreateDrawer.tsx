"use client";

import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Flag,
  ListTodo,
  MapPin,
  Paperclip,
  Phone,
  Send,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { STAFF, staffById } from "@/lib/data";
import { staffAvailability } from "@/lib/logic";
import { useStore } from "@/lib/store";
import { LAST_MIN, fmtDate, keepInFuture, nowMinutes, stampNow, fmtTime, fromMin, toMin } from "@/lib/time";
import type { Meeting, Mode, Priority, Todo } from "@/lib/types";
import { Button, Drawer, Field, inputCls } from "@/components/ui/primitives";
import { InviteePicker, busyInvitees, type Invitee } from "./InviteePicker";
import { TimeFields, pastError, timeError } from "./TimeFields";

export interface CreatePreset {
  kind: "meeting" | "todo";
  date: string;
  start: string;
  title?: string;
}



function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div className="flex rounded-lg bg-page p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] font-semibold transition ${
            value === o.value ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {o.icon && <o.icon className="h-4 w-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CreateDrawer({ preset, onClose, onCreated }: { preset: CreatePreset | null; onClose: () => void; onCreated: (date: string) => void }) {
  return (
    <Drawer open={!!preset} onClose={onClose} width={520}>
      {preset && <CreateForm key={JSON.stringify(preset)} preset={preset} onClose={onClose} onCreated={onCreated} />}
    </Drawer>
  );
}

function CreateForm({ preset, onClose, onCreated }: { preset: CreatePreset; onClose: () => void; onCreated: (date: string) => void }) {
  const { me: meId, items, elapsed, addItem, toast } = useStore();
  const nowMin = nowMinutes(elapsed);
  const [kind, setKind] = useState(preset.kind);
  const [title, setTitle] = useState(preset.title ?? "");
  const [date, setDate] = useState(preset.date);
  // A meeting cannot start in the past, so a start time that has already gone today moves to the next quarter hour.
  const [initial] = useState(() => {
    const end = fromMin(Math.min(toMin(preset.start) + 60, LAST_MIN));
    return preset.kind === "meeting" ? keepInFuture(preset.date, preset.start, end, nowMin) : { start: preset.start, end };
  });
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [mode, setMode] = useState<Mode>("online");
  const [where, setWhere] = useState("");
  const [agenda, setAgenda] = useState("");
  const [deadline, setDeadline] = useState("");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  // task
  const [hasTime, setHasTime] = useState(false);
  const [priority, setPriority] = useState<Priority>("normal");
  const [notes, setNotes] = useState("");
  const [assignees, setAssignees] = useState<Invitee[]>([]);

  // Meetings cannot be booked in the past; tasks can (for logging work already done).
  const timeOk = !timeError(start, end);
  // The "time has passed" check runs only when the user saves a meeting.
  const [saveError, setSaveError] = useState("");
  const availability = useMemo(
    () => (timeOk ? staffAvailability(date, start, end, items, meId) : []),
    [timeOk, date, start, end, items, meId],
  );
  const busyChosen = busyInvitees(invitees, availability);
  // A task without a time blocks nobody, so every staff member shows as available.
  const taskAvailability = useMemo(
    () =>
      hasTime
        ? availability
        : STAFF.filter((s) => s.id !== meId).map((s) => ({ staff: s, busy: null as string | null, busyAt: null })),
    [hasTime, availability, meId],
  );

  const canSave =
    kind === "meeting"
      ? title.trim() && timeOk && invitees.length > 0 && busyChosen.length === 0 && (mode === "online" || where.trim())
      : title.trim() && (!hasTime || timeOk);

  const save = () => {
    if (!canSave) return;
    const late = kind === "meeting" ? pastError(date, start, nowMin) : null;
    if (late) return setSaveError(late);
    const id = `new-${Date.now()}`;
    if (kind === "meeting") {
      const m: Meeting = {
        id,
        kind: "meeting",
        title: title.trim(),
        date,
        start,
        end,
        mode,
        link: mode === "online" ? where || "https://meet.google.com/new-meet-ing" : undefined,
        location: mode === "in-person" ? where : undefined,
        phone: mode === "phone" ? where : undefined,
        agenda: agenda || undefined,
        organizerId: meId,
        participants: invitees.map((i, n) => ({
          id: `${id}-p${n}`,
          staffId: i.staffId,
          name: i.name,
          email: i.email,
          whatsapp: i.whatsapp,
          external: !i.staffId,
          status: "pending",
        })),
        activity: [{ at: stampNow(), text: `Meeting created and invites sent to ${invitees.length} people` }],
      };
      addItem(m);
      toast(`Invites sent to ${invitees.length} ${invitees.length === 1 ? "person" : "people"}`, `${m.title} · ${fmtDate(date)}, ${fmtTime(start)}`, "ok");
    } else {
      const t: Todo = {
        id,
        kind: "todo",
        title: title.trim(),
        date,
        start: hasTime ? start : undefined,
        end: hasTime ? end : undefined,
        priority,
        done: false,
        notes: notes || undefined,
        ownerId: meId,
        assignees: assignees.length ? assignees.map((a) => ({ staffId: a.staffId!, status: "pending" })) : undefined,
      };
      addItem(t);
      const when = `${fmtDate(date)}${hasTime ? `, ${fmtTime(start)}` : ""}`;
      if (assignees.length) {
        toast(`Task sent to ${assignees.map((a) => staffById(a.staffId!).name.split(" ")[0]).join(", ")}`, `${t.title} · ${when}. They can accept or reject it.`, "ok");
      } else {
        toast("Task added", `${t.title} · ${when}`, "ok");
      }
    }
    onCreated(date);
    onClose();
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[16px] font-bold">New schedule item</h2>
          <p className="text-[12.5px] text-muted">Add a meeting with people, or a task for yourself or your team.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-page hover:text-ink" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "meeting", label: "Meeting", icon: Users },
            { value: "todo", label: "Task", icon: ListTodo },
          ]}
        />

        <Field label="Title">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "meeting" ? "e.g. Visa file review" : "e.g. Review Ayesha's bank statement"}
            className={inputCls}
          />
        </Field>

        {/* When */}
        <section className="rounded-xl border border-line p-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-muted">
            <CalendarDays className="h-4 w-4" /> When {kind === "meeting" && <span className="font-medium normal-case tracking-normal">· set this first, it decides who is available</span>}
          </p>
          <TimeFields
            date={date}
            start={start}
            end={end}
            onDate={(d) => {
              setDate(d);
              setSaveError("");
            }}
            onTime={(s, e) => {
              setStart(s);
              setEnd(e);
              setSaveError("");
            }}
            showTime={kind === "meeting" || hasTime}
          />
          {kind === "todo" && (
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} className="h-4 w-4 accent-brand" />
              Set a time <span className="text-muted">(blocks your calendar; without a time it sits in the day&apos;s task list)</span>
            </label>
          )}
        </section>

        {kind === "meeting" ? (
          <>
            {/* Who */}
            <section className="rounded-xl border border-line p-4">
              <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-muted">
                <Users className="h-4 w-4" /> Invitees
              </p>

              <InviteePicker value={invitees} onChange={setInvitees} availability={availability} timeOk={timeOk} />
            </section>

            {/* Details */}
            <section className="space-y-4 rounded-xl border border-line p-4">
              <Field label="Mode">
                <Segmented
                  value={mode}
                  onChange={(v) => {
                    setMode(v);
                    setWhere("");
                  }}
                  options={[
                    { value: "online", label: "Online", icon: Video },
                    { value: "in-person", label: "In person", icon: MapPin },
                    { value: "phone", label: "Phone", icon: Phone },
                  ]}
                />
              </Field>
              <Field label={mode === "online" ? "Meeting link" : mode === "phone" ? "Phone number" : "Location"}>
                <input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder={mode === "online" ? "Paste a Zoom, Google Meet or Teams link" : mode === "phone" ? "+880 17..." : "Address or room"}
                  className={inputCls}
                />
              </Field>
              <Field label="Agenda">
                <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} placeholder="What will you discuss?" className={`${inputCls} h-auto py-2`} />
              </Field>
              <Field label="Response deadline">
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inputCls} sm:max-w-[50%]`} />
              </Field>
              <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line py-4 text-muted">
                <Paperclip className="h-4 w-4" /> Drop files to attach to the invite
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-4 rounded-xl border border-line p-4">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-muted">
                <UserPlus className="h-4 w-4" /> Assign to
                <span className="font-medium normal-case tracking-normal">· optional, leave empty to keep it for yourself</span>
              </p>
              <InviteePicker
                value={assignees}
                onChange={setAssignees}
                availability={taskAvailability}
                timeOk={!hasTime || timeOk}
                showExternal={false}
                allowBusy
                staffLabel="Staff"
              />
            </div>
            <Field label="Priority">
              <Segmented
                value={priority}
                onChange={setPriority}
                options={[
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High", icon: Flag },
                ]}
              />
            </Field>
            <Field label="Notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Details or a checklist" className={`${inputCls} h-auto py-2`} />
            </Field>
          </section>
        )}
      </div>

      {saveError && (
        <p className="flex items-center gap-2 border-t border-bad/30 bg-bad-soft px-5 py-2.5 text-[12.5px] font-medium text-[#b33b22]">
          <CircleAlert className="h-4 w-4 shrink-0" /> {saveError}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-line bg-[#fafbfc] px-5 py-3.5">
        <p className="min-w-0 text-[12px] leading-snug text-muted">
          {kind === "meeting"
            ? invitees.length
              ? `${invitees.length} ${invitees.length === 1 ? "invite" : "invites"} will be emailed with Accept and Reject.`
              : "Add at least one invitee."
            : assignees.length
              ? `${assignees.length} staff will get this task to accept or reject.`
              : "Only you can see this task."}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>
            {kind === "meeting" ? <><Send className="h-4 w-4" /> Save and send invites</> : assignees.length ? <><Send className="h-4 w-4" /> Save and assign</> : <><CircleCheck className="h-4 w-4" /> Save task</>}
          </Button>
        </div>
      </div>
    </>
  );
}
