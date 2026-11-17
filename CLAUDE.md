# CLAUDE.md: SVP Schedule Management demo (msm)

This file is for Claude, or any developer, picking up this project on a new machine. Read it fully before you change anything. Also read `AGENTS.md`: it is written by `next dev` and covers Next.js 16 changes.

## 1. What this project is

- A **front-end-only clickable prototype** of the new **Schedule** feature for SVP, the GlobalWings staff portal.
- It exists so the team can try the feature before it is built in the real SVP code. It is deployed to Vercel and shared as a link.
- There is **no backend**. All data is dummy data. Changes are saved in the viewer's browser (`localStorage`), so each person who opens the link has their own copy.
- The written spec is the Google Doc **"Meeting Management"** (ID `1Em2F7T6jfE0wo-skXb1R-ChrMuV_VTK8d1gGOkBmxFQ`). The demo has moved ahead of the doc in some places; see section 9.

## 2. Hard rules

1. **Never edit the real projects.** The real SVP project and `Apply-Globalwings` may be read for reference, such as the sidebar, icons and colours. Never write to them. All work happens in this `msm` folder only.
2. **Do not update the Google Doc spec unless the user asks** in that conversation.
3. **Do not commit, push or deploy unless the user asks.**
4. **Brand:**
   - Primary colour `#0087CA` (`brand` in `globals.css`).
   - **No gradients** anywhere.
   - Font: Hanken Grotesk.
5. **Sidebar:** it must match SVP's sidebar (same items, order and Remix icons, from `src/lib/nav.ts`). The only addition is **Schedule** with a NEW badge. Every other item opens a shared notice page (`/menu/<slug>`).
6. **Wording:**
   - Say **Task**, never "To-do", in the UI. Internal code names (`Todo`, `kind: "todo"`) stay as they are.
   - Say **Available**, not "free", for staff.
   - Use the spelling **Counsellor**.
7. **Writing style:** plain, clear English in UI text, code comments and docs. Use short sentences and no jargon.

## 3. Stack and commands

- **Next.js 16.4.6**, App Router, with `cacheComponents: true`. `export const dynamicParams` is **not allowed** with cacheComponents. Check `node_modules/next/dist/docs/` before you use any Next API you are unsure of.
- **React 19.3, TypeScript, Tailwind CSS 4.3.** Theme tokens are in `src/app/globals.css` under `@theme`. There is no tailwind.config.
- **Icons:** `lucide-react` in components; `remixicon` classes (`ri-*`) for the sidebar only.
- No state library: a React context store with localStorage.

```bash
npm install
npm run dev            # http://localhost:3000
npx tsc --noEmit       # typecheck
npm run lint           # eslint
npm run build          # production build, must pass before you say you are done
```

**Verification habit:** after every change, run tsc, lint and build. For visual checks, build, run `npx next start -p 3123` and take a headless Chrome screenshot of `http://localhost:3123/schedule`. Then stop the server with `lsof -ti tcp:3123 | xargs kill`. Never kill the user's dev server on port 3000.

**Deploy:**
- Preview: `vercel`.
- Production: `vercel --prod`.
- No environment variables are needed.
- Only deploy when the user asks.

## 4. Pages

| Route | What it shows |
| --- | --- |
| `/` | Redirects to `/schedule` |
| `/schedule` | Calendar with week, day and month views, the create drawer, details drawers and the right-hand Today panel |
| `/schedule/reports` | Reports (admin or "me" view), filters and CSV export |
| `/email` | Previews of the invite, "Updated time" and cancellation emails |
| `/respond?a=accept` | Public accept/reject page for external invitees (accept, reject, cancelled, expired) |
| `/menu/<slug>` | Notice page for every sidebar item except Schedule |
| `/dashboard` | Redirects to `/menu/dashboard` |

## 5. Project structure

```
src/
  app/                    routes only (thin pages that render components)
    layout.tsx            font, StoreProvider, Toasts; <body suppressHydrationWarning> (browser extensions add attributes)
    globals.css           Tailwind @theme tokens: brand, ok, warn, bad, info, page, ink, muted, line
  lib/
    types.ts              Staff, Meeting, Participant, Todo (task), TaskAssignee, AppNotification
    data.ts               STAFF, ME (=1, Tanvir), INITIAL_ITEMS, INITIAL_NOTIFICATIONS, REPORT data
    time.ts               real clock, date helpers, shiftDummy, grid constants
    logic.ts              rules: visibility, busy check, availability, task state, calendar export
    store.tsx             React context store and every action; localStorage persistence
    nav.ts                sidebar items (same as SVP)
  components/
    shell/                AppShell (sidebar, top bar, bell, profile switcher), ScheduleTabs, OtherMenuPage
    schedule/
      SchedulePage.tsx    page state, views, filters, quick add, accept/clash/reject dialogs
      TimeGrid.tsx        day/week grid, 12 AM to 12 AM, overlap layout, red "now" line
      MonthViews.tsx      month grid and mini calendar
      EventCard.tsx       meeting and task cards and chips on the calendar
      TodayPanel.tsx      next meeting, "Waiting for your answer", today's tasks, wrap-ups
      CreateDrawer.tsx    "New" form for a meeting or a task
      DetailsDrawer.tsx   meeting details (invitees, notes and follow-ups, attendance, activity, edit),
                          task details, EditTaskModal
      InviteePicker.tsx   staff picker (role filter + search) and external person fields
      TimeFields.tsx      date, start and end time, duration chips; timeError and pastError
    reports/ReportsPage.tsx
    email/EmailPreview.tsx
    respond/RespondPage.tsx
    ui/primitives.tsx     Avatar, Badge, Button, Modal, Drawer, Field, Card, inputCls
    ui/Toasts.tsx
```

## 6. How the important parts work

### Current user ("me") and the profile switcher
- `me` is a staff id held in the store. It defaults to `ME = 1` (Tanvir Ahmed, Senior Counsellor).
- The top-bar profile menu switches between all staff, so you can see each person's side.
- Logic helpers take `me` as a parameter. In components, use `const { me: meId } = useStore()`.

### Staff (dummy)
The list order is: Tanvir; then 3 **Agents** (Arif, Shirin, Kamal, ids 9–11); then 2 **Counsellors** (Rumana, Tareq, ids 12–13); then the other staff (ids 2–8). Ids are fixed because the data refers to them, so reorder the array but never renumber.

### Real clock
- `TODAY` is the real date in the browser. On the server it is `DATA_ANCHOR = "2026-11-19"`.
- Dummy data is written for the week of 19 Nov 2026. `shiftDummy()` moves every ISO date and "d Mon" label by the gap between the anchor and today, so the demo always looks current.
- `nowMinutes()` reads the real time.
- `SchedulePage` shows "Loading schedule..." until the store is `ready`, to avoid hydration mismatches.

### Persistence
- localStorage key: `msm-schedule-demo-v4` in `store.tsx`. It stores `{ me, items, notifications, simulated }`.
- **Bump the version number whenever the data shape changes**, so old saved data is ignored.
- The "Reset demo" button clears it.

### Notifications and toasts
- Each notification has `forId` (the staff member who sees it). A missing `forId` means Tanvir.
- Use `notifyStaff(staffId, text, tone)` for the bell and `toast(title, body, tone)` for pop-ups.
- About 9 seconds after the first load, a simulated "Rahim Uddin accepted" event plays once per browser.

### Time rules
- Any time from 00:00 to 23:59 is allowed, with no working hours. The grid shows 12 AM to 12 AM and opens scrolled to 8 AM, or one hour before now.
- End must be after start, on the same day (`timeError`).
- The "already passed" check (`pastError`) runs **only when you save** a meeting (or when you change the time in an edit). Dates are never disabled. Tasks may be in the past.

### Busy rule (`busyBlock` in logic.ts)
A staff member is busy in a time range if any of these overlaps it:
- a meeting they organize;
- a meeting they accepted or have not answered yet (pending);
- a timed task that is theirs to do and not done: their own unassigned task, or an assigned task they **accepted**.

### Meetings
- **Create:** set the time first. The invitee picker then shows available staff first and busy staff greyed out with their busy time. Busy staff cannot be invited.
- **External people:** name, email and an optional WhatsApp number.
- **Response:** invitees accept or reject; the reason is optional for meetings. Accepting checks for a clash first.
- **Edit:** the organizer can change the details and add invitees, who get the invite. A time change resets all answers to Pending.
- **Cancel:** notifies all invitees.
- **After the meeting:** notes, follow-ups and attendance.

### Tasks (data type `Todo`)
- **Creator:** `ownerId` is the person who created the task.
- **Assignees:**
  - `assignees?: TaskAssignee[]`, each `{ staffId, status: pending|accepted|rejected, reason?, respondedAt?, done? }`.
  - No assignees means the task is only for the creator.
  - One or more staff can be assigned, picked with the role filter (All / Agent / Counsellor) and name search. Busy staff can still be picked, with an amber warning.
- **The "Set a time" checkbox** is off by default in the create form.
- **Assignee side:**
  - Each assignee gets a notification. The task shows in "Waiting for your answer" and is **not** on their calendar until they accept.
  - **Reject needs a reason** (required).
  - Each assignee marks their own part done.
- **Creator side:**
  - The creator is notified on accept, reject (with the reason) and done.
  - The creator cannot tick an assigned task. It counts as done for them when every assignee who accepted is done (`taskDone`, `todoState(t, me)`).
- **Edit (creator only, `EditTaskModal`):**
  - The creator can change the title, date and time, priority and notes, add staff, and remove staff with ✕.
  - Added staff get the task to accept or reject. Removed staff are told. Staff who keep it are told about the change, and their status stays the same.
- **Follow-ups from meeting notes** are tasks with `parentId` set to the meeting. A follow-up for someone else is an assigned task, so it goes through the same accept/reject flow.

## 7. Conventions

- Put rules in `lib/logic.ts`, state changes in `lib/store.tsx`, and screens in `components/`. Keep `app/` pages thin.
- Reuse the primitives (`Button`, `Modal`, `Drawer`, `Field`, `Badge`, `inputCls`) and the Tailwind theme colours. Do not hard-code new colours when a token exists.
- Write a short comment when the reason for some code is not obvious.
- When you add a new field to stored data, update `types.ts` and the dummy data, and bump the storage key.
- Keep the dummy data realistic for a study-abroad agency: students, visas, agents and universities.

## 8. Change history (what has been built)

1. Base prototype: SVP-style shell and sidebar, calendar (week, day and month), meetings with invites, tasks, details drawers, reports, email previews and the public respond page.
2. Busy staff greyed out with their busy time; "Available" wording; count badges removed; "Related record" field removed.
3. Edit meeting: add invitees, who get the invite.
4. localStorage persistence and the Reset demo button.
5. Profile switcher, with per-user notifications and views.
6. No working-hour limit (00:00–23:59); past-time check only on save; real clock with shifted dummy data.
7. Follow-ups: "Assigned by" line, and the assigner can open the follow-up read-only and is notified when it is done.
8. Calendar shows 12 AM to 12 AM; empty white space under the calendar fixed.
9. Added 3 Agents and 2 Counsellors, listed right after Tanvir.
10. Invitee picker: "Internal staffs" (All/Agent/Counsellor filter and name search) and "External person" (name, email, WhatsApp).
11. Renamed "To-do" to "Task" everywhere in the UI.
12. Task assignment to many staff, with accept or reject (reason required) and notifications to the creator; follow-ups use the same flow.
13. "Set a time" unchecked by default for new tasks.
14. Edit task: change the details, add staff and remove staff.

## 9. Known gaps and open ideas (ask the user before you do these)

- `README.md` is out of date: it still says the clock is fixed and nothing is saved. Update it if the user wants.
- The Google Doc spec still says "To-do", still has the "Related record" field, has a weekday error, and does not describe task assignment or editing.
- Should only **accepted** meetings block time, rather than pending ones too? The user hinted at this; it was not decided.
- The email preview and respond pages still use fixed dates instead of the real clock.
- Meeting edit cannot remove existing invitees yet (task edit can).
- When two items overlap on a narrow day column, a pending invite card gets squeezed.
- The cancel dialog still says "free again"; it may need to say "available".
