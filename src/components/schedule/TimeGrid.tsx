"use client";

import { useEffect, useRef } from "react";
import { DAY_END, DAY_START, HOUR_PX, SCROLL_HOUR, TODAY, dayNum, dayShort, fromMin, toMin } from "@/lib/time";
import type { ScheduleItem } from "@/lib/types";
import { EventCard, EventChip } from "./EventCard";

interface Placed {
  item: ScheduleItem;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

/** Lay out overlapping timed items side by side. */
function layout(items: ScheduleItem[]): Placed[] {
  const timed = items
    .filter((i) => i.start && i.end)
    .sort((a, b) => toMin(a.start!) - toMin(b.start!) || toMin(b.end!) - toMin(a.end!));
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    cluster.forEach((p) => (p.lanes = lanes));
    out.push(...cluster);
    cluster = [];
  };
  for (const item of timed) {
    const s = toMin(item.start!);
    const e = toMin(item.end!);
    if (s >= clusterEnd && cluster.length) flush();
    const used = new Set(cluster.filter((p) => toMin(p.item.end!) > s).map((p) => p.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({
      item,
      top: ((s - DAY_START * 60) / 60) * HOUR_PX,
      height: Math.max(22, ((e - s) / 60) * HOUR_PX - 3),
      lane,
      lanes: 1,
    });
    clusterEnd = Math.max(clusterEnd, e);
  }
  if (cluster.length) flush();
  return out;
}

export function TimeGrid({
  days,
  items,
  nowMin,
  onSlot,
  onOpen,
  onToggle,
  onAnswer,
}: {
  days: string[];
  items: ScheduleItem[];
  nowMin: number;
  onSlot: (date: string, start: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onAnswer: (id: string, a: "accepted" | "rejected") => void;
}) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const scroller = useRef<HTMLDivElement>(null);
  const nowTop = ((nowMin - DAY_START * 60) / 60) * HOUR_PX;

  // Open at 8 AM, or one hour before now when it is later than that.
  const firstScroll = useRef(Math.max(SCROLL_HOUR, Math.floor(nowMin / 60) - 1));
  useEffect(() => {
    scroller.current?.scrollTo({ top: (firstScroll.current - DAY_START) * HOUR_PX - HOUR_PX / 2 });
  }, []);

  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Day headers */}
      <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map((d) => {
          const today = d === TODAY;
          return (
            <div key={d} className={`flex flex-col items-center gap-0.5 py-2.5 ${today ? "bg-brand-soft/60" : ""}`}>
              <span className={`text-[11.5px] font-semibold uppercase tracking-wide ${today ? "text-brand" : "text-muted"}`}>
                {dayShort(d)}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[16px] font-bold ${
                  today ? "bg-brand text-white shadow-md shadow-brand/40" : "text-ink"
                }`}
              >
                {dayNum(d)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Untimed to-dos */}
      <div className="grid border-b border-line bg-[#fafbfc]" style={{ gridTemplateColumns: cols }}>
        <div className="flex items-center justify-end pr-2 text-[10.5px] font-semibold uppercase text-muted">To-do</div>
        {days.map((d) => {
          const list = items.filter((i) => i.date === d && !i.start);
          return (
            <div key={d} className={`min-h-[34px] space-y-1 border-l border-line p-1 ${d === TODAY ? "bg-brand-soft/40" : ""}`}>
              {list.map((i) => (
                // A div, not a button: the chip holds its own "Mark done" button, and buttons cannot nest.
                <div
                  key={i.id}
                  role="button"
                  tabIndex={0}
                  title={i.title}
                  className="block w-full cursor-pointer text-left"
                  onClick={() => onOpen(i.id)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onOpen(i.id);
                    }
                  }}
                >
                  <EventChip item={i} onToggle={() => onToggle(i.id)} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(100vh - 330px)", minHeight: 460 }}>
        <div className="grid" style={{ gridTemplateColumns: cols, height: hours.length * HOUR_PX }}>
          <div className="relative">
            {hours.map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted"
                style={{ top: (h - DAY_START) * HOUR_PX }}
              >
                {h === DAY_START ? "" : `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? "PM" : "AM"}`}
              </span>
            ))}
          </div>
          {days.map((d) => {
            const placed = layout(items.filter((i) => i.date === d));
            const today = d === TODAY;
            return (
              <div
                key={d}
                className={`relative border-l border-line ${today ? "bg-brand-soft/25" : ""}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const min = DAY_START * 60 + Math.floor((y / HOUR_PX) * 2) * 30;
                  onSlot(d, fromMin(Math.min(min, DAY_END * 60 - 30)), e.clientX, e.clientY);
                }}
              >
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: (h - DAY_START) * HOUR_PX }}>
                    <div className="border-t border-dashed border-line/70" style={{ marginTop: HOUR_PX / 2 - 1 }} />
                  </div>
                ))}
                {placed.map((p) => (
                  <div
                    key={p.item.id}
                    className="absolute cursor-pointer px-[2px] transition hover:z-20 hover:-translate-y-px"
                    style={{
                      top: p.top + 1,
                      height: p.height,
                      left: `${(p.lane / p.lanes) * 100}%`,
                      width: `${100 / p.lanes}%`,
                    }}
                    title={p.item.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(p.item.id);
                    }}
                  >
                    <EventCard
                      item={p.item}
                      height={p.height}
                      nowMin={nowMin}
                      onToggle={() => onToggle(p.item.id)}
                      onAnswer={(a) => onAnswer(p.item.id, a)}
                    />
                  </div>
                ))}
                {today && nowTop > 0 && nowTop < hours.length * HOUR_PX && (
                  <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }}>
                    <div className="relative h-[2px] bg-bad">
                      <span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-bad ring-2 ring-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
