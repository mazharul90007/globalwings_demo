"use client";

import { Clock } from "lucide-react";
import { LAST_MIN, TODAY, fmtTime, fromMin, toMin } from "@/lib/time";
import { inputCls } from "@/components/ui/primitives";

const DURATIONS = [15, 30, 45, 60, 90, 120];

export function fmtDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Returns a message when the time range is not valid, or null when it is. */
export function timeError(start: string, end: string): string | null {
  if (!start || !end) return "Enter a start and an end time.";
  // Any time of day is allowed. A meeting must end on the same day it starts.
  if (toMin(end) <= toMin(start)) return "End time must be after the start time, on the same day.";
  return null;
}

/**
 * Checked only when the user saves a meeting: refuses a start time that has already gone
 * (compared with the demo clock). Returns a message, or null when the time is fine.
 */
export function pastError(date: string, start: string, nowMin: number): string | null {
  if (date < TODAY || (date === TODAY && toMin(start) < nowMin)) {
    return "This meeting time has already passed. Pick a later date or time, then save again.";
  }
  return null;
}

/**
 * Date, start and end inputs with any minute (for example 2:40 or 1:35), plus
 * duration buttons that work out the end time. Changing the start keeps the duration.
 */
export function TimeFields({
  date,
  start,
  end,
  onDate,
  onTime,
  showTime = true,
}: {
  date: string;
  start: string;
  end: string;
  onDate: (d: string) => void;
  onTime: (start: string, end: string) => void;
  showTime?: boolean;
}) {
  const valid = !!start && !!end;
  const duration = valid ? toMin(end) - toMin(start) : 0;
  const error = showTime ? timeError(start, end) : null;

  const changeStart = (s: string) => {
    if (!s) return onTime(s, end);
    const keep = duration > 0 ? duration : 60;
    onTime(s, fromMin(Math.min(toMin(s) + keep, LAST_MIN)));
  };

  const pickDuration = (mins: number) => {
    if (!start) return;
    onTime(start, fromMin(Math.min(toMin(start) + mins, LAST_MIN)));
  };

  return (
    <div>
      <div className={`mb-1 grid gap-2 text-[12px] font-semibold text-muted ${showTime ? "grid-cols-[1.3fr_1fr_1fr]" : "grid-cols-1"}`}>
        <span>Date</span>
        {showTime && (
          <>
            <span>Start time</span>
            <span>End time</span>
          </>
        )}
      </div>
      <div className={`grid gap-2 ${showTime ? "grid-cols-[1.3fr_1fr_1fr]" : "grid-cols-1"}`}>
        <input type="date" value={date} onChange={(e) => onDate(e.target.value)} className={inputCls} aria-label="Date" />
        {showTime && (
          <>
            <input
              type="time"
              step={60}
              value={start}
              onChange={(e) => changeStart(e.target.value)}
              className={inputCls}
              aria-label="Start time"
            />
            <input
              type="time"
              step={60}
              value={end}
              onChange={(e) => onTime(start, e.target.value)}
              className={inputCls}
              aria-label="End time"
            />
          </>
        )}
      </div>

      {showTime && (
        <>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-semibold text-muted">Duration</span>
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pickDuration(d)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                  duration === d ? "bg-brand text-white" : "bg-page text-ink hover:bg-brand-soft hover:text-brand"
                }`}
              >
                {fmtDuration(d)}
              </button>
            ))}
          </div>
          {error ? (
            <p className="mt-2 text-[12px] text-bad">{error}</p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted">
              <Clock className="h-3.5 w-3.5" />
              {fmtTime(start)} to <span className="font-semibold text-ink">{fmtTime(end)}</span> · {fmtDuration(duration)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
