"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_ITEMS, INITIAL_NOTIFICATIONS, ME, staffById } from "./data";
import { assigneeOf, isMeeting, isTodo } from "./logic";
import { fmtDate, fmtTime, stampNow } from "./time";
import type { AppNotification, Attendance, Meeting, ScheduleItem, Todo } from "./types";

type Tone = "ok" | "bad" | "info" | "warn";
export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: Tone;
}

interface Store {
  /** False until the browser has loaded saved data and the real date. Date-based pages wait for it. */
  ready: boolean;
  /** Staff id of the signed-in user. Switch it from the profile menu to see another person's side. */
  me: number;
  switchUser: (staffId: number) => void;
  items: ScheduleItem[];
  elapsed: number;
  /** Notifications for the signed-in user only. */
  notifications: AppNotification[];
  toasts: Toast[];
  toast: (title: string, body?: string, tone?: Tone) => void;
  /** Adds an in-app notification for one staff member. */
  notifyStaff: (staffId: number, text: string, tone: Tone) => void;
  dismissToast: (id: number) => void;
  markAllRead: () => void;
  addItem: (item: ScheduleItem) => void;
  updateItem: (id: string, patch: Partial<Meeting> | Partial<Todo>) => void;
  deleteItem: (id: string) => void;
  toggleDone: (id: string) => void;
  respond: (meetingId: string, participantId: string, status: "accepted" | "rejected", reason?: string) => void;
  /** The signed-in user accepts or rejects a task assigned to them. A reason is required to reject. */
  respondTask: (taskId: string, status: "accepted" | "rejected", reason?: string) => void;
  resend: (meetingId: string, participantId: string) => void;
  cancelMeeting: (id: string) => void;
  saveNotes: (id: string, notes: string) => void;
  setAttendance: (meetingId: string, participantId: string, a: Attendance) => void;
  /** Clears the saved browser data and goes back to the original dummy data. */
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

const stamp = stampNow;
const when = (m: Meeting) => `${fmtDate(m.date)}, ${fmtTime(m.start)}`;
const firstName = (id: number) => staffById(id).name.split(" ")[0];
const taskWhen = (t: Todo) => `${fmtDate(t.date)}${t.start ? `, ${fmtTime(t.start)}` : ""}`;

// The demo has no backend, so changes are kept in this browser's localStorage.
// Change the version when the data shape changes, so old saved data is ignored.
const STORAGE_KEY = "msm-schedule-demo-v4";
type Saved = { me: number; items: ScheduleItem[]; notifications: AppNotification[]; simulated: boolean };

function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Saved;
    return Array.isArray(data.items) && Array.isArray(data.notifications) ? data : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState(ME);
  const [items, setItems] = useState<ScheduleItem[]>(INITIAL_ITEMS);
  const [allNotifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const toastId = useRef(1);
  const simulated = useRef(false);
  const meRef = useRef(me);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  // Load saved data after the first render, so server and browser HTML match.
  useEffect(() => {
    const saved = readSaved();
    if (saved) {
      // The simulated "Rahim accepted" event only plays once per browser.
      simulated.current = saved.simulated;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage
      setItems(saved.items);
      setNotifications(saved.notifications);
      if (saved.me) setMe(saved.me);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const data: Saved = { me, items, notifications: allNotifications, simulated: simulated.current };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (private mode): the demo still works, it just is not saved.
    }
  }, [loaded, me, items, allNotifications]);

  const toast = useCallback((title: string, body?: string, tone: Tone = "ok") => {
    const id = toastId.current++;
    setToasts((t) => [...t, { id, title, body, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);

  const notifyStaff = useCallback((staffId: number, text: string, tone: Tone) => {
    setNotifications((n) => [
      { id: `n${Date.now()}-${staffId}-${Math.random().toString(36).slice(2, 6)}`, forId: staffId, text, time: "Just now", tone, unread: true },
      ...n,
    ]);
  }, []);

  const mapMeeting = useCallback((id: string, fn: (m: Meeting) => Meeting) => {
    setItems((all) => all.map((i) => (i.id === id && isMeeting(i) ? fn(i) : i)));
  }, []);

  // Re-render every 10 seconds so "now" (the red line, countdowns, past meetings) stays current.
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 10_000);
    return () => clearInterval(t);
  }, []);

  // Simulated live response, so the team sees a toast arrive during the demo.
  useEffect(() => {
    if (!loaded || simulated.current) return;
    const t = setTimeout(() => {
      simulated.current = true;
      mapMeeting("m6", (m) => ({
        ...m,
        participants: m.participants.map((p) =>
          p.id === "p62" ? { ...p, status: "accepted", respondedAt: stamp() } : p,
        ),
        activity: [...m.activity, { at: stamp(), text: "Rahim Uddin accepted from SVP" }],
      }));
      const m6 = INITIAL_ITEMS.find((i) => i.id === "m6");
      const at = m6 && isMeeting(m6) ? when(m6) : "";
      notifyStaff(ME, `Rahim Uddin accepted Visa file review, ${at}`, "ok");
      // Only the organizer sees the live toast.
      if (meRef.current === ME) toast("Rahim Uddin accepted", `Visa file review · ${at}`, "ok");
    }, 9000);
    return () => clearTimeout(t);
  }, [loaded, mapMeeting, notifyStaff, toast]);

  // Old notifications have no owner: they belong to the default user.
  const notifications = useMemo(() => allNotifications.filter((n) => (n.forId ?? ME) === me), [allNotifications, me]);

  const store = useMemo<Store>(
    () => ({
      ready: loaded,
      me,
      switchUser: (staffId) => {
        setMe(staffId);
        toast(`Signed in as ${staffById(staffId).name}`, "You now see the schedule from this person's side.", "info");
      },
      items,
      elapsed,
      notifications,
      toasts,
      toast,
      notifyStaff,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
      markAllRead: () => setNotifications((n) => n.map((x) => ((x.forId ?? ME) === me ? { ...x, unread: false } : x))),
      addItem: (item) => {
        setItems((all) => [...all, item]);
        // Every invited staff member gets an in-app notification.
        if (isMeeting(item)) {
          for (const p of item.participants) {
            if (p.staffId && p.staffId !== item.organizerId) {
              notifyStaff(p.staffId, `${staffById(item.organizerId).name} invited you to ${item.title}, ${when(item)}`, "info");
            }
          }
        }
        // Every staff member a task is assigned to gets a notification to accept or reject it.
        if (isTodo(item)) {
          const parent = item.parentId ? items.find((i) => i.id === item.parentId) : undefined;
          const from = parent ? ` (follow-up from ${parent.title})` : "";
          for (const a of item.assignees ?? []) {
            notifyStaff(a.staffId, `${staffById(item.ownerId).name} assigned you a task: ${item.title}${from}, ${taskWhen(item)}. Accept or reject it.`, "info");
          }
        }
      },
      updateItem: (id, patch) =>
        setItems((all) => all.map((i) => (i.id === id ? ({ ...i, ...patch } as ScheduleItem) : i))),
      deleteItem: (id) => setItems((all) => all.filter((i) => i.id !== id)),
      toggleDone: (id) => {
        const t = items.find((i) => i.id === id);
        if (!t || !isTodo(t)) return;
        const mine = t.ownerId !== me ? assigneeOf(t, me) : undefined;
        if (mine) {
          // An assignee marks their own part. The person who assigned it is told when it is done.
          setItems((all) =>
            all.map((i) =>
              i.id === id && isTodo(i)
                ? { ...i, assignees: i.assignees?.map((a) => (a.staffId === me ? { ...a, done: !a.done } : a)) }
                : i,
            ),
          );
          if (!mine.done) notifyStaff(t.ownerId, `${staffById(me).name} completed the task ${t.title}`, "ok");
          return;
        }
        // The creator of an assigned task cannot tick it: the assignees do.
        if (t.assignees?.length) return;
        setItems((all) => all.map((i) => (i.id === id && isTodo(i) ? { ...i, done: !i.done } : i)));
      },
      respondTask: (taskId, status, reason) => {
        const t = items.find((i) => i.id === taskId);
        if (!t || !isTodo(t) || !assigneeOf(t, me)) return;
        setItems((all) =>
          all.map((i) =>
            i.id === taskId && isTodo(i)
              ? {
                  ...i,
                  assignees: i.assignees?.map((a) =>
                    a.staffId === me ? { ...a, status, reason: status === "rejected" ? reason : undefined, respondedAt: stamp() } : a,
                  ),
                }
              : i,
          ),
        );
        const who = staffById(me).name;
        const host = firstName(t.ownerId);
        if (status === "accepted") {
          notifyStaff(t.ownerId, `${who} accepted the task ${t.title}, ${taskWhen(t)}`, "ok");
          toast("Task added to your calendar", `${t.title} · ${taskWhen(t)}. ${host} has been told.`, "ok");
        } else {
          notifyStaff(t.ownerId, `${who} rejected the task ${t.title}: ${reason}`, "bad");
          toast("Task rejected", `${host} has been told your reason.`, "bad");
        }
      },
      respond: (meetingId, participantId, status, reason) => {
        mapMeeting(meetingId, (m) => ({
          ...m,
          participants: m.participants.map((p) =>
            p.id === participantId ? { ...p, status, reason, respondedAt: stamp() } : p,
          ),
          activity: [
            ...m.activity,
            {
              at: stamp(),
              text: `${m.participants.find((p) => p.id === participantId)?.name} ${status}${reason ? `: ${reason}` : ""}`,
            },
          ],
        }));
        const m = items.find((i) => i.id === meetingId);
        if (m && isMeeting(m) && m.organizerId !== me) {
          const who = m.participants.find((p) => p.id === participantId)?.name ?? "Someone";
          notifyStaff(
            m.organizerId,
            `${who} ${status} ${m.title}, ${when(m)}${reason ? `: ${reason}` : ""}`,
            status === "accepted" ? "ok" : "bad",
          );
          const host = firstName(m.organizerId);
          if (status === "accepted") {
            toast("Meeting added to your calendar", `${m.title} · ${when(m)}. ${host} has been told.`, "ok");
          } else {
            toast("Invite rejected", `${m.title} was removed from your calendar. ${host} has been told.`, "bad");
          }
        }
      },
      resend: (meetingId, participantId) => {
        mapMeeting(meetingId, (m) => ({
          ...m,
          participants: m.participants.map((p) => (p.id === participantId ? { ...p, emailFailed: false } : p)),
          activity: [...m.activity, { at: stamp(), text: "Invite sent again" }],
        }));
        toast("Invite sent again", undefined, "info");
      },
      cancelMeeting: (id) => {
        mapMeeting(id, (m) => ({
          ...m,
          cancelled: true,
          activity: [...m.activity, { at: stamp(), text: `Meeting cancelled. Cancellation email sent to ${m.participants.length} people` }],
        }));
        const m = items.find((i) => i.id === id);
        if (m && isMeeting(m)) {
          for (const p of m.participants) {
            if (p.staffId && p.staffId !== m.organizerId) {
              notifyStaff(p.staffId, `${staffById(m.organizerId).name} cancelled ${m.title}, ${when(m)}`, "bad");
            }
          }
        }
        toast("Meeting cancelled", "Every invitee gets a cancellation email. Staff calendars are updated.", "bad");
      },
      saveNotes: (id, notes) => {
        mapMeeting(id, (m) => ({ ...m, notes, activity: [...m.activity, { at: stamp(), text: "Notes saved" }] }));
        toast("Notes saved", undefined, "ok");
      },
      setAttendance: (meetingId, participantId, a) =>
        mapMeeting(meetingId, (m) => ({
          ...m,
          participants: m.participants.map((p) => (p.id === participantId ? { ...p, attendance: a } : p)),
        })),
      resetDemo: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        simulated.current = false;
        setMe(ME);
        setItems(INITIAL_ITEMS);
        setNotifications(INITIAL_NOTIFICATIONS);
        toast("Demo data reset", "All changes in this browser were cleared.", "info");
      },
    }),
    [loaded, me, items, elapsed, notifications, toasts, toast, notifyStaff, mapMeeting],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
