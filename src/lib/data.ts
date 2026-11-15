import { shiftDummy } from "./time";
import type { AppNotification, ScheduleItem, Staff } from "./types";

// All names, emails and numbers below are dummy data for the prototype.

export const ME = 1;

export const STAFF: Staff[] = [
  { id: 1, name: "Tanvir Ahmed", role: "Senior Counsellor", color: "#0087ca" },
  { id: 2, name: "Rahim Uddin", role: "Visa Officer", color: "#0ab39c" },
  { id: 3, name: "Nusrat Jahan", role: "Admissions Officer", color: "#f06548" },
  { id: 4, name: "Farhan Kabir", role: "Partnerships Lead", color: "#3577f1" },
  { id: 5, name: "Sadia Islam", role: "Marketing Executive", color: "#e8a93a" },
  { id: 6, name: "Imran Hossain", role: "Documentation Officer", color: "#299cdb" },
  { id: 7, name: "Mitu Akter", role: "Front Desk", color: "#6559cc" },
  { id: 8, name: "Jamal Hossain", role: "Accounts", color: "#3d9970" },
];

export const staffById = (id: number) => STAFF.find((s) => s.id === id)!;


// Dates are written for the week of 19 Nov 2026 and moved to the real current week by shiftDummy.
export const INITIAL_ITEMS: ScheduleItem[] = shiftDummy<ScheduleItem[]>([
  // ---------- Sunday 15 ----------
  {
    id: "t10", kind: "todo", title: "Collect passport scans", date: "2026-11-15",
    start: "10:00", end: "11:00", priority: "normal", done: true, ownerId: ME,
  },
  {
    id: "m8", kind: "meeting", title: "Document check with Rahim", date: "2026-11-15",
    start: "13:00", end: "13:30", mode: "in-person", location: "Meeting room 2, Gulshan office",
    agenda: "Check documents for the January intake files.", organizerId: ME,
    participants: [
      { id: "p81", staffId: 2, name: "Rahim Uddin", email: "rahim@globalwings.example", external: false, status: "accepted", respondedAt: "14 Nov, 6:02 PM", attendance: "attended" },
    ],
    notes: "12 files checked. 3 files are missing a bank solvency letter.",
    activity: [
      { at: "14 Nov, 5:40 PM", text: "Meeting created and invite sent to Rahim Uddin" },
      { at: "14 Nov, 6:02 PM", text: "Rahim Uddin accepted" },
      { at: "15 Nov, 1:41 PM", text: "Notes added, attendance marked" },
    ],
  },
  // ---------- Monday 16 ----------
  {
    id: "t1", kind: "todo", title: "Prepare offer letters", date: "2026-11-16",
    start: "09:00", end: "10:00", priority: "normal", done: true, ownerId: ME,
  },
  {
    id: "m1", kind: "meeting", title: "Agent onboarding call", date: "2026-11-16",
    start: "11:00", end: "12:00", mode: "phone", phone: "+880 1711-000000",
    agenda: "Commission structure, document checklist and portal access for the new agent.",
    organizerId: ME,
    participants: [
      { id: "p11", name: "Shafiq Rahman", email: "shafiq@brightpath.example", external: true, status: "accepted", respondedAt: "13 Nov, 11:20 AM", attendance: "attended" },
      { id: "p12", staffId: 4, name: "Farhan Kabir", email: "farhan@globalwings.example", external: false, status: "accepted", respondedAt: "13 Nov, 10:05 AM", attendance: "attended" },
    ],
    notes:
      "BrightPath agreed to the standard commission. They need portal access for 3 counsellors.\nSend the agent agreement and the fee invoice this week.",
    activity: [
      { at: "13 Nov, 9:48 AM", text: "Meeting created and invites sent to 2 people" },
      { at: "13 Nov, 10:05 AM", text: "Farhan Kabir accepted" },
      { at: "13 Nov, 11:20 AM", text: "Shafiq Rahman accepted from email" },
      { at: "16 Nov, 12:20 PM", text: "Notes added and 2 follow-ups created" },
      { at: "16 Nov, 12:21 PM", text: "Attendance marked: 2 attended" },
    ],
  },
  // ---------- Tuesday 17 ----------
  {
    id: "m2", kind: "meeting", title: "Weekly team sync", date: "2026-11-17",
    start: "10:00", end: "10:30", mode: "in-person", location: "Meeting room 2, Gulshan office",
    agenda: "Pipeline review and visa updates.", organizerId: ME,
    participants: [
      { id: "p21", staffId: 2, name: "Rahim Uddin", email: "rahim@globalwings.example", external: false, status: "accepted", respondedAt: "15 Nov, 9:10 AM", attendance: "attended" },
      { id: "p22", staffId: 3, name: "Nusrat Jahan", email: "nusrat@globalwings.example", external: false, status: "accepted", respondedAt: "15 Nov, 9:31 AM", attendance: "attended" },
      { id: "p23", staffId: 6, name: "Imran Hossain", email: "imran@globalwings.example", external: false, status: "accepted", respondedAt: "15 Nov, 11:02 AM", attendance: "attended" },
      { id: "p24", staffId: 7, name: "Mitu Akter", email: "mitu@globalwings.example", external: false, status: "accepted", respondedAt: "16 Nov, 8:45 AM", attendance: "no-show" },
    ],
    notes: "18 visa files in progress. 2 refusals to appeal. Next intake push starts on 1 December.",
    activity: [
      { at: "15 Nov, 9:00 AM", text: "Meeting created and invites sent to 4 people" },
      { at: "17 Nov, 10:40 AM", text: "Notes added, attendance marked: 3 attended, 1 no-show" },
    ],
  },
  {
    id: "t2", kind: "todo", title: "Review Ayesha's bank statement", date: "2026-11-17",
    start: "15:00", end: "16:00", priority: "high", done: true, ownerId: ME,
  },
  {
    id: "fu1", kind: "todo", title: "Send agent agreement to BrightPath", date: "2026-11-17",
    priority: "normal", done: true, ownerId: ME, parentId: "m1",
  },
  // ---------- Wednesday 18 ----------
  {
    id: "t3", kind: "todo", title: "Update CRM leads", date: "2026-11-18",
    start: "10:00", end: "11:00", priority: "normal", done: false, ownerId: ME,
  },
  {
    id: "t9", kind: "todo", title: "Check SOP drafts", date: "2026-11-18",
    priority: "low", done: true, ownerId: ME,
  },
  {
    id: "m3", kind: "meeting", title: "University partnership call", date: "2026-11-18",
    start: "14:00", end: "15:00", mode: "online", link: "https://meet.google.com/uni-part-ner",
    agenda: "September 2027 intake quotas and scholarship options.",
    organizerId: ME,
    participants: [
      { id: "p31", name: "Emma Clarke", email: "emma.clarke@university.example", external: true, status: "accepted", respondedAt: "16 Nov, 3:15 PM" },
      { id: "p32", staffId: 4, name: "Farhan Kabir", email: "farhan@globalwings.example", external: false, status: "accepted", respondedAt: "16 Nov, 1:02 PM" },
      { id: "p33", staffId: 5, name: "Sadia Islam", email: "sadia@globalwings.example", external: false, status: "rejected", respondedAt: "16 Nov, 1:40 PM", reason: "On leave on Wednesday." },
    ],
    activity: [
      { at: "16 Nov, 12:30 PM", text: "Meeting created and invites sent to 3 people" },
      { at: "16 Nov, 1:02 PM", text: "Farhan Kabir accepted" },
      { at: "16 Nov, 1:40 PM", text: "Sadia Islam rejected: On leave on Wednesday." },
      { at: "16 Nov, 3:15 PM", text: "Emma Clarke accepted from email" },
    ],
  },
  // ---------- Thursday 19 (today) ----------
  {
    id: "t4", kind: "todo", title: "Reply to agent emails", date: "2026-11-19",
    start: "09:00", end: "10:00", priority: "normal", done: true, ownerId: ME,
  },
  {
    id: "m4", kind: "meeting", title: "Student counselling: Karim Hasan", date: "2026-11-19",
    start: "11:00", end: "11:45", mode: "online", link: "https://meet.google.com/kar-imha-san",
    agenda: "UK vs Canada options, budget and IELTS plan.",
    organizerId: ME,
    participants: [
      { id: "p41", name: "Karim Hasan", email: "karim.hasan@gmail.example", external: true, status: "accepted", respondedAt: "18 Nov, 8:14 PM" },
      { id: "p42", staffId: 3, name: "Nusrat Jahan", email: "nusrat@globalwings.example", external: false, status: "accepted", respondedAt: "18 Nov, 5:02 PM" },
    ],
    activity: [
      { at: "18 Nov, 4:50 PM", text: "Meeting created and invites sent to 2 people" },
      { at: "18 Nov, 5:02 PM", text: "Nusrat Jahan accepted" },
      { at: "18 Nov, 8:14 PM", text: "Karim Hasan accepted from email" },
    ],
  },
  {
    id: "t5", kind: "todo", title: "Visa file: Karim Hasan", date: "2026-11-19",
    start: "13:00", end: "14:00", priority: "high", done: false, ownerId: ME,
  },
  {
    id: "m5", kind: "meeting", title: "Marketing plan review", date: "2026-11-19",
    start: "16:00", end: "17:00", mode: "in-person", location: "Meeting room 1, Gulshan office",
    agenda: "December campaign plan and the student fair budget.", organizerId: 5,
    participants: [
      { id: "p51", staffId: 1, name: "Tanvir Ahmed", email: "tanvir@globalwings.example", external: false, status: "pending" },
      { id: "p52", staffId: 4, name: "Farhan Kabir", email: "farhan@globalwings.example", external: false, status: "accepted", respondedAt: "19 Nov, 9:20 AM" },
    ],
    activity: [{ at: "19 Nov, 9:02 AM", text: "Sadia Islam created the meeting and sent invites" }],
  },
  {
    id: "t6", kind: "todo", title: "Prepare weekly report", date: "2026-11-19",
    start: "16:30", end: "17:30", priority: "normal", done: false, ownerId: ME,
  },
  {
    id: "t7", kind: "todo", title: "Call back Sabbir about IELTS date", date: "2026-11-19",
    priority: "normal", done: false, ownerId: ME,
  },
  {
    id: "fu2", kind: "todo", title: "Send fee invoice to BrightPath", date: "2026-11-19",
    priority: "high", done: false, ownerId: ME, parentId: "m1",
  },
  // ---------- Friday 20 ----------
  {
    id: "m7", kind: "meeting", title: "Branch visit planning", date: "2026-11-20",
    start: "10:00", end: "11:00", mode: "in-person", location: "Uttara branch",
    agenda: "Plan staff visits to the Uttara and Sylhet branches.", organizerId: 4,
    participants: [
      { id: "p71", staffId: 1, name: "Tanvir Ahmed", email: "tanvir@globalwings.example", external: false, status: "accepted", respondedAt: "17 Nov, 2:11 PM" },
      { id: "p72", staffId: 6, name: "Imran Hossain", email: "imran@globalwings.example", external: false, status: "accepted", respondedAt: "17 Nov, 3:30 PM" },
    ],
    activity: [{ at: "17 Nov, 2:00 PM", text: "Farhan Kabir created the meeting and sent invites" }],
  },
  {
    id: "t8", kind: "todo", title: "Draft partnership summary", date: "2026-11-20",
    start: "12:00", end: "13:00", priority: "normal", done: false, ownerId: ME,
  },
  {
    id: "m6", kind: "meeting", title: "Visa file review", date: "2026-11-20",
    start: "15:00", end: "15:45", mode: "online", link: "https://meet.google.com/abc-defg-hij",
    agenda: "Review of passport scan and bank statement.",
    organizerId: ME,
    participants: [
      { id: "p61", name: "Ayesha Rahman", email: "ayesha.rahman@gmail.example", external: true, status: "accepted", respondedAt: "18 Nov, 9:12 PM" },
      { id: "p62", staffId: 2, name: "Rahim Uddin", email: "rahim@globalwings.example", external: false, status: "pending" },
      { id: "p63", staffId: 3, name: "Nusrat Jahan", email: "nusrat@globalwings.example", external: false, status: "accepted", respondedAt: "18 Nov, 4:40 PM" },
      { id: "p64", name: "Rashed Karim", email: "rashed.karim@mail.example", external: true, status: "pending", emailFailed: true },
    ],
    activity: [
      { at: "18 Nov, 4:30 PM", text: "Meeting created and invites sent to 4 people" },
      { at: "18 Nov, 4:31 PM", text: "Email to rashed.karim@mail.example was not delivered" },
      { at: "18 Nov, 4:40 PM", text: "Nusrat Jahan accepted" },
      { at: "18 Nov, 9:12 PM", text: "Ayesha Rahman accepted from email" },
    ],
  },
  // ---------- Saturday 21 ----------
  {
    id: "m9", kind: "meeting", title: "IELTS workshop prep", date: "2026-11-21",
    start: "10:00", end: "11:00", mode: "in-person", location: "Training room", organizerId: ME,
    cancelled: true,
    participants: [
      { id: "p91", staffId: 7, name: "Mitu Akter", email: "mitu@globalwings.example", external: false, status: "accepted", respondedAt: "16 Nov, 10:00 AM" },
    ],
    activity: [
      { at: "16 Nov, 9:40 AM", text: "Meeting created and invite sent" },
      { at: "18 Nov, 6:00 PM", text: "Meeting cancelled. Cancellation email sent to 1 person" },
    ],
  },
  {
    id: "m10", kind: "meeting", title: "Parent meeting: Ayesha Rahman", date: "2026-11-21",
    start: "12:30", end: "13:15", mode: "in-person", location: "Gulshan office, reception",
    agenda: "Tuition fee plan and sponsor documents.", organizerId: ME,
    participants: [
      { id: "p101", name: "Abdur Rahman", email: "abdur.rahman@mail.example", external: true, status: "pending" },
      { id: "p102", name: "Ayesha Rahman", email: "ayesha.rahman@gmail.example", external: true, status: "pending" },
    ],
    activity: [{ at: "19 Nov, 9:55 AM", text: "Meeting created and invites sent to 2 people" }],
  },
  {
    id: "t11", kind: "todo", title: "Plan next week", date: "2026-11-21",
    priority: "low", done: false, ownerId: ME,
  },
  // ---------- Other staff members' own work (seen when you switch to their account) ----------
  { id: "o1", kind: "todo", title: "Agent call", date: "2026-11-19", start: "14:00", end: "15:30", priority: "normal", done: false, ownerId: 2 },
  { id: "o2", kind: "todo", title: "Offer letter review", date: "2026-11-19", start: "13:30", end: "14:30", priority: "high", done: false, ownerId: 3 },
  { id: "o3", kind: "todo", title: "Embassy appointment", date: "2026-11-20", start: "15:00", end: "16:00", priority: "high", done: false, ownerId: 6 },
  { id: "o4", kind: "todo", title: "Month-end closing", date: "2026-11-19", start: "10:00", end: "12:00", priority: "normal", done: false, ownerId: 8 },
  { id: "o5", kind: "todo", title: "Walk-in desk", date: "2026-11-20", start: "09:00", end: "13:00", priority: "normal", done: false, ownerId: 7 },
  { id: "o6", kind: "todo", title: "Post the December campaign on Facebook", date: "2026-11-19", priority: "normal", done: false, ownerId: 5 },
  { id: "o7", kind: "todo", title: "Student fair budget sheet", date: "2026-11-19", start: "11:00", end: "12:00", priority: "high", done: false, ownerId: 5 },
]);

export const INITIAL_NOTIFICATIONS: AppNotification[] = shiftDummy<AppNotification[]>([
  { id: "n1", text: "Sadia Islam invited you to Marketing plan review, today 4:00 PM", time: "1 hour ago", tone: "info", unread: true },
  { id: "n2", text: "Ayesha Rahman accepted Visa file review, 20 Nov, 3:00 PM", time: "13 hours ago", tone: "ok", unread: true },
  { id: "n3", text: "Email to rashed.karim@mail.example was not delivered", time: "18 hours ago", tone: "bad", unread: false },
  { id: "n4", text: "Sadia Islam rejected University partnership call: On leave on Wednesday.", time: "3 days ago", tone: "bad", unread: false },
]);

// ---------------- Reports (dummy aggregates) ----------------

export const REPORT = {
  kpis: [
    { label: "Meetings", value: "46", delta: "+12% vs last month", up: true },
    { label: "Acceptance rate", value: "87%", delta: "+4 pts", up: true },
    { label: "Avg response time", value: "3h 20m", delta: "−45 min", up: true },
    { label: "To-dos on time", value: "78%", delta: "−3 pts", up: false },
    { label: "No-show rate", value: "6.5%", delta: "−1.2 pts", up: true },
  ],
  perStaff: [
    { staffId: 1, organized: 14, attended: 9 },
    { staffId: 2, organized: 9, attended: 12 },
    { staffId: 3, organized: 11, attended: 10 },
    { staffId: 4, organized: 8, attended: 6 },
    { staffId: 5, organized: 6, attended: 7 },
    { staffId: 6, organized: 5, attended: 8 },
    { staffId: 7, organized: 3, attended: 4 },
    { staffId: 8, organized: 2, attended: 3 },
  ],
  acceptance: { accepted: 132, rejected: 14, expired: 6 },
  rejectReasons: [
    { reason: "Clash with another meeting", count: 6 },
    { reason: "On leave", count: 4 },
    { reason: "Time not suitable for student", count: 3 },
    { reason: "Other", count: 1 },
  ],
  responseTime: {
    internal: 65, // minutes
    external: 400,
    buckets: [
      { label: "< 1 h", internal: 58, external: 21 },
      { label: "1–4 h", internal: 27, external: 30 },
      { label: "4–24 h", internal: 12, external: 34 },
      { label: "> 24 h", internal: 3, external: 15 },
    ],
  },
  todosOnTime: [
    { staffId: 1, pct: 82, followUps: 90 },
    { staffId: 2, pct: 91, followUps: 88 },
    { staffId: 3, pct: 76, followUps: 80 },
    { staffId: 4, pct: 64, followUps: 70 },
    { staffId: 5, pct: 72, followUps: 75 },
    { staffId: 6, pct: 88, followUps: 92 },
    { staffId: 7, pct: 69, followUps: 60 },
    { staffId: 8, pct: 80, followUps: 85 },
  ],
  // meeting hours by weekday (Sun..Sat) x hour (9..18)
  heat: [
    [2, 4, 6, 5, 2, 3, 5, 4, 2, 1],
    [3, 6, 8, 7, 3, 5, 6, 5, 3, 1],
    [4, 7, 9, 6, 2, 6, 8, 6, 3, 2],
    [3, 5, 7, 6, 3, 7, 9, 7, 4, 1],
    [2, 4, 6, 5, 2, 4, 6, 5, 3, 1],
    [0, 1, 1, 0, 0, 0, 1, 0, 0, 0],
    [1, 3, 4, 3, 1, 2, 3, 2, 1, 0],
  ],
  trend: [28, 31, 26, 35, 33, 39, 41, 46],
  trendLabels: ["Oct 1", "Oct 8", "Oct 15", "Oct 22", "Oct 29", "Nov 5", "Nov 12", "Nov 19"],
  noShows: [
    { name: "Karim Hasan", kind: "Student", meetings: 6, noShows: 2 },
    { name: "BrightPath Consultancy", kind: "Agent", meetings: 9, noShows: 1 },
    { name: "Ayesha Rahman", kind: "Student", meetings: 5, noShows: 0 },
    { name: "Sabbir Ahmed", kind: "Student", meetings: 4, noShows: 1 },
    { name: "Northstar Education", kind: "Agent", meetings: 7, noShows: 0 },
    { name: "Mitu Akter", kind: "Staff", meetings: 8, noShows: 1 },
  ],
};
