"use client";

import { Check, Clock, Flag, Link2, NotebookPen, Sparkles, Video } from "lucide-react";
import { staffById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { isMeeting, isTodo, myParticipant, needsWrapUp, todoState } from "@/lib/logic";
import { TODAY, fmtDate, fmtRange, fmtTime, toMin } from "@/lib/time";
import type { Meeting, ScheduleItem } from "@/lib/types";
import { Avatar, Card } from "@/components/ui/primitives";
import { ModeIcon } from "./EventCard";

function countdown(mins: number) {
  if (mins <= 0) return "Now";
  if (mins < 60) return `${Math.ceil(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function TodayPanel({
  items,
  nowMin,
  onOpen,
  onToggle,
  onAnswer,
}: {
  items: ScheduleItem[];
  nowMin: number;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onAnswer: (id: string, a: "accepted" | "rejected") => void;
}) {
  const { me: meId } = useStore();
  const todays = items.filter((i) => i.date === TODAY);
  const meetings = todays
    .filter(isMeeting)
    .filter((m) => !m.cancelled && (m.organizerId === meId || myParticipant(m, meId)?.status === "accepted"))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const next = meetings.find((m) => toMin(m.end) > nowMin);
  const invites = items
    .filter(isMeeting)
    .filter((m) => m.organizerId !== meId && myParticipant(m, meId)?.status === "pending" && m.date >= TODAY);
  const wrapUps = items.filter(isMeeting).filter((m) => needsWrapUp(m, nowMin, meId));
  const todos = todays.filter(isTodo).sort((a, b) => (a.start ?? "99").localeCompare(b.start ?? "99"));
  const done = todos.filter((t) => t.done).length;

  return (
    <div className="space-y-4">
      {/* Next meeting */}
      {next ? <NextMeeting m={next} nowMin={nowMin} onOpen={onOpen} /> : (
        <Card className="p-4 text-center text-muted">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-warn" />
          No more meetings today. Plan your day with a to-do.
        </Card>
      )}

      {/* Invites waiting */}
      {invites.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-muted">
            Waiting for your answer
            <span className="rounded-full bg-brand px-1.5 text-[10.5px] text-white">{invites.length}</span>
          </p>
          {invites.map((m) => (
            <div key={m.id} className="rounded-lg border border-dashed border-brand/40 p-3">
              <button className="block text-left" onClick={() => onOpen(m.id)}>
                <p className="font-semibold">{m.title}</p>
                <p className="text-[12px] text-muted">
                  {fmtDate(m.date)} · {fmtRange(m.start, m.end)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                  <Avatar name={staffById(m.organizerId).name} color={staffById(m.organizerId).color} size={18} />
                  From {staffById(m.organizerId).name}
                </p>
              </button>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => onAnswer(m.id, "accepted")}
                  className="flex-1 rounded-lg bg-ok py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#099885]"
                >
                  Accept
                </button>
                <button
                  onClick={() => onAnswer(m.id, "rejected")}
                  className="flex-1 rounded-lg bg-white py-1.5 text-[12.5px] font-semibold text-bad ring-1 ring-bad/40 hover:bg-bad-soft"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Today's to-dos */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Today&apos;s to-dos</p>
          <span className="text-[12px] font-semibold text-ok">
            {done} of {todos.length} done
          </span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-page">
          <div className="h-full rounded-full bg-ok transition-all duration-500" style={{ width: `${todos.length ? (done / todos.length) * 100 : 0}%` }} />
        </div>
        <ul className="space-y-1">
          {todos.map((t) => {
            const state = todoState(t);
            return (
              <li key={t.id} className="group flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-page">
                <button
                  onClick={() => onToggle(t.id)}
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition ${
                    state === "done" ? "border-ok bg-ok text-white" : "border-[#ced4da] hover:border-ok"
                  }`}
                  aria-label="Mark done"
                >
                  {state === "done" && <Check className="h-3 w-3 animate-pop" strokeWidth={3} />}
                </button>
                <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(t.id)}>
                  <p className={`truncate font-medium ${state === "done" ? "text-muted line-through" : ""}`}>
                    {t.parentId && <Link2 className="mr-1 inline h-3 w-3 text-brand" />}
                    {t.title}
                  </p>
                  <p className="flex items-center gap-1 text-[11.5px] text-muted">
                    {t.start ? <><Clock className="h-3 w-3" /> {fmtTime(t.start)}</> : "Any time today"}
                    {t.priority === "high" && state !== "done" && <Flag className="ml-1 h-3 w-3 fill-bad text-bad" />}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Wrap-ups */}
      {wrapUps.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">Needs notes and attendance</p>
          {wrapUps.map((m) => (
            <button
              key={m.id}
              onClick={() => onOpen(m.id)}
              className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left hover:bg-page"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-soft text-[#b77d14]">
                <NotebookPen className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{m.title}</span>
                <span className="text-[11.5px] text-muted">{fmtDate(m.date)} · ended</span>
              </span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}

function NextMeeting({ m, nowMin, onOpen }: { m: Meeting; nowMin: number; onOpen: (id: string) => void }) {
  const mins = toMin(m.start) - nowMin;
  const live = mins <= 0;
  return (
    <div
      onClick={() => onOpen(m.id)}
      className="relative cursor-pointer overflow-hidden rounded-xl bg-brand p-4 text-white shadow-lg shadow-brand/30"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 right-10 h-20 w-20 rounded-full bg-white/5" />
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-white/70">Next meeting</p>
      <p className="mt-1 text-[16px] font-bold leading-snug">{m.title}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/80">
        <ModeIcon mode={m.mode} /> {fmtRange(m.start, m.end)}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {m.participants.map((p) => (
            <span key={p.id} className="rounded-full ring-2 ring-brand">
              <Avatar name={p.name} size={26} color={p.staffId ? staffById(p.staffId).color : undefined} />
            </span>
          ))}
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold backdrop-blur">
          {live ? "In progress" : `Starts in ${countdown(mins)}`}
        </span>
      </div>
      {m.link && (
        <a
          href={m.link}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex animate-ring items-center justify-center gap-2 rounded-lg bg-ok py-2 font-semibold text-white transition hover:bg-[#099885]"
        >
          <Video className="h-4 w-4" /> Join meeting
        </a>
      )}
    </div>
  );
}
