"use client";

import { Ban, CalendarDays, CalendarPlus, Clock, Download, Hourglass, Loader2, ShieldCheck, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { googleCalendarUrl, icsFile, downloadText, isMeeting } from "@/lib/logic";
import { useStore } from "@/lib/store";
import type { Meeting } from "@/lib/types";

type State = "loading" | "accepted" | "reject-form" | "rejected" | "cancelled" | "expired";

function AnimatedMark({ ok }: { ok: boolean }) {
  return (
    <div className={`mx-auto flex h-24 w-24 animate-pop items-center justify-center rounded-full ${ok ? "bg-ok-soft" : "bg-bad-soft"}`}>
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${ok ? "bg-ok shadow-lg shadow-ok/40" : "bg-bad shadow-lg shadow-bad/40"}`}>
        <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {ok ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" className="animate-draw" />
          ) : (
            <path d="M7 7l10 10M17 7L7 17" strokeDasharray="30" strokeDashoffset="30" className="animate-draw" />
          )}
        </svg>
      </div>
    </div>
  );
}

export function RespondPage({ initial }: { initial: "accept" | "reject" }) {
  const { items, respond } = useStore();
  const m = items.find((i) => i.id === "m6");
  const meeting = m && isMeeting(m) ? m : null;
  const [state, setState] = useState<State>(initial === "accept" ? "loading" : "reject-form");
  const [reason, setReason] = useState("");

  // The link opens this page; the page posts the answer. Email scanners that only open the link change nothing.
  useEffect(() => {
    if (state !== "loading") return;
    const t = setTimeout(() => {
      respond("m6", "p61", "accepted");
      setState("accepted");
    }, 900);
    return () => clearTimeout(t);
  }, [state, respond]);

  if (!meeting) return null;

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto grid max-w-[1100px] items-start gap-8 px-4 py-8 lg:grid-cols-[1fr_400px]">
        {/* Explainer */}
        <div className="order-2 space-y-4 lg:order-1 lg:pt-6">
          <h1 className="text-[24px] font-bold leading-tight">Public response page</h1>
          <p className="max-w-[520px] text-[14px] text-[#495057]">
            The invitee lands here after clicking a button in the email. No login is needed. Most invitees open email on a phone, so the page is built for phones first.
          </p>
          <div className="max-w-[520px] rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">Try each state</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["loading", "Accept"],
                ["reject-form", "Reject"],
                ["cancelled", "Meeting cancelled"],
                ["expired", "Link expired"],
              ] as const).map(([s, l]) => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  className="rounded-lg bg-page px-3 py-1.5 text-[12.5px] font-semibold text-brand ring-1 ring-line hover:bg-brand-soft"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex max-w-[520px] gap-3 rounded-xl bg-white p-4 shadow-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 text-ok" />
            <p className="text-[13px] text-[#495057]">
              The email link only opens this page. The page then sends the answer, so email link scanners cannot accept a meeting by mistake.
            </p>
          </div>
          <Link href="/schedule" className="inline-block text-[13px] font-semibold text-brand hover:underline">
            Open SVP to see what the organizer sees →
          </Link>
        </div>

        {/* Phone */}
        <div className="order-1 mx-auto w-full max-w-[380px] lg:order-2">
          <div className="rounded-[42px] bg-[#1b2033] p-3 shadow-2xl">
            <div className="relative overflow-hidden rounded-[32px] bg-white">
              <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#1b2033]" />
              <div className="min-h-[640px] px-5 pb-8 pt-4">
                <div className="mb-6 flex justify-center">
                  <Image src="/globalwings.png" alt="Global Wings" width={130} height={29} />
                </div>

                <MeetingSummary m={meeting} faded={state === "cancelled" || state === "expired"} />

                <div className="mt-6">
                  {state === "loading" && (
                    <div className="flex flex-col items-center gap-3 py-8 text-muted">
                      <Loader2 className="h-8 w-8 animate-spin text-ok" />
                      Saving your answer...
                    </div>
                  )}

                  {state === "accepted" && (
                    <div className="text-center">
                      <AnimatedMark ok />
                      <p className="mt-4 text-[20px] font-bold">You have accepted</p>
                      <p className="mt-1 text-muted">Tanvir has been told. See you there!</p>
                      <a
                        href={googleCalendarUrl(meeting)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                      >
                        <CalendarPlus className="h-5 w-5" /> Add to Google Calendar
                      </a>
                      <button
                        onClick={() => downloadText("invite.ics", icsFile(meeting), "text/calendar")}
                        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-brand ring-1 ring-line hover:bg-page"
                      >
                        <Download className="h-4 w-4" /> Outlook or Apple Calendar (.ics)
                      </button>
                      <button onClick={() => setState("reject-form")} className="mt-5 text-[13px] text-muted underline underline-offset-2 hover:text-bad">
                        Changed your mind? Reject instead
                      </button>
                    </div>
                  )}

                  {state === "reject-form" && (
                    <div className="animate-pop">
                      <p className="text-[17px] font-bold">Reject this meeting?</p>
                      <p className="mt-1 text-[13px] text-muted">Tell Tanvir why, if you like. This is optional.</p>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="e.g. I have a class at this time"
                        className="mt-3 w-full rounded-xl border border-[#ced4da] p-3 outline-none focus:border-bad focus:ring-3 focus:ring-bad/15"
                      />
                      <button
                        onClick={() => {
                          respond("m6", "p61", "rejected", reason.trim() || undefined);
                          setState("rejected");
                        }}
                        className="mt-3 w-full rounded-xl bg-bad py-3.5 font-bold text-white shadow-lg shadow-bad/30 transition hover:bg-[#d9573c]"
                      >
                        Confirm
                      </button>
                      <button onClick={() => setState("loading")} className="mt-3 w-full text-center text-[13px] text-muted underline underline-offset-2 hover:text-ok">
                        Accept instead
                      </button>
                    </div>
                  )}

                  {state === "rejected" && (
                    <div className="text-center">
                      <AnimatedMark ok={false} />
                      <p className="mt-4 text-[20px] font-bold">You have rejected</p>
                      <p className="mt-1 text-muted">Tanvir has been told{reason.trim() ? " and can see your reason" : ""}.</p>
                      <button onClick={() => setState("loading")} className="mt-6 text-[13px] text-muted underline underline-offset-2 hover:text-ok">
                        Changed your mind? Accept instead
                      </button>
                    </div>
                  )}

                  {state === "cancelled" && (
                    <div className="py-4 text-center">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-page">
                        <Ban className="h-8 w-8 text-muted" />
                      </span>
                      <p className="mt-4 text-[18px] font-bold">This meeting was cancelled</p>
                      <p className="mt-1 text-muted">Your answer was not changed. No action is needed.</p>
                    </div>
                  )}

                  {state === "expired" && (
                    <div className="py-4 text-center">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warn-soft">
                        <Hourglass className="h-8 w-8 text-warn" />
                      </span>
                      <p className="mt-4 text-[18px] font-bold">This link has expired</p>
                      <p className="mt-1 text-muted">The meeting has already started or ended. Please contact Tanvir directly.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingSummary({ m, faded }: { m: Meeting; faded: boolean }) {
  return (
    <div className={`rounded-2xl bg-brand p-4 text-white shadow-lg shadow-brand/25 ${faded ? "opacity-50 grayscale" : ""}`}>
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-white/70">Meeting with Tanvir Ahmed</p>
      <p className="mt-1 text-[18px] font-bold">{m.title}</p>
      <div className="mt-3 space-y-1.5 text-[13px] text-white/85">
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Friday, 20 November 2026</p>
        <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> 3:00 PM – 3:45 PM (GMT+6)</p>
        <p className="flex items-center gap-2"><Video className="h-4 w-4" /> Online · Google Meet</p>
      </div>
    </div>
  );
}
