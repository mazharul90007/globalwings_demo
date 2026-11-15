import { STAFF } from "./data";
import { TODAY, isPast, overlaps } from "./time";
import type { Meeting, Participant, ScheduleItem, TaskAssignee, Todo } from "./types";

export const isMeeting = (i: ScheduleItem): i is Meeting => i.kind === "meeting";
export const isTodo = (i: ScheduleItem): i is Todo => i.kind === "todo";

// `me` is the staff id of the signed-in user (switchable from the profile menu).

export function myParticipant(m: Meeting, me: number): Participant | undefined {
  return m.participants.find((p) => p.staffId === me);
}

/** My entry on a task someone assigned to me. */
export function assigneeOf(t: Todo, me: number): TaskAssignee | undefined {
  return t.assignees?.find((a) => a.staffId === me);
}

/** True when the task was given to other staff (not only for the creator). */
export const isAssigned = (t: Todo) => !!t.assignees?.length;

/** Tasks other people assigned to me that I have not answered yet. */
export function pendingTasksFor(items: ScheduleItem[], me: number) {
  return items.filter((i): i is Todo => isTodo(i) && i.ownerId !== me && assigneeOf(i, me)?.status === "pending");
}

export function taskProgress(t: Todo) {
  const list = t.assignees ?? [];
  const accepted = list.filter((a) => a.status === "accepted");
  return {
    total: list.length,
    pending: list.filter((a) => a.status === "pending").length,
    rejected: list.filter((a) => a.status === "rejected").length,
    accepted: accepted.length,
    done: accepted.filter((a) => a.done).length,
  };
}

/**
 * Done from my side. An assignee sees their own part. The creator of an assigned task
 * sees it done once every staff member who accepted has finished.
 */
export function taskDone(t: Todo, me: number) {
  const mine = assigneeOf(t, me);
  if (mine && t.ownerId !== me) return !!mine.done;
  if (isAssigned(t)) {
    const p = taskProgress(t);
    return p.accepted > 0 && p.done === p.accepted;
  }
  return t.done;
}

/** Items that appear on my calendar. */
export function visibleForMe(items: ScheduleItem[], me: number) {
  return items.filter((i) => {
    // An assigned task goes on my calendar only after I accept it.
    if (isTodo(i)) return i.ownerId === me || assigneeOf(i, me)?.status === "accepted";
    if (i.organizerId === me) return true;
    const p = myParticipant(i, me);
    // Invites I rejected and meetings cancelled by the host leave my calendar.
    return !!p && p.status !== "rejected" && !i.cancelled;
  });
}

export function todoState(t: Todo, me: number): "done" | "overdue" | "open" {
  if (taskDone(t, me)) return "done";
  if (t.date < TODAY) return "overdue";
  return "open";
}

export function responseSummary(m: Meeting) {
  const accepted = m.participants.filter((p) => p.status === "accepted").length;
  return { accepted, total: m.participants.length };
}

export function needsWrapUp(m: Meeting, nowMin: number, me: number) {
  if (m.cancelled || m.organizerId !== me) return false;
  if (!isPast(m.date, m.end, nowMin)) return false;
  const attendanceDone = m.participants
    .filter((p) => p.status === "accepted")
    .every((p) => p.attendance);
  return !m.notes || !attendanceDone;
}

export type BusyBlock = { title: string; start: string; end: string };

/**
 * The first item that blocks a staff member's time in the given range: meetings they
 * organize, accept or have not answered yet, and timed tasks that are theirs to do
 * (their own tasks, or assigned tasks they accepted). Null when they are free.
 */
export function busyBlock(
  staffId: number,
  date: string,
  start: string,
  end: string,
  items: ScheduleItem[],
  excludeId?: string,
): BusyBlock | null {
  for (const i of items) {
    if (i.id === excludeId || i.date !== date) continue;
    if (isTodo(i)) {
      const a = assigneeOf(i, staffId);
      const doing = a ? a.status === "accepted" && !a.done : i.ownerId === staffId && !isAssigned(i) && !i.done;
      if (doing && i.start && i.end && overlaps(start, end, i.start, i.end)) {
        return { title: i.title, start: i.start, end: i.end };
      }
      continue;
    }
    if (i.cancelled || !overlaps(start, end, i.start, i.end)) continue;
    const p = i.participants.find((x) => x.staffId === staffId);
    if (i.organizerId === staffId || (p && (p.status === "accepted" || p.status === "pending"))) {
      return { title: i.title, start: i.start, end: i.end };
    }
  }
  return null;
}

/** Title of the item that blocks a staff member's time, or null when they are free. */
export function busyReason(
  staffId: number,
  date: string,
  start: string,
  end: string,
  items: ScheduleItem[],
  excludeId?: string,
): string | null {
  return busyBlock(staffId, date, start, end, items, excludeId)?.title ?? null;
}

export function staffAvailability(date: string, start: string, end: string, items: ScheduleItem[], me: number, excludeId?: string) {
  return STAFF.filter((s) => s.id !== me).map((s) => {
    const block = busyBlock(s.id, date, start, end, items, excludeId);
    return { staff: s, busy: block?.title ?? null, busyAt: block };
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const PALETTE = ["#0087ca", "#0ab39c", "#f06548", "#3577f1", "#e8a93a", "#299cdb", "#6559cc", "#3d9970"];
export function colorFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function googleCalendarUrl(m: Meeting) {
  const d = m.date.replaceAll("-", "");
  const s = m.start.replace(":", "") + "00";
  const e = m.end.replace(":", "") + "00";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: m.title,
    dates: `${d}T${s}/${d}T${e}`,
    ctz: "Asia/Dhaka",
    details: `${m.agenda ?? ""}${m.link ? `\nJoin: ${m.link}` : ""}`,
    location: m.location ?? m.link ?? m.phone ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsFile(m: Meeting) {
  const d = m.date.replaceAll("-", "");
  const s = m.start.replace(":", "") + "00";
  const e = m.end.replace(":", "") + "00";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Global Wings//SVP Schedule//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${m.id}@svp.globalwings.example`,
    "SEQUENCE:0",
    `DTSTART;TZID=Asia/Dhaka:${d}T${s}`,
    `DTEND;TZID=Asia/Dhaka:${d}T${e}`,
    `SUMMARY:${m.title}`,
    `DESCRIPTION:${(m.agenda ?? "").replace(/\n/g, "\\n")}`,
    `LOCATION:${m.location ?? m.link ?? m.phone ?? ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
