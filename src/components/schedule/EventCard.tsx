"use client";

import { Check, Flag, Link2, MapPin, NotebookPen, Phone, UserPlus, Video, X } from "lucide-react";
import { staffById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { isAssigned, isMeeting, myParticipant, needsWrapUp, responseSummary, taskProgress, todoState } from "@/lib/logic";
import { fmtRange, fmtTime, isPast } from "@/lib/time";
import type { Meeting, ScheduleItem, Todo } from "@/lib/types";
import { Avatar } from "@/components/ui/primitives";

export const ModeIcon = ({ mode, className = "h-3.5 w-3.5" }: { mode: Meeting["mode"]; className?: string }) =>
  mode === "online" ? <Video className={className} /> : mode === "phone" ? <Phone className={className} /> : <MapPin className={className} />;

function MeetingCard({ m, height, nowMin, onAnswer }: { m: Meeting; height: number; nowMin: number; onAnswer?: (a: "accepted" | "rejected") => void }) {
  const { me: meId } = useStore();
  const mine = m.organizerId === meId;
  const me = myParticipant(m, meId);
  const pendingInvite = !mine && me?.status === "pending";
  const past = isPast(m.date, m.end, nowMin);
  const { accepted, total } = responseSummary(m);
  const wrap = needsWrapUp(m, nowMin, meId);
  const compact = height < 50;

  if (m.cancelled) {
    return (
      <div className="striped-bg flex h-full flex-col rounded-lg border border-[#d5d9e6] bg-white px-2 py-1 text-muted">
        <p className="truncate text-[12px] font-semibold line-through">{m.title}</p>
        <p className="text-[11px]">Cancelled</p>
      </div>
    );
  }

  if (pendingInvite) {
    return (
      <div className="flex h-full flex-col rounded-lg border-2 border-dashed border-brand/50 bg-white/85 px-2 py-1 text-brand backdrop-blur-sm">
        <div className="flex min-w-0 items-start gap-1">
          <p className={`min-w-0 flex-1 text-[12.5px] font-semibold leading-tight ${height >= 56 ? "line-clamp-2" : "truncate"}`}>{m.title}</p>
          {/* Short cards have no room for the full buttons, so show small icon buttons instead. */}
          {height < 80 && onAnswer && !past && (
            <span className="flex shrink-0 gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer("accepted");
                }}
                className="flex h-4 w-4 items-center justify-center rounded bg-ok text-white hover:bg-[#099885]"
                aria-label="Accept"
                title="Accept"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer("rejected");
                }}
                className="flex h-4 w-4 items-center justify-center rounded bg-white text-bad ring-1 ring-bad/40 hover:bg-bad-soft"
                aria-label="Reject"
                title="Reject"
              >
                <X className="h-3 w-3" strokeWidth={3} />
              </button>
            </span>
          )}
        </div>
        {!compact && (
          <p className="truncate text-[11px] text-brand/70">
            Invite from {staffById(m.organizerId).name.split(" ")[0]} · {fmtRange(m.start, m.end)}
          </p>
        )}
        {height >= 80 && onAnswer && !past && (
          <div className="mt-auto flex gap-1 pb-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnswer("accepted");
              }}
              className="rounded-md bg-ok px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#099885]"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnswer("rejected");
              }}
              className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-bad ring-1 ring-bad/40 hover:bg-bad-soft"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-lg bg-brand px-2 py-1 text-white shadow-sm shadow-brand/30 ${
        past ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start gap-1">
        <p className={`min-w-0 flex-1 text-[12.5px] font-semibold leading-tight ${height >= 56 ? "line-clamp-2" : "truncate"}`}>{m.title}</p>
        <ModeIcon mode={m.mode} className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
      </div>
      {!compact && (
        <p className="truncate text-[11px] text-white/75">
          {fmtTime(m.start)}
          {mine ? (past ? "" : ` · ${accepted} of ${total} accepted`) : ` · Invited by ${staffById(m.organizerId).name.split(" ")[0]}`}
        </p>
      )}
      {wrap && height >= 56 ? (
        <span className="mt-auto flex w-fit items-center gap-0.5 rounded bg-warn px-1 py-px text-[10px] font-bold text-[#5c3d00]">
          <NotebookPen className="h-2.5 w-2.5" /> Add notes
        </span>
      ) : height >= 80 && (
        <div className="mt-auto flex items-center pb-0.5">
          <div className="flex -space-x-1.5">
            {m.participants.slice(0, 3).map((p) => (
              <span key={p.id} className="rounded-full ring-2 ring-[#0077b3]">
                <Avatar name={p.name} size={20} color={p.staffId ? staffById(p.staffId).color : undefined} />
              </span>
            ))}
          </div>
          {m.participants.length > 3 && <span className="ml-1 text-[10.5px] text-white/80">+{m.participants.length - 3}</span>}
          <span className="ml-auto flex gap-0.5">
            {m.participants.slice(0, 6).map((p) => (
              <span
                key={p.id}
                className={`h-1.5 w-1.5 rounded-full ${
                  p.status === "accepted" ? "bg-[#4ff0d6]" : p.status === "rejected" ? "bg-[#ff9a85]" : "bg-white/40"
                }`}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/** Short line about who a task is shared with: "From Farhan", or "1 of 2 accepted" for the creator. */
function taskShareLine(t: Todo, meId: number) {
  if (t.ownerId !== meId) return `From ${staffById(t.ownerId).name.split(" ")[0]}`;
  if (!isAssigned(t)) return null;
  const p = taskProgress(t);
  return p.accepted ? `${p.done} of ${p.accepted} done` : `${p.pending} waiting`;
}

function TodoCard({ t, height, onToggle }: { t: Todo; height: number; onToggle: () => void }) {
  const { me: meId } = useStore();
  const state = todoState(t, meId);
  const share = taskShareLine(t, meId);
  const style =
    state === "done"
      ? "bg-ok-soft border-ok text-[#067a6a]"
      : state === "overdue"
        ? "bg-bad-soft border-bad text-[#b33b22]"
        : "bg-warn-soft border-warn text-[#8a5c06]";
  return (
    <div className={`flex h-full gap-1.5 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 ${style}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
          state === "done" ? "border-ok bg-ok text-white" : "border-current bg-white"
        }`}
        aria-label="Mark done"
      >
        {state === "done" && <Check className="h-2.5 w-2.5 animate-pop" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[12.5px] font-semibold leading-tight ${height >= 56 ? "line-clamp-2" : "truncate"} ${state === "done" ? "line-through opacity-70" : ""}`}>
          {t.parentId && <Link2 className="mr-1 inline h-3 w-3" />}
          {t.title}
        </p>
        {height >= 44 && (
          <p className="flex items-center gap-1 truncate text-[11px] opacity-80">
            {state === "overdue" ? "Overdue" : t.start ? fmtTime(t.start) : "Task"}
            {share && <span className="flex min-w-0 items-center gap-0.5 truncate"><UserPlus className="h-3 w-3 shrink-0" /> {share}</span>}
            {t.priority === "high" && state !== "done" && <Flag className="h-3 w-3 fill-bad text-bad" />}
          </p>
        )}
      </div>
    </div>
  );
}

export function EventCard({
  item,
  height,
  nowMin,
  onToggle,
  onAnswer,
}: {
  item: ScheduleItem;
  height: number;
  nowMin: number;
  onToggle: () => void;
  onAnswer?: (a: "accepted" | "rejected") => void;
}) {
  return isMeeting(item) ? (
    <MeetingCard m={item} height={height} nowMin={nowMin} onAnswer={onAnswer} />
  ) : (
    <TodoCard t={item} height={height} onToggle={onToggle} />
  );
}

/** Small one-line chip used in the all-day row and the month view. */
export function EventChip({ item, onToggle }: { item: ScheduleItem; onToggle: () => void }) {
  const { me: meId } = useStore();
  if (isMeeting(item)) {
    const pending = item.organizerId !== meId && myParticipant(item, meId)?.status === "pending";
    return (
      <div
        className={`flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold ${
          item.cancelled
            ? "bg-[#f1f2f4] text-muted line-through"
            : pending
              ? "border border-dashed border-brand/50 text-brand"
              : "bg-brand text-white"
        }`}
      >
        <span className="opacity-75">{fmtTime(item.start).replace(":00", "")}</span>
        <span className="truncate">{item.title}</span>
      </div>
    );
  }
  const state = todoState(item, meId);
  return (
    <div
      className={`flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold ${
        state === "done" ? "bg-ok-soft text-[#067a6a]" : state === "overdue" ? "bg-bad-soft text-[#b33b22]" : "bg-warn-soft text-[#8a5c06]"
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border ${
          state === "done" ? "border-ok bg-ok text-white" : "border-current bg-white"
        }`}
        aria-label="Mark done"
      >
        {state === "done" && <Check className="h-2 w-2" strokeWidth={3} />}
      </button>
      {item.parentId && <Link2 className="h-3 w-3 shrink-0" />}
      {(isAssigned(item) || item.ownerId !== meId) && <UserPlus className="h-3 w-3 shrink-0 opacity-70" />}
      <span className={`truncate ${state === "done" ? "line-through opacity-70" : ""}`}>{item.title}</span>
    </div>
  );
}
