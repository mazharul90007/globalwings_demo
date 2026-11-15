"use client";

import { CalendarCheck2, ChevronLeft, ChevronRight, ListTodo, Plus, RotateCcw, TriangleAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { busyReason, isMeeting, myParticipant, visibleForMe } from "@/lib/logic";
import { useStore } from "@/lib/store";
import {
  LAST_MIN,
  TODAY,
  addDays,
  addMonths,
  fmtDate,
  fmtDateLong,
  fmtRange,
  fmtTime,
  fromMin,
  monthLabel,
  nowMinutes,
  rangeLabel,
  toMin,
  weekStart,
} from "@/lib/time";
import { AppShell } from "@/components/shell/AppShell";
import { ScheduleTabs } from "@/components/shell/ScheduleTabs";
import { Button, Card, Modal, inputCls } from "@/components/ui/primitives";
import { CreateDrawer, type CreatePreset } from "./CreateDrawer";
import { DetailsDrawer } from "./DetailsDrawer";
import { MiniCalendar, MonthGrid } from "./MonthViews";
import { TimeGrid } from "./TimeGrid";
import { TodayPanel } from "./TodayPanel";

type View = "day" | "week" | "month";
type Filter = "all" | "meeting" | "todo";

/** The schedule depends on the real date, which only the browser knows, so it renders after the store is ready. */
export function SchedulePage() {
  const { ready } = useStore();
  if (ready) return <ScheduleView />;
  return (
    <AppShell title="Schedule" crumbs={["SVP", "Schedule", "Calendar"]}>
      <div className="flex h-[60vh] items-center justify-center text-muted">Loading schedule...</div>
    </AppShell>
  );
}

function ScheduleView() {
  const { me: meId, items, elapsed, toggleDone, respond, addItem, toast, resetDemo } = useStore();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(TODAY);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [create, setCreate] = useState<CreatePreset | null>(null);
  const [quick, setQuick] = useState<{ date: string; start: string; x: number; y: number } | null>(null);
  const [answer, setAnswer] = useState<{ id: string; a: "accepted" | "rejected"; clash?: string } | null>(null);
  const [reason, setReason] = useState("");

  const nowMin = nowMinutes(elapsed);
  const mine = useMemo(() => visibleForMe(items, meId), [items, meId]);
  const shown = mine.filter((i) => filter === "all" || i.kind === filter);

  const days =
    view === "day" ? [anchor] : Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i));

  const move = (dir: number) => {
    if (view === "month") setAnchor(addMonths(anchor, dir));
    else setAnchor(addDays(anchor, dir * (view === "week" ? 7 : 1)));
  };

  const label =
    view === "month" ? monthLabel(anchor) : view === "week" ? rangeLabel(days[0], days[6]) : fmtDateLong(anchor);

  const toggle = (id: string) => {
    const t = items.find((i) => i.id === id);
    toggleDone(id);
    if (t && t.kind === "todo" && !t.done) toast("Nice work!", `${t.title} is done.`, "ok");
  };

  // Accept checks for a clash with my own calendar first. Reject asks for a reason.
  const requestAnswer = (id: string, a: "accepted" | "rejected") => {
    const m = items.find((i) => i.id === id);
    if (!m || !isMeeting(m)) return;
    if (a === "accepted") {
      const clash = busyReason(meId, m.date, m.start, m.end, items.filter((i) => !(isMeeting(i) && i.organizerId !== meId && myParticipant(i, meId)?.status === "pending")), m.id);
      if (clash) return setAnswer({ id, a, clash });
      respond(id, myParticipant(m, meId)!.id, "accepted");
      return;
    }
    setReason("");
    setAnswer({ id, a });
  };

  const answerMeeting = answer ? items.find((i) => i.id === answer.id) : undefined;

  return (
    <AppShell
      title="Schedule"
      crumbs={["SVP", "Schedule", "Calendar"]}
      actions={
        <div className="flex items-center gap-3">
          <ScheduleTabs />
          <Button
            variant="ghost"
            onClick={() => window.confirm("Reset the demo? Every meeting and to-do you added or changed in this browser will be cleared.") && resetDemo()}
            title="Clear saved changes and go back to the original dummy data"
          >
            <RotateCcw className="h-4 w-4" /> Reset demo
          </Button>
          <Button onClick={() => setCreate({ kind: "meeting", date: TODAY, start: "14:00" })}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px] min-[1700px]:grid-cols-[240px_minmax(0,1fr)_290px]">
        {/* Left column */}
        <div className="hidden space-y-4 min-[1700px]:block">
          <Card className="p-4">
            <Button className="mb-4 w-full" onClick={() => setCreate({ kind: "meeting", date: anchor, start: "14:00" })}>
              <Plus className="h-4 w-4" /> New meeting or to-do
            </Button>
            <MiniCalendar
              selected={anchor}
              view={view}
              items={mine}
              onPick={(d) => {
                setAnchor(d);
                if (view === "month") setView("day");
              }}
            />
          </Card>
          <Card className="p-4">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-muted">Colour key</p>
            <ul className="space-y-2.5 text-[13px]">
              <li className="flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded bg-brand" /> Meeting</li>
              <li className="flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded border-2 border-dashed border-brand/60" /> Invite waiting for your answer</li>
              <li className="flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded border-l-[3px] border-warn bg-warn-soft" /> To-do</li>
              <li className="flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded border-l-[3px] border-ok bg-ok-soft" /> To-do done</li>
              <li className="flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded border-l-[3px] border-bad bg-bad-soft" /> To-do overdue</li>
              <li className="flex items-center gap-2.5"><span className="striped-bg h-3.5 w-3.5 rounded border border-[#d5d9e6]" /> Cancelled</li>
            </ul>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="flex min-w-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setAnchor(TODAY)}>Today</Button>
            <div className="flex">
              <button onClick={() => move(-1)} className="rounded-l-lg p-1.5 ring-1 ring-line hover:bg-page" aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => move(1)} className="rounded-r-lg p-1.5 ring-1 ring-line hover:bg-page" aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <h2 className="ml-1 text-[15.5px] font-bold">{label}</h2>

            <div className="ml-auto flex flex-wrap gap-2">
              <div className="flex rounded-lg bg-page p-1">
                {([
                  ["all", "All", CalendarCheck2],
                  ["meeting", "Meetings", Users],
                  ["todo", "To-dos", ListTodo],
                ] as const).map(([v, l, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setFilter(v)}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12.5px] font-semibold transition ${
                      filter === v ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {l}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg bg-page p-1">
                {(["day", "week", "month"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-3 py-1 text-[12.5px] font-semibold capitalize transition ${
                      view === v ? "bg-brand text-white shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {view === "month" ? (
            <MonthGrid
              anchor={anchor}
              items={shown}
              onDay={(d) => {
                setAnchor(d);
                setView("day");
              }}
              onOpen={setOpenId}
              onToggle={toggle}
            />
          ) : (
            <TimeGrid
              days={days}
              items={shown}
              nowMin={nowMin}
              onSlot={(date, start, x, y) => setQuick({ date, start, x, y })}
              onOpen={setOpenId}
              onToggle={toggle}
              onAnswer={requestAnswer}
            />
          )}
        </Card>

        {/* Right column */}
        <TodayPanel items={mine} nowMin={nowMin} onOpen={setOpenId} onToggle={toggle} onAnswer={requestAnswer} />
      </div>

      {quick && (
        <QuickAdd
          {...quick}
          onClose={() => setQuick(null)}
          onMore={(kind, title) => {
            setCreate({ kind, date: quick.date, start: quick.start, title });
            setQuick(null);
          }}
          onSaveTodo={(title) => {
            addItem({
              id: `q-${Date.now()}`,
              kind: "todo",
              title,
              date: quick.date,
              start: quick.start,
              end: fromMin(Math.min(toMin(quick.start) + 60, LAST_MIN)),
              priority: "normal",
              done: false,
              ownerId: meId,
            });
            toast("To-do added", `${title} · ${fmtDate(quick.date)}, ${fmtTime(quick.start)}`, "ok");
            setQuick(null);
          }}
        />
      )}

      <CreateDrawer preset={create} onClose={() => setCreate(null)} onCreated={(d) => setAnchor(d)} />
      <DetailsDrawer id={openId} nowMin={nowMin} onClose={() => setOpenId(null)} onOpen={setOpenId} onAnswer={requestAnswer} />

      {/* Clash warning on accept */}
      <Modal open={!!answer && answer.a === "accepted"} onClose={() => setAnswer(null)} title="You already have something at this time">
        {answerMeeting && isMeeting(answerMeeting) && (
          <>
            <div className="flex gap-3 rounded-lg bg-warn-soft p-3 text-[#7a5205]">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                You have <b>{answer?.clash}</b> at this time. <b>{answerMeeting.title}</b> is {fmtDate(answerMeeting.date)},{" "}
                {fmtRange(answerMeeting.start, answerMeeting.end)}.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAnswer(null)}>Go back</Button>
              <Button
                variant="ok"
                onClick={() => {
                  respond(answerMeeting.id, myParticipant(answerMeeting, meId)!.id, "accepted");
                  setAnswer(null);
                }}
              >
                Accept anyway
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Reject with reason */}
      <Modal open={!!answer && answer.a === "rejected"} onClose={() => setAnswer(null)} title="Reject this invite?">
        {answerMeeting && isMeeting(answerMeeting) && (
          <>
            <p className="mb-3 text-muted">
              {answerMeeting.title} · {fmtDate(answerMeeting.date)}, {fmtTime(answerMeeting.start)}
            </p>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[#495057]">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. I have a student visit at this time"
              className={`${inputCls} h-auto py-2`}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAnswer(null)}>Go back</Button>
              <Button
                variant="bad"
                onClick={() => {
                  respond(answerMeeting.id, myParticipant(answerMeeting, meId)!.id, "rejected", reason.trim() || undefined);
                  setAnswer(null);
                  setOpenId(null);
                }}
              >
                Confirm reject
              </Button>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}

function QuickAdd({
  date,
  start,
  x,
  y,
  onClose,
  onMore,
  onSaveTodo,
}: {
  date: string;
  start: string;
  x: number;
  y: number;
  onClose: () => void;
  onMore: (kind: "meeting" | "todo", title: string) => void;
  onSaveTodo: (title: string) => void;
}) {
  const [kind, setKind] = useState<"meeting" | "todo">("todo");
  const [title, setTitle] = useState("");
  const w = 320;
  const left = typeof window !== "undefined" ? Math.min(x + 12, window.innerWidth - w - 16) : x;
  const top = typeof window !== "undefined" ? Math.min(y - 20, window.innerHeight - 260) : y;
  const end = fromMin(Math.min(toMin(start) + 60, LAST_MIN));

  return (
    <div className="fixed inset-0 z-[55]" onClick={onClose}>
      <div
        className="absolute animate-pop rounded-xl bg-white p-4 shadow-2xl ring-1 ring-line"
        style={{ left, top, width: w }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex rounded-lg bg-page p-1">
          {(["meeting", "todo"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12.5px] font-semibold transition ${
                kind === k ? "bg-white text-brand shadow-sm" : "text-muted"
              }`}
            >
              {k === "meeting" ? <Users className="h-3.5 w-3.5" /> : <ListTodo className="h-3.5 w-3.5" />}
              {k === "meeting" ? "Meeting" : "To-do"}
            </button>
          ))}
        </div>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !title.trim()) return;
            if (kind === "todo") onSaveTodo(title.trim());
            else onMore("meeting", title.trim());
          }}
          placeholder={kind === "meeting" ? "Meeting title" : "What do you need to do?"}
          className={inputCls}
        />
        <p className="mt-2 text-[12.5px] text-muted">
          {fmtDate(date)} · {fmtRange(start, end)}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onMore(kind, title)}>More options</Button>
          {kind === "todo" ? (
            <Button size="sm" disabled={!title.trim()} onClick={() => onSaveTodo(title.trim())}>Save</Button>
          ) : (
            <Button size="sm" onClick={() => onMore("meeting", title)}>Add invitees</Button>
          )}
        </div>
      </div>
    </div>
  );
}
