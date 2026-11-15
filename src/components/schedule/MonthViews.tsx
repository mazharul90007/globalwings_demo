"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { TODAY, addMonths, dayNum, monthGrid, monthLabel, sameMonth, weekStart, addDays } from "@/lib/time";
import type { ScheduleItem } from "@/lib/types";
import { EventChip } from "./EventCard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGrid({
  anchor,
  items,
  onDay,
  onOpen,
  onToggle,
}: {
  anchor: string;
  items: ScheduleItem[];
  onDay: (d: string) => void;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const days = monthGrid(anchor);
  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2.5 text-center text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const list = items
            .filter((i) => i.date === d)
            .sort((a, b) => (a.start ?? "99").localeCompare(b.start ?? "99"));
          const inMonth = sameMonth(d, anchor);
          return (
            <div
              key={d}
              onClick={() => onDay(d)}
              className={`min-h-[112px] cursor-pointer border-b border-l border-line p-1.5 transition hover:bg-brand-soft/30 ${
                inMonth ? "" : "bg-[#fafbfc] text-muted"
              } ${d === TODAY ? "bg-brand-soft/40" : ""}`}
            >
              <span
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-semibold ${
                  d === TODAY ? "bg-brand text-white" : ""
                }`}
              >
                {dayNum(d)}
              </span>
              <div className="space-y-1">
                {list.slice(0, 3).map((i) => (
                  <div
                    key={i.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(i.id);
                    }}
                  >
                    <EventChip item={i} onToggle={() => onToggle(i.id)} />
                  </div>
                ))}
                {list.length > 3 && <p className="px-1 text-[11px] font-semibold text-brand">+{list.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniCalendar({
  selected,
  view,
  items,
  onPick,
}: {
  selected: string;
  view: "day" | "week" | "month";
  items: ScheduleItem[];
  onPick: (d: string) => void;
}) {
  const [month, setMonth] = useState(selected);
  const shown = sameMonth(month, selected) ? month : month;
  const days = monthGrid(shown);
  const ws = weekStart(selected);
  const we = addDays(ws, 6);
  const has = new Set(items.map((i) => i.date));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold">{monthLabel(shown)}</p>
        <div className="flex gap-1">
          <button onClick={() => setMonth(addMonths(shown, -1))} className="rounded-md p-1 text-muted hover:bg-page hover:text-ink" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth(addMonths(shown, 1))} className="rounded-md p-1 text-muted hover:bg-page hover:text-ink" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w[0]}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[12.5px]">
        {days.map((d) => {
          const inWeek = view === "week" && d >= ws && d <= we;
          const isSel = view === "day" && d === selected;
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              className={`relative mx-auto flex h-7 w-full items-center justify-center transition ${
                inWeek ? "bg-brand-soft first:rounded-l-full" : ""
              } ${sameMonth(d, shown) ? "" : "text-[#c2c5cf]"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  d === TODAY ? "bg-brand font-bold text-white" : isSel ? "ring-2 ring-brand" : "hover:bg-page"
                }`}
              >
                {dayNum(d)}
              </span>
              {has.has(d) && d !== TODAY && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-warn" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
