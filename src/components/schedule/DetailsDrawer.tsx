"use client";

import {
  Ban,
  CalendarClock,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Flag,
  History,
  Mail,
  Link2,
  NotebookPen,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { STAFF, staffById } from "@/lib/data";
import { assigneeOf, isAssigned, isMeeting, isTodo, myParticipant, needsWrapUp, responseSummary, staffAvailability, taskProgress, todoState } from "@/lib/logic";
import { useStore } from "@/lib/store";
import { TODAY, addDays, fmtDate, fmtDateLong, fmtRange, fmtTime, isPast, nowMinutes, stampNow, toMin } from "@/lib/time";
import type { Meeting, Participant, Priority, TaskAssignee, Todo } from "@/lib/types";
import { Avatar, Badge, Button, Drawer, Field, Modal, inputCls, statusLabel, statusTone } from "@/components/ui/primitives";
import { ModeIcon } from "./EventCard";
import { InviteePicker, busyInvitees, type Invitee } from "./InviteePicker";
import { TimeFields, pastError, timeError } from "./TimeFields";


export function DetailsDrawer({
  id,
  nowMin,
  onClose,
  onOpen,
  onAnswer,
}: {
  id: string | null;
  nowMin: number;
  onClose: () => void;
  onOpen: (id: string) => void;
  onAnswer: (id: string, a: "accepted" | "rejected") => void;
}) {
  const { items } = useStore();
  const item = items.find((i) => i.id === id);
  return (
    <Drawer open={!!item} onClose={onClose} width={540}>
      {item && isMeeting(item) && (
        <MeetingDetails key={item.id} m={item} nowMin={nowMin} onClose={onClose} onOpen={onOpen} onAnswer={onAnswer} />
      )}
      {item && isTodo(item) && <TodoDetails key={item.id} t={item} onClose={onClose} onOpen={onOpen} onAnswer={onAnswer} />}
    </Drawer>
  );
}

function Header({ children, onClose, tone }: { children: React.ReactNode; onClose: () => void; tone: "brand" | "warn" | "ok" | "bad" | "gray" }) {
  const bg = {
    brand: "bg-brand text-white",
    warn: "bg-warn-soft text-[#7a5205]",
    ok: "bg-ok-soft text-[#067a6a]",
    bad: "bg-bad-soft text-[#a8361e]",
    gray: "striped-bg bg-[#f1f2f4] text-[#495057]",
  }[tone];
  return (
    <div className={`relative px-5 pb-5 pt-4 ${bg}`}>
      <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 opacity-80 hover:bg-black/10 hover:opacity-100" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
      {children}
    </div>
  );
}

function MeetingDetails({
  m,
  nowMin,
  onClose,
  onOpen,
  onAnswer,
}: {
  m: Meeting;
  nowMin: number;
  onClose: () => void;
  onOpen: (id: string) => void;
  onAnswer: (id: string, a: "accepted" | "rejected") => void;
}) {
  const { me: meId, cancelMeeting } = useStore();
  const mine = m.organizerId === meId;
  const past = isPast(m.date, m.end, nowMin);
  const live = !past && m.date === TODAY && toMin(m.start) <= nowMin;
  const [tab, setTab] = useState<string>(
    mine && past && needsWrapUp(m, nowMin, meId) ? "notes" : "invitees",
  );
  const [edit, setEdit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const organizer = staffById(m.organizerId);
  const me = myParticipant(m, meId);
  const status = m.cancelled ? "Cancelled" : past ? "Completed" : live ? "In progress" : "Upcoming";

  const tabs = [
    { key: "invitees", label: "Invitees", icon: Users },
    ...(mine && past && !m.cancelled
      ? [
          { key: "notes", label: "Notes & follow-ups", icon: NotebookPen },
          { key: "attendance", label: "Attendance", icon: UserCheck },
        ]
      : []),
    ...(mine ? [{ key: "activity", label: "Activity", icon: History }] : []),
  ] as const;

  return (
    <>
      <Header onClose={onClose} tone={m.cancelled ? "gray" : "brand"}>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11.5px] font-semibold">Meeting</span>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11.5px] font-semibold">{status}</span>
        </div>
        <h2 className={`pr-10 text-[20px] font-bold leading-tight ${m.cancelled ? "line-through" : ""}`}>{m.title}</h2>
        <div className="mt-3 grid gap-1.5 text-[13px] opacity-90">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {fmtDateLong(m.date)}</p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {fmtRange(m.start, m.end)} (Asia/Dhaka, GMT+6)</p>
          <p className="flex items-center gap-2">
            <ModeIcon mode={m.mode} className="h-4 w-4" />
            {m.link ? <a href={m.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">{m.link.replace("https://", "")}</a> : m.location ?? m.phone}
          </p>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Invitee view */}
        {!mine && me && (
          <div className="border-b border-line p-5">
            <div className="flex items-center gap-3">
              <Avatar name={organizer.name} color={organizer.color} size={38} />
              <div>
                <p className="font-semibold">Invited by {organizer.name}</p>
                <p className="text-[12.5px] text-muted">{organizer.role}</p>
              </div>
              <Badge tone={statusTone(me.status)} className="ml-auto">Your answer: {statusLabel(me.status)}</Badge>
            </div>
            {m.agenda && <p className="mt-4 rounded-lg bg-page p-3 text-[13px]">{m.agenda}</p>}
            {!past && (
              <div className="mt-4 flex gap-2">
                {me.status !== "accepted" && (
                  <Button variant="ok" className="flex-1" onClick={() => onAnswer(m.id, "accepted")}>
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                )}
                <Button variant="bad-ghost" className="flex-1" onClick={() => onAnswer(m.id, "rejected")}>
                  <X className="h-4 w-4" /> {me.status === "accepted" ? "Change to Reject" : "Reject"}
                </Button>
              </div>
            )}
            <p className="mt-3 text-[12px] text-muted">
              {past && me.status === "pending"
                ? "This meeting has already ended, so it can no longer be answered."
                : me.status === "pending"
                ? "This slot already counts as busy, so nobody else can book you while you decide."
                : "If the host moves or cancels this meeting, your calendar updates by itself."}
            </p>
          </div>
        )}

        {/* Organizer agenda */}
        {mine && m.agenda && (
          <div className="border-b border-line px-5 py-4">
            <p className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-muted">Agenda</p>
            <p>{m.agenda}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="sticky top-0 z-10 flex gap-1 border-b border-line bg-white px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 py-3 text-[13px] font-semibold transition ${
                tab === t.key ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.key === "notes" && needsWrapUp(m, nowMin, meId) && <span className="h-1.5 w-1.5 rounded-full bg-warn" />}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "invitees" && <Invitees m={m} mine={mine} />}
          {tab === "notes" && <NotesTab m={m} onOpen={onOpen} />}
          {tab === "attendance" && <AttendanceTab m={m} />}
          {tab === "activity" && (
            <ol className="relative space-y-4 border-l-2 border-line pl-5">
              {[...m.activity].reverse().map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand ring-2 ring-brand/20" />
                  <p>{a.text}</p>
                  <p className="text-[11.5px] text-muted">{a.at}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {mine && !m.cancelled && !past && (
        <div className="flex gap-2 border-t border-line bg-[#fafbfc] px-5 py-3.5">
          <Button variant="ghost" onClick={() => setEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit or reschedule
          </Button>
          <Button variant="bad-ghost" className="ml-auto" onClick={() => setConfirmCancel(true)}>
            <Ban className="h-4 w-4" /> Cancel meeting
          </Button>
        </div>
      )}

      <EditModal m={m} open={edit} onClose={() => setEdit(false)} />
      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this meeting?">
        <p className="text-[13.5px]">
          Every invitee gets a cancellation email. The meeting is removed from the calendars of all internal staff, and their time becomes free again.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmCancel(false)}>Keep meeting</Button>
          <Button
            variant="bad"
            onClick={() => {
              cancelMeeting(m.id);
              setConfirmCancel(false);
            }}
          >
            Cancel meeting
          </Button>
        </div>
      </Modal>
    </>
  );
}

function Invitees({ m, mine }: { m: Meeting; mine: boolean }) {
  const { me: meId, resend } = useStore();
  const { accepted, total } = responseSummary(m);
  const count = (s: Participant["status"]) => m.participants.filter((p) => p.status === s).length;
  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-[15px] font-bold">{accepted} of {total} accepted</p>
          <p className="text-[12px] text-muted">
            {count("pending")} pending · {count("rejected")} rejected
          </p>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-page">
          <div className="bg-ok transition-all duration-500" style={{ width: `${(count("accepted") / total) * 100}%` }} />
          <div className="bg-bad transition-all duration-500" style={{ width: `${(count("rejected") / total) * 100}%` }} />
        </div>
      </div>
      <ul className="space-y-2">
        {m.participants.map((p) => (
          <li key={p.id} className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} size={36} status={p.status} color={p.staffId ? staffById(p.staffId).color : undefined} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  {p.name}
                  {p.staffId === meId && <span className="text-muted">(you)</span>}
                  {p.external && <span className="rounded bg-info-soft px-1 text-[10px] font-bold text-[#1d7fb6]">EXTERNAL</span>}
                </p>
                <p className="truncate text-[12px] text-muted">
                  {p.email}
                  {p.whatsapp && ` · WhatsApp ${p.whatsapp}`}
                </p>
              </div>
              <div className="text-right">
                <Badge tone={statusTone(p.status)}>
                  {p.status === "accepted" ? "Meeting request accepted" : p.status === "rejected" ? "Request denied" : statusLabel(p.status)}
                </Badge>
                {p.respondedAt && <p className="mt-1 text-[11px] text-muted">{p.respondedAt}</p>}
              </div>
            </div>
            {p.reason && <p className="mt-2 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] text-[#a8361e]">Reason: {p.reason}</p>}
            {mine && p.emailFailed && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] text-[#a8361e]">
                <CircleAlert className="h-4 w-4" /> Email not delivered
                <Button size="sm" variant="bad" className="ml-auto h-7" onClick={() => resend(m.id, p.id)}>
                  <RotateCw className="h-3.5 w-3.5" /> Resend
                </Button>
              </div>
            )}
            {mine && !p.emailFailed && p.status === "pending" && !m.cancelled && (
              <button onClick={() => resend(m.id, p.id)} className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline">
                <RotateCw className="h-3 w-3" /> Resend invite
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesTab({ m, onOpen }: { m: Meeting; onOpen: (id: string) => void }) {
  const { me: meId, items, saveNotes, addItem, toast } = useStore();
  const [notes, setNotes] = useState(m.notes ?? "");
  const [adding, setAdding] = useState(false);
  const [fuTitle, setFuTitle] = useState("");
  const [fuDate, setFuDate] = useState(() => addDays(TODAY, 1));
  const [fuOwner, setFuOwner] = useState(meId);
  const followUps = items.filter((i): i is Todo => isTodo(i) && i.parentId === m.id);
  const attendees = [meId, ...m.participants.filter((p) => p.staffId && p.status === "accepted").map((p) => p.staffId!)];

  const addFollowUp = () => {
    if (!fuTitle.trim()) return;
    addItem({
      id: `fu-${Date.now()}`,
      kind: "todo",
      title: fuTitle.trim(),
      date: fuDate,
      priority: "normal",
      done: false,
      ownerId: meId,
      // A follow-up for someone else is an assigned task: they accept or reject it.
      assignees: fuOwner === meId ? undefined : [{ staffId: fuOwner, status: "pending" }],
      parentId: m.id,
    });
    toast(
      "Follow-up created",
      fuOwner === meId ? `Added to your tasks for ${fmtDate(fuDate)}.` : `${staffById(fuOwner).name} gets a notification to accept or reject it.`,
      "ok",
    );
    setFuTitle("");
    setAdding(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-[12.5px] font-semibold text-[#495057]">Meeting notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="What was decided? Visible to you and accepted internal invitees. Never sent to external invitees."
          className={`${inputCls} h-auto py-2.5`}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11.5px] text-muted">Internal only</p>
          <Button size="sm" onClick={() => saveNotes(m.id, notes)} disabled={notes === (m.notes ?? "")}>
            Save notes
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] font-semibold text-[#495057]">Follow-ups ({followUps.length})</p>
          {!adding && (
            <Button size="sm" variant="soft" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" /> Add follow-up
            </Button>
          )}
        </div>
        {adding && (
          <div className="mb-3 animate-pop space-y-2.5 rounded-xl border border-brand/30 bg-brand-soft/40 p-3">
            <input autoFocus value={fuTitle} onChange={(e) => setFuTitle(e.target.value)} placeholder="e.g. Send fee invoice" className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={fuDate} onChange={(e) => setFuDate(e.target.value)} className={inputCls} />
              <select value={fuOwner} onChange={(e) => setFuOwner(Number(e.target.value))} className={inputCls}>
                {attendees.map((id) => (
                  <option key={id} value={id}>{id === meId ? "Me" : staffById(id).name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={addFollowUp} disabled={!fuTitle.trim()}>Create task</Button>
            </div>
          </div>
        )}
        {followUps.length === 0 && !adding && <p className="rounded-lg bg-page p-4 text-center text-muted">No follow-ups yet.</p>}
        <ul className="space-y-1.5">
          {followUps.map((f) => {
            const st = todoState(f, meId);
            const a = f.assignees?.[0];
            const who = a ? staffById(a.staffId).name : f.ownerId === meId ? "Me" : staffById(f.ownerId).name;
            // A follow-up given to someone else shows their answer until they finish it.
            const badge =
              st === "done"
                ? { tone: "ok" as const, text: "Done" }
                : a?.status === "rejected"
                  ? { tone: "bad" as const, text: "Rejected" }
                  : a?.status === "pending"
                    ? { tone: "warn" as const, text: "Waiting" }
                    : st === "overdue"
                      ? { tone: "bad" as const, text: "Overdue" }
                      : { tone: "warn" as const, text: a ? "Accepted" : "Open" };
            return (
              <li key={f.id}>
                <button
                  onClick={() => onOpen(f.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2 text-left hover:bg-page"
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md ${st === "done" ? "bg-ok text-white" : st === "overdue" ? "bg-bad-soft text-bad" : "bg-warn-soft text-[#b77d14]"}`}>
                    {st === "done" ? <Check className="h-3 w-3" strokeWidth={3} /> : <Link2 className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-medium ${st === "done" ? "text-muted line-through" : ""}`}>{f.title}</span>
                    <span className="text-[11.5px] text-muted">
                      Due {fmtDate(f.date)} · {who}
                    </span>
                  </span>
                  <Badge tone={badge.tone}>{badge.text}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AttendanceTab({ m }: { m: Meeting }) {
  const { setAttendance, toast } = useStore();
  const accepted = m.participants.filter((p) => p.status === "accepted");
  const others = m.participants.filter((p) => p.status !== "accepted");
  const marked = accepted.filter((p) => p.attendance).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">{marked} of {accepted.length} marked</p>
        <p className="text-[12px] text-muted">
          {accepted.filter((p) => p.attendance === "attended").length} attended · {accepted.filter((p) => p.attendance === "no-show").length} no-show
        </p>
      </div>
      <ul className="space-y-2">
        {accepted.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
            <Avatar name={p.name} size={34} color={p.staffId ? staffById(p.staffId).color : undefined} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-[12px] text-muted">{p.external ? "External" : "Staff"}</p>
            </div>
            <div className="flex rounded-lg bg-page p-1">
              <button
                onClick={() => {
                  setAttendance(m.id, p.id, "attended");
                  toast(`${p.name} marked as attended`, undefined, "ok");
                }}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                  p.attendance === "attended" ? "bg-ok text-white shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" /> Attended
              </button>
              <button
                onClick={() => {
                  setAttendance(m.id, p.id, "no-show");
                  toast(`${p.name} marked as no-show`, undefined, "bad");
                }}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                  p.attendance === "no-show" ? "bg-bad text-white shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <UserX className="h-3.5 w-3.5" /> No-show
              </button>
            </div>
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold text-muted">Did not accept (not counted)</p>
          <div className="flex flex-wrap gap-2">
            {others.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-page py-1 pl-1 pr-2.5 text-[12px] text-muted">
                <Avatar name={p.name} size={20} color={p.staffId ? staffById(p.staffId).color : undefined} /> {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EditModal({ m, open, onClose }: { m: Meeting; open: boolean; onClose: () => void }) {
  const { me: meId, items, elapsed, updateItem, toast, notifyStaff } = useStore();
  const nowMin = nowMinutes(elapsed);
  const [title, setTitle] = useState(m.title);
  const [date, setDate] = useState(m.date);
  const [start, setStart] = useState(m.start);
  const [end, setEnd] = useState(m.end);
  const [agenda, setAgenda] = useState(m.agenda ?? "");
  const [added, setAdded] = useState<Invitee[]>([]);
  const timeChanged = date !== m.date || start !== m.start || end !== m.end;
  const timeOk = !timeError(start, end);
  // Checked only on save, and only when the time changed: editing the title or people of a past meeting is fine.
  const [saveError, setSaveError] = useState("");
  // Leave this meeting out, so its own people do not show as busy because of it.
  const availability = useMemo(
    () => (timeOk ? staffAvailability(date, start, end, items, meId, m.id) : []),
    [timeOk, date, start, end, items, meId, m.id],
  );
  const ok = title.trim() && timeOk && busyInvitees(added, availability).length === 0;
  const names = added.map((a) => a.name).join(", ");

  const save = () => {
    if (!ok) return;
    const late = timeChanged ? pastError(date, start, nowMin) : null;
    if (late) return setSaveError(late);
    updateItem(m.id, {
      title,
      date,
      start,
      end,
      agenda,
      participants: [
        ...(timeChanged ? m.participants.map((p) => ({ ...p, status: "pending" as const, respondedAt: undefined, reason: undefined })) : m.participants),
        ...added.map((a, n) => ({
          id: `${m.id}-add${Date.now()}-${n}`,
          staffId: a.staffId,
          name: a.name,
          email: a.email,
          whatsapp: a.whatsapp,
          external: !a.staffId,
          status: "pending" as const,
        })),
      ],
      activity: [
        ...m.activity,
        { at: stampNow(), text: timeChanged ? `Rescheduled to ${fmtDate(date)}, ${fmtTime(start)}. Answers reset to Pending` : "Details updated" },
        ...(added.length ? [{ at: stampNow(), text: `Invite sent to ${names}` }] : []),
      ],
    });
    const others = timeChanged
      ? "Everyone else gets an \"Updated time\" email and their answers reset to Pending."
      : "Everyone else gets an \"Updated\" email and their answers stay.";
    toast(
      added.length ? `Invite sent to ${names}` : timeChanged ? "Meeting rescheduled" : "Meeting updated",
      added.length
        ? others
        : timeChanged
          ? "\"Updated time\" email sent. Staff calendars moved and every answer reset to Pending."
          : "\"Updated\" email sent. Answers stay as they are.",
      "info",
    );
    for (const a of added) {
      if (a.staffId) notifyStaff(a.staffId, `${staffById(m.organizerId).name} invited you to ${title}, ${fmtDate(date)}, ${fmtTime(start)}`, "info");
    }
    setAdded([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit or reschedule" width={500}>
      <div className="space-y-3.5">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
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
        />
        <Field label="Agenda">
          <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} className={`${inputCls} h-auto py-2`} />
        </Field>
        <div>
          <p className="mb-1 text-[12px] font-semibold text-muted">Invitees</p>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {m.participants.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-page py-0.5 pl-0.5 pr-2.5 text-[12px] text-muted">
                <Avatar name={p.name} size={20} color={p.staffId ? staffById(p.staffId).color : undefined} /> {p.name}
              </span>
            ))}
          </div>
          <InviteePicker value={added} onChange={setAdded} availability={availability} taken={m.participants} timeOk={timeOk} />
          {added.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-brand">
              <Mail className="h-3.5 w-3.5" /> {added.length === 1 ? "This person gets" : "These people get"} the meeting invite email.
            </p>
          )}
        </div>
        <div className={`flex gap-2 rounded-lg px-3 py-2.5 text-[12.5px] ${timeChanged ? "bg-warn-soft text-[#7a5205]" : "bg-page text-muted"}`}>
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
          {timeChanged
            ? `Time change: ${added.length ? "current invitees get" : "every invitee gets"} an "Updated time" email, staff calendars move, and all answers reset to Pending.`
            : `No time change: ${added.length ? "current invitees get" : "invitees get"} an "Updated" email and their answers stay.`}
        </div>
      </div>
      {saveError && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-bad-soft px-3 py-2.5 text-[12.5px] font-medium text-[#b33b22]">
          <CircleAlert className="h-4 w-4 shrink-0" /> {saveError}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button onClick={save} disabled={!ok}>Save and notify</Button>
      </div>
    </Modal>
  );
}

function TodoDetails({
  t,
  onClose,
  onOpen,
  onAnswer,
}: {
  t: Todo;
  onClose: () => void;
  onOpen: (id: string) => void;
  onAnswer: (id: string, a: "accepted" | "rejected") => void;
}) {
  const { me: meId, items, toggleDone, deleteItem, updateItem, toast, notifyStaff } = useStore();
  const st = todoState(t, meId);
  const owner = t.ownerId === meId;
  const assigned = isAssigned(t);
  const myPart = owner ? undefined : assigneeOf(t, meId);
  const pending = myPart?.status === "pending";
  // Only the person who does the work can tick it: the creator of a task for themselves, or an assignee who accepted.
  const canTick = (owner && !assigned) || myPart?.status === "accepted";
  const p = taskProgress(t);
  const parent = t.parentId ? items.find((i) => i.id === t.parentId) : undefined;
  const ownerName = staffById(t.ownerId).name;
  const [edit, setEdit] = useState(false);

  return (
    <>
      <Header onClose={onClose} tone={pending ? "brand" : st === "done" ? "ok" : st === "overdue" ? "bad" : "warn"}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${pending ? "bg-white/20" : "bg-white/60"}`}>Task</span>
          <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${pending ? "bg-white/20" : "bg-white/60"}`}>
            {pending ? "Waiting for your answer" : st === "done" ? "Done" : st === "overdue" ? "Overdue" : "Open"}
          </span>
          {t.priority === "high" && (
            <span className="flex items-center gap-1 rounded-md bg-bad px-2 py-0.5 text-[11.5px] font-semibold text-white">
              <Flag className="h-3 w-3" /> High priority
            </span>
          )}
        </div>
        <h2 className={`pr-10 text-[20px] font-bold leading-tight ${st === "done" ? "line-through opacity-70" : ""}`}>{t.title}</h2>
        <div className="mt-3 grid gap-1.5 text-[13px]">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {fmtDateLong(t.date)}</p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t.start && t.end ? fmtRange(t.start, t.end) : "No set time · in the day's task list"}</p>
          {!owner && (
            <p className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Assigned by {ownerName}
            </p>
          )}
        </div>
      </Header>

      <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
        {/* Assigned to me and not answered yet */}
        {pending && (
          <div className="rounded-xl border border-brand/30 bg-brand-soft/50 p-4">
            <p className="mb-3 text-[13px]">
              <b>{ownerName}</b> assigned you this task. Accept it to add it to your calendar, or reject it with a reason.
            </p>
            <div className="flex gap-2">
              <Button variant="ok" className="flex-1" onClick={() => onAnswer(t.id, "accepted")}>
                <Check className="h-4 w-4" /> Accept
              </Button>
              <Button variant="bad-ghost" className="flex-1 ring-1 ring-bad/40" onClick={() => onAnswer(t.id, "rejected")}>
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        )}

        {parent && isMeeting(parent) && (
          <button onClick={() => onOpen(parent.id)} className="flex w-full items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft/40 p-3 text-left hover:bg-brand-soft">
            <Link2 className="h-4 w-4 text-brand" />
            <span>
              <span className="block text-[12px] text-muted">Follow-up from</span>
              <span className="font-semibold text-brand">{parent.title} · {fmtDate(parent.date)}</span>
            </span>
          </button>
        )}
        {t.notes && <p className="whitespace-pre-line rounded-lg bg-page p-3">{t.notes}</p>}

        {/* Who it is assigned to */}
        {assigned && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12.5px] font-semibold text-[#495057]">Assigned to ({p.total})</p>
              <p className="text-[12px] text-muted">
                {p.accepted} accepted · {p.pending} waiting{p.rejected ? ` · ${p.rejected} rejected` : ""}
              </p>
            </div>
            <ul className="space-y-1.5">
              {t.assignees!.map((a) => {
                const s = staffById(a.staffId);
                const label = a.status === "accepted" ? (a.done ? "Done" : "Accepted") : a.status === "rejected" ? "Rejected" : "Waiting";
                const tone = a.status === "accepted" ? "ok" : a.status === "rejected" ? "bad" : "warn";
                return (
                  <li key={a.staffId} className="rounded-lg border border-line px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} color={s.color} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {s.name}
                          {a.staffId === meId && <span className="text-muted"> (you)</span>}
                        </span>
                        <span className="text-[11.5px] text-muted">
                          {s.role}
                          {a.respondedAt && ` · answered ${a.respondedAt}`}
                        </span>
                      </span>
                      <Badge tone={tone}>{label}</Badge>
                    </div>
                    {a.status === "rejected" && a.reason && (
                      <p className="mt-2 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] text-[#a8361e]">Reason: {a.reason}</p>
                    )}
                  </li>
                );
              })}
            </ul>
            {owner && (
              <p className="mt-2 text-[12px] text-muted">You get a notification when someone accepts, rejects or finishes this task.</p>
            )}
          </div>
        )}

        {canTick && (
          <>
            <button
              onClick={() => {
                toggleDone(t.id);
                if (st !== "done") toast("Nice work!", `${t.title} is done.${owner ? "" : ` ${ownerName.split(" ")[0]} has been told.`}`, "ok");
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition ${
                st === "done" ? "bg-page text-muted hover:text-ink" : "bg-ok text-white shadow-md shadow-ok/30 hover:bg-[#099885]"
              }`}
            >
              <Check className="h-5 w-5" /> {st === "done" ? "Mark as not done" : "Mark as done"}
            </button>
            {owner && st === "overdue" && (
              <Button
                variant="soft"
                className="w-full"
                onClick={() => {
                  updateItem(t.id, { date: TODAY });
                  toast("Moved to today", undefined, "info");
                }}
              >
                <CalendarClock className="h-4 w-4" /> Move to today
              </Button>
            )}
            <p className="text-center text-[12px] text-muted">
              {t.start ? "You get a push at the start time." : "Without a time, this task does not block your calendar."}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center border-t border-line bg-[#fafbfc] px-5 py-3.5">
        {owner && (
          <Button
            variant="bad-ghost"
            onClick={() => {
              deleteItem(t.id);
              // Staff who still have the task are told it was removed.
              for (const a of t.assignees ?? []) {
                if (a.status !== "rejected") notifyStaff(a.staffId, `${ownerName} deleted the task ${t.title}`, "bad");
              }
              toast("Task deleted", assigned ? "The assigned staff have been told." : undefined, "bad");
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
        {owner && (
          <Button variant="ghost" onClick={() => setEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
        <span className="ml-auto self-center text-[12px] text-muted">
          {owner
            ? assigned
              ? `Assigned to ${p.total} staff`
              : "Private to you"
            : `From ${ownerName.split(" ")[0]}`}
        </span>
      </div>
      {owner && edit && <EditTaskModal t={t} onClose={() => setEdit(false)} />}
    </>
  );
}

/**
 * Edit a task: title, date and time, priority, notes and the assigned staff.
 * New staff get the task to accept or reject. Removed staff and staff who keep the task are told.
 */
function EditTaskModal({ t, onClose }: { t: Todo; onClose: () => void }) {
  const { me: meId, items, updateItem, toast, notifyStaff } = useStore();
  const [title, setTitle] = useState(t.title);
  const [date, setDate] = useState(t.date);
  const [hasTime, setHasTime] = useState(!!t.start);
  const [start, setStart] = useState(t.start ?? "10:00");
  const [end, setEnd] = useState(t.end ?? "11:00");
  const [priority, setPriority] = useState<Priority>(t.priority);
  const [notes, setNotes] = useState(t.notes ?? "");
  const [kept, setKept] = useState<TaskAssignee[]>(t.assignees ?? []);
  const [added, setAdded] = useState<Invitee[]>([]);

  const timeOk = !hasTime || !timeError(start, end);
  const newStart = hasTime ? start : undefined;
  const newEnd = hasTime ? end : undefined;
  const timeChanged = date !== t.date || newStart !== t.start || newEnd !== t.end;
  const removed = (t.assignees ?? []).filter((a) => !kept.some((k) => k.staffId === a.staffId));

  // Leave this task out, so its own staff do not show as busy because of it.
  const availability = useMemo(
    () =>
      hasTime && timeOk
        ? staffAvailability(date, start, end, items, meId, t.id)
        : STAFF.filter((s) => s.id !== meId).map((s) => ({ staff: s, busy: null as string | null, busyAt: null })),
    [hasTime, timeOk, date, start, end, items, meId, t.id],
  );

  const save = () => {
    if (!title.trim() || !timeOk) return;
    const assignees = [...kept, ...added.map((a) => ({ staffId: a.staffId!, status: "pending" as const }))];
    updateItem(t.id, {
      title: title.trim(),
      date,
      start: newStart,
      end: newEnd,
      priority,
      notes: notes.trim() || undefined,
      assignees: assignees.length ? assignees : undefined,
    });

    const me = staffById(meId).name;
    const when = `${fmtDate(date)}${newStart ? `, ${fmtTime(newStart)}` : ""}`;
    for (const a of added) {
      notifyStaff(a.staffId!, `${me} assigned you a task: ${title.trim()}, ${when}. Accept or reject it.`, "info");
    }
    for (const a of removed) {
      if (a.status !== "rejected") notifyStaff(a.staffId, `${me} removed you from the task ${t.title}`, "bad");
    }
    for (const a of kept) {
      if (a.status === "rejected") continue;
      notifyStaff(
        a.staffId,
        timeChanged ? `${me} moved the task ${title.trim()} to ${when}` : `${me} updated the task ${title.trim()}`,
        "info",
      );
    }

    const parts = [
      added.length && `sent to ${added.map((a) => a.name.split(" ")[0]).join(", ")}`,
      removed.length && `${removed.map((a) => staffById(a.staffId).name.split(" ")[0]).join(", ")} removed`,
    ].filter(Boolean);
    toast("Task updated", parts.length ? `Task ${parts.join(", ")}. Everyone involved has been told.` : undefined, "ok");
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Edit task" width={520}>
      <div className="space-y-3.5">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <TimeFields
          date={date}
          start={start}
          end={end}
          onDate={setDate}
          onTime={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
          showTime={hasTime}
        />
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} className="h-4 w-4 accent-brand" />
          Set a time <span className="text-muted">(blocks the calendar)</span>
        </label>

        <div>
          <p className="mb-1.5 text-[12.5px] font-semibold text-[#495057]">Priority</p>
          <div className="flex rounded-lg bg-page p-1">
            {(["low", "normal", "high"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPriority(v)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] font-semibold capitalize transition ${
                  priority === v ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {v === "high" && <Flag className="h-4 w-4" />}
                {v}
              </button>
            ))}
          </div>
        </div>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputCls} h-auto py-2`} />
        </Field>

        {/* Assigned staff */}
        <div className="rounded-xl border border-line p-3.5">
          <p className="mb-2 text-[12.5px] font-semibold text-[#495057]">Assigned to</p>
          {kept.length > 0 ? (
            <ul className="mb-3 space-y-1.5">
              {kept.map((a) => {
                const s = staffById(a.staffId);
                const label = a.status === "accepted" ? (a.done ? "Done" : "Accepted") : a.status === "rejected" ? "Rejected" : "Waiting";
                return (
                  <li key={a.staffId} className="flex items-center gap-2.5 rounded-lg bg-page px-2.5 py-1.5">
                    <Avatar name={s.name} color={s.color} size={26} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{s.name}</span>
                      <span className="text-[11.5px] text-muted">{s.role}</span>
                    </span>
                    <Badge tone={a.status === "accepted" ? "ok" : a.status === "rejected" ? "bad" : "warn"}>{label}</Badge>
                    <button
                      type="button"
                      onClick={() => setKept((k) => k.filter((x) => x.staffId !== a.staffId))}
                      className="rounded-md p-1 text-muted hover:bg-bad-soft hover:text-bad"
                      aria-label={`Remove ${s.name}`}
                      title={`Remove ${s.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            added.length === 0 && <p className="mb-3 text-[12.5px] text-muted">Nobody yet. The task is only for you.</p>
          )}
          <InviteePicker
            value={added}
            onChange={setAdded}
            availability={availability}
            taken={kept.map((a) => ({ staffId: a.staffId, email: "" }))}
            timeOk={timeOk}
            showExternal={false}
            allowBusy
            staffLabel="Add staff"
          />
        </div>

        {(added.length > 0 || removed.length > 0 || (timeChanged && kept.length > 0)) && (
          <div className="flex gap-2 rounded-lg bg-warn-soft px-3 py-2.5 text-[12.5px] text-[#7a5205]">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {[
                added.length > 0 && `${added.map((a) => a.name.split(" ")[0]).join(", ")} will get the task to accept or reject.`,
                removed.length > 0 && `${removed.map((a) => staffById(a.staffId).name.split(" ")[0]).join(", ")} will be removed and told.`,
                timeChanged && kept.length > 0 && "Staff who keep the task are told about the new date and time.",
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={!title.trim() || !timeOk}>
          {kept.length || added.length || removed.length ? "Save and notify" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
