"use client";

import { Archive, ArrowLeft, CalendarDays, Clock, FileText, MapPin, Paperclip, Reply, Star, Trash2, User, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/primitives";

type Variant = "invite" | "updated" | "cancelled";

const VARIANTS: { key: Variant; label: string }[] = [
  { key: "invite", label: "New invite" },
  { key: "updated", label: "Updated time" },
  { key: "cancelled", label: "Cancelled" },
];

export function EmailPreview() {
  const [variant, setVariant] = useState<Variant>("invite");
  const date = variant === "updated" ? "Saturday, 21 November 2026" : "Friday, 20 November 2026";
  const time = variant === "updated" ? "4:00 PM to 4:45 PM" : "3:00 PM to 3:45 PM";
  const subject = {
    invite: "Meeting invitation: Visa file review, Fri 20 Nov 2026, 3:00 PM (GMT+6)",
    updated: "Updated time: Visa file review, now Sat 21 Nov 2026, 4:00 PM (GMT+6)",
    cancelled: "Cancelled: Visa file review, Fri 20 Nov 2026, 3:00 PM (GMT+6)",
  }[variant];

  return (
    <div className="min-h-screen bg-[#eef0f4]">
      <div className="mx-auto max-w-[980px] px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold">What the invitee receives</h1>
            <p className="text-muted">Shown in a generic mail app. The email is sent from the organizer&apos;s own mailbox when SMTP is set up.</p>
          </div>
          <div className="flex rounded-lg bg-white p-1 shadow-sm">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                onClick={() => setVariant(v.key)}
                className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  variant === v.key ? "bg-brand text-white" : "text-muted hover:text-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mail client frame */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center gap-4 border-b border-line px-5 py-3 text-muted">
            <ArrowLeft className="h-4.5 w-4.5" />
            <Archive className="h-4.5 w-4.5" />
            <Trash2 className="h-4.5 w-4.5" />
            <span className="ml-auto flex items-center gap-4">
              <Star className="h-4.5 w-4.5" />
              <Reply className="h-4.5 w-4.5" />
            </span>
          </div>
          <div className="px-6 pt-5">
            <h2 className="text-[20px] font-semibold">{subject}</h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name="Tanvir Ahmed" color="#0087ca" size={40} />
              <div>
                <p className="font-semibold">
                  Tanvir Ahmed <span className="font-normal text-muted">&lt;tanvir@globalwings.example&gt;</span>
                </p>
                <p className="text-[12.5px] text-muted">to Ayesha Rahman &lt;ayesha.rahman@gmail.example&gt;</p>
              </div>
              <span className="ml-auto text-[12.5px] text-muted">18 Nov 2026, 4:30 PM</span>
            </div>
          </div>

          {/* Email body */}
          <div className="bg-[#f4f5fa] px-4 py-8 sm:px-10">
            <div className="mx-auto max-w-[600px] overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between bg-brand px-8 py-5">
                <span className="rounded-md bg-white px-2.5 py-1">
                  <Image src="/globalwings.png" alt="Global Wings" width={120} height={27} />
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-wider text-white/70">
                  {variant === "invite" ? "Meeting invitation" : variant === "updated" ? "Updated time" : "Meeting cancelled"}
                </span>
              </div>

              <div className="px-8 py-7">
                <p className="text-[15px]">Hello Ayesha,</p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#495057]">
                  {variant === "invite" && "Tanvir from Global Wings has invited you to a meeting."}
                  {variant === "updated" && "Tanvir has moved this meeting to a new time. Please confirm that the new time works for you."}
                  {variant === "cancelled" && "Tanvir has cancelled this meeting. It has been removed from your calendar if you added it."}
                </p>

                <div className={`mt-6 rounded-xl border ${variant === "cancelled" ? "border-bad/30 bg-bad-soft/40" : "border-line bg-[#fafbfd]"} p-5`}>
                  <p className={`text-[18px] font-bold ${variant === "cancelled" ? "text-muted line-through" : "text-brand"}`}>Visa file review</p>
                  <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-2.5 text-[14px]">
                    <dt className="flex items-center gap-2 text-muted"><CalendarDays className="h-4 w-4" /> Date</dt>
                    <dd className="font-medium">
                      {date}
                      {variant === "updated" && <span className="ml-2 rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-bold text-[#b77d14]">NEW</span>}
                    </dd>
                    <dt className="flex items-center gap-2 text-muted"><Clock className="h-4 w-4" /> Time</dt>
                    <dd className="font-medium">{time} (Asia/Dhaka, GMT+6)</dd>
                    <dt className="flex items-center gap-2 text-muted"><Video className="h-4 w-4" /> Mode</dt>
                    <dd className="font-medium">Online</dd>
                    <dt className="flex items-center gap-2 text-muted"><MapPin className="h-4 w-4" /> Link</dt>
                    <dd className="font-medium text-info">meet.google.com/abc-defg-hij</dd>
                    <dt className="flex items-center gap-2 text-muted"><User className="h-4 w-4" /> Organizer</dt>
                    <dd className="font-medium">Tanvir Ahmed, Senior Counsellor</dd>
                    <dt className="flex items-center gap-2 text-muted"><FileText className="h-4 w-4" /> Agenda</dt>
                    <dd className="font-medium">Review of passport scan and bank statement</dd>
                  </dl>
                </div>

                {variant !== "cancelled" ? (
                  <>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/respond?a=accept"
                        className="flex flex-1 items-center justify-center rounded-lg bg-ok px-6 py-3.5 text-[15px] font-bold text-white shadow-md shadow-ok/30 transition hover:-translate-y-0.5 hover:bg-[#099885]"
                      >
                        Accept and Add to Calendar
                      </Link>
                      <Link
                        href="/respond?a=reject"
                        className="flex items-center justify-center rounded-lg border-2 border-[#ced4da] px-8 py-3 text-[15px] font-bold text-[#495057] transition hover:border-bad hover:text-bad"
                      >
                        Reject
                      </Link>
                    </div>
                    <p className="mt-4 text-center text-[12.5px] text-muted">
                      You can change your answer any time before the meeting by using the buttons above.
                    </p>
                  </>
                ) : (
                  <p className="mt-6 text-center text-[13px] text-muted">No action is needed.</p>
                )}
              </div>
              <div className="border-t border-line bg-[#fafbfc] px-8 py-4 text-center text-[11.5px] text-muted">
                Global Wings · Gulshan, Dhaka · This invite was sent by SVP Schedule.
              </div>
            </div>
          </div>

          {/* Attachment */}
          <div className="flex items-center gap-3 border-t border-line px-6 py-4">
            <Paperclip className="h-4 w-4 text-muted" />
            <span className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
              <CalendarDays className="h-5 w-5 text-brand" />
              <span>
                <span className="block text-[13px] font-semibold">invite.ics</span>
                <span className="text-[11.5px] text-muted">
                  {variant === "cancelled" ? "Removes the event from Outlook and Apple calendars" : "Opens in Outlook, Apple Mail and Gmail"}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
