"use client";

import { ArrowDownRight, ArrowUpRight, Download, Eye, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { REPORT, staffById } from "@/lib/data";
import { downloadText } from "@/lib/logic";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/shell/AppShell";
import { ScheduleTabs } from "@/components/shell/ScheduleTabs";
import { Avatar, Button, Card, inputCls } from "@/components/ui/primitives";

const RANGES = { month: { label: "This month", k: 1 }, quarter: { label: "Last 3 months", k: 2.8 }, year: { label: "Last 12 months", k: 10.5 } };

function Title({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold">{title}</h3>
      {sub && <p className="text-[12.5px] text-muted">{sub}</p>}
    </div>
  );
}

export function ReportsPage() {
  const { me: meId, toast } = useStore();
  const [range, setRange] = useState<keyof typeof RANGES>("month");
  const [staff, setStaff] = useState<number | "all">("all");
  const [viewAs, setViewAs] = useState<"admin" | "self">("admin");
  const k = RANGES[range].k;
  const focus = viewAs === "self" ? meId : staff;

  const perStaff = REPORT.perStaff.filter((r) => viewAs === "admin" || r.staffId === meId);
  const maxStaff = Math.max(...REPORT.perStaff.map((r) => Math.max(r.organized, r.attended)));
  const acc = REPORT.acceptance;
  const accTotal = acc.accepted + acc.rejected + acc.expired;
  const todos = REPORT.todosOnTime.filter((r) => viewAs === "admin" || r.staffId === meId);

  const exportCsv = () => {
    const rows = [
      "Staff,Meetings organized,Meetings attended,To-dos on time %",
      ...REPORT.perStaff.map((r) => {
        const t = REPORT.todosOnTime.find((x) => x.staffId === r.staffId)!;
        return `${staffById(r.staffId).name},${Math.round(r.organized * k)},${Math.round(r.attended * k)},${t.pct}`;
      }),
    ];
    downloadText(`schedule-report-${range}.csv`, rows.join("\n"), "text/csv");
    toast("CSV exported", `schedule-report-${range}.csv`, "ok");
  };

  return (
    <AppShell
      title="Schedule reports"
      crumbs={["SVP", "Schedule", "Reports"]}
      actions={
        <div className="flex items-center gap-3">
          <ScheduleTabs />
          <Button variant="ghost" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
        <select value={range} onChange={(e) => setRange(e.target.value as keyof typeof RANGES)} className={`${inputCls} w-44!`}>
          {Object.entries(RANGES).map(([v, r]) => (
            <option key={v} value={v}>{r.label}</option>
          ))}
        </select>
        <select
          value={staff}
          disabled={viewAs === "self"}
          onChange={(e) => setStaff(e.target.value === "all" ? "all" : Number(e.target.value))}
          className={`${inputCls} w-52!`}
        >
          <option value="all">All staff</option>
          {REPORT.perStaff.map((r) => (
            <option key={r.staffId} value={r.staffId}>{staffById(r.staffId).name}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12.5px] text-muted">Preview as</span>
          <div className="flex rounded-lg bg-page p-1">
            <button
              onClick={() => setViewAs("admin")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12.5px] font-semibold ${viewAs === "admin" ? "bg-white text-brand shadow-sm" : "text-muted"}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin (whole team)
            </button>
            <button
              onClick={() => setViewAs("self")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[12.5px] font-semibold ${viewAs === "self" ? "bg-white text-brand shadow-sm" : "text-muted"}`}
            >
              <Eye className="h-3.5 w-3.5" /> Staff (own numbers)
            </button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {REPORT.kpis.map((kpi, i) => (
          <Card key={kpi.label} className="relative overflow-hidden p-4">
            <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full ${["bg-brand-soft", "bg-ok-soft", "bg-info-soft", "bg-warn-soft", "bg-bad-soft"][i]}`} />
            <p className="relative text-[12px] font-semibold uppercase tracking-wide text-muted">{kpi.label}</p>
            <p className="relative mt-2 text-[26px] font-bold leading-none">
              {i === 0 ? Math.round(46 * k) : kpi.value}
            </p>
            <p className={`relative mt-2 flex items-center gap-1 text-[12px] font-semibold ${kpi.up ? "text-ok" : "text-bad"}`}>
              {kpi.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {kpi.delta}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Meetings per staff */}
        <Card className="p-5 xl:col-span-2">
          <Title title="Meetings per staff member" sub={`${RANGES[range].label} · organized and attended`} />
          <div className="mb-3 flex gap-4 text-[12px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Organized</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ok" /> Attended</span>
          </div>
          <ul className="space-y-3">
            {perStaff.map((r) => {
              const s = staffById(r.staffId);
              const dim = focus !== "all" && focus !== r.staffId;
              return (
                <li key={r.staffId} className={`grid grid-cols-[150px_1fr] items-center gap-3 transition ${dim ? "opacity-30" : ""}`}>
                  <span className="flex items-center gap-2 truncate">
                    <Avatar name={s.name} color={s.color} size={24} /> <span className="truncate font-medium">{s.name}</span>
                  </span>
                  <div className="space-y-1">
                    {(["organized", "attended"] as const).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ${key === "organized" ? "bg-brand" : "bg-ok"}`}
                          style={{ width: `${(r[key] / maxStaff) * 85}%` }}
                        />
                        <span className="text-[11.5px] font-semibold text-muted">{Math.round(r[key] * k)}</span>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Acceptance */}
        <Card className="p-5">
          <Title title="Acceptance rate" sub="Answers to invites sent" />
          <Donut
            parts={[
              { value: acc.accepted, color: "#0ab39c", label: "Accepted" },
              { value: acc.rejected, color: "#f06548", label: "Rejected" },
              { value: acc.expired, color: "#f7b84b", label: "Expired" },
            ]}
            center={`${Math.round((acc.accepted / accTotal) * 100)}%`}
          />
          <p className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-wide text-muted">Top reject reasons</p>
          <ul className="space-y-1.5">
            {REPORT.rejectReasons.map((r) => (
              <li key={r.reason} className="flex justify-between">
                <span>{r.reason}</span>
                <span className="font-semibold">{Math.round(r.count * k)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Trend */}
        <Card className="p-5 xl:col-span-2">
          <Title title="Meetings per week" sub="Last 8 weeks" />
          <Trend values={REPORT.trend} labels={REPORT.trendLabels} />
        </Card>

        {/* Response time */}
        <Card className="p-5">
          <Title title="Average response time" sub="From invite sent to answer" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand-soft p-3">
              <p className="text-[12px] text-muted">Internal staff</p>
              <p className="text-[22px] font-bold text-brand">1h 05m</p>
            </div>
            <div className="rounded-xl bg-info-soft p-3">
              <p className="text-[12px] text-muted">External invitees</p>
              <p className="text-[22px] font-bold text-info">6h 40m</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5">
            {REPORT.responseTime.buckets.map((b) => (
              <li key={b.label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="font-medium">{b.label}</span>
                  <span className="text-muted">{b.internal}% · {b.external}%</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-2 rounded-full bg-brand" style={{ width: `${b.internal}%` }} />
                  <div className="h-2 rounded-full bg-info" style={{ width: `${b.external}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Heat map */}
        <Card className="p-5 xl:col-span-2">
          <Title title="Busiest days" sub="Meeting hours by weekday and hour" />
          <Heatmap />
        </Card>

        {/* To-dos on time */}
        <Card className="p-5">
          <Title title="To-dos completed on time" sub="Marked Done by the end of their day" />
          <ul className="space-y-3">
            {todos.map((t) => {
              const s = staffById(t.staffId);
              const dim = focus !== "all" && focus !== t.staffId;
              const color = t.pct >= 80 ? "bg-ok" : t.pct >= 70 ? "bg-warn" : "bg-bad";
              return (
                <li key={t.staffId} className={dim ? "opacity-30" : ""}>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className="font-medium">{s.name}</span>
                    <span className="font-semibold">{t.pct}% <span className="font-normal text-muted">· follow-ups {t.followUps}%</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-page">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${t.pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* No-shows */}
        <Card className="p-5 xl:col-span-3">
          <Title title="No-show rate" sub="Per student, agent and staff member · from the attendance marked after each meeting" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                  <th className="py-2.5 font-semibold">Name</th>
                  <th className="py-2.5 font-semibold">Type</th>
                  <th className="py-2.5 font-semibold">Meetings</th>
                  <th className="py-2.5 font-semibold">No-shows</th>
                  <th className="w-1/3 py-2.5 font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody>
                {REPORT.noShows.map((r) => {
                  const rate = Math.round((r.noShows / r.meetings) * 100);
                  return (
                    <tr key={r.name} className="border-b border-line last:border-0">
                      <td className="py-3">
                        <span className="flex items-center gap-2 font-medium"><Avatar name={r.name} size={26} /> {r.name}</span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${r.kind === "Student" ? "bg-info-soft text-[#1d7fb6]" : r.kind === "Agent" ? "bg-brand-soft text-brand" : "bg-page text-muted"}`}>
                          {r.kind}
                        </span>
                      </td>
                      <td className="py-3">{r.meetings}</td>
                      <td className="py-3">{r.noShows}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-page">
                            <div className={`h-full rounded-full ${rate > 20 ? "bg-bad" : rate > 0 ? "bg-warn" : "bg-ok"}`} style={{ width: `${Math.max(rate, 2)}%` }} />
                          </div>
                          <span className="w-10 text-right font-semibold">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Donut({ parts, center }: { parts: { value: number; color: string; label: string }[]; center: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  const offsets = parts.map((_, i) => parts.slice(0, i).reduce((s, p) => s + (p.value / total) * c, 0));
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f3f3f9" strokeWidth="18" />
        {parts.map((p, i) => {
          const len = (p.value / total) * c;
          return (
            <circle
              key={p.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="18"
              strokeDasharray={`${len - 2} ${c - len + 2}`}
              strokeDashoffset={-offsets[i]}
            />
          );
        })}
        <text x="70" y="70" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[22px] font-bold" transform="rotate(90 70 70)">
          {center}
        </text>
      </svg>
      <ul className="space-y-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.label}</span>
            <span className="font-semibold">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Trend({ values, labels }: { values: number[]; labels: string[] }) {
  const w = 640;
  const h = 200;
  const pad = 28;
  const max = Math.max(...values) * 1.15;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (w - pad * 2), h - pad - (v / max) * (h - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${pts.at(-1)![0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0087ca" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0087ca" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad} x2={w - pad} y1={h - pad - f * (h - pad * 2)} y2={h - pad - f * (h - pad * 2)} stroke="#e9ebec" strokeDasharray="4 4" />
      ))}
      <path d={area} fill="url(#trend)" />
      <path d={line} fill="none" stroke="#0087ca" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3.5} fill="white" stroke="#0087ca" strokeWidth="2.5" />
          <text x={x} y={y - 12} textAnchor="middle" className="fill-ink text-[11px] font-semibold">{values[i]}</text>
          <text x={x} y={h - 8} textAnchor="middle" className="fill-muted text-[11px]">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function Heatmap() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 10 }, (_, i) => 9 + i);
  const max = Math.max(...REPORT.heat.flat());
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[520px] gap-1" style={{ gridTemplateColumns: "44px repeat(10, minmax(0, 1fr))" }}>
        <span />
        {hours.map((h) => (
          <span key={h} className="text-center text-[11px] text-muted">{h % 12 === 0 ? 12 : h % 12}{h >= 12 ? "pm" : "am"}</span>
        ))}
        {REPORT.heat.map((row, d) => (
          <div key={d} className="contents">
            <span className="self-center text-[12px] font-semibold text-muted">{days[d]}</span>
            {row.map((v, i) => (
              <span
                key={i}
                title={`${days[d]} ${hours[i]}:00 · ${v} meeting hours`}
                className="aspect-[1.6] rounded-md transition hover:scale-110 hover:ring-2 hover:ring-brand"
                style={{ background: v === 0 ? "#f3f3f9" : `rgba(0, 135, 202, ${0.12 + (v / max) * 0.88})` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        Less
        {[0.12, 0.35, 0.55, 0.75, 1].map((o) => (
          <span key={o} className="h-3 w-5 rounded" style={{ background: `rgba(0, 135, 202, ${o})` }} />
        ))}
        More
      </div>
    </div>
  );
}
