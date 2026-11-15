# SVP Schedule Management – clickable prototype

A front-end-only prototype of the Schedule Management feature for the SVP staff portal. All data is dummy data held in memory. Nothing is saved, and a page reload resets the demo.

The demo clock is fixed at **Thursday 19 November 2026, 10:35 AM**, so everyone sees the same calendar.

## Pages

| Path | What it shows |
| --- | --- |
| `/schedule` | Schedule calendar (`/` redirects here): week, day and month views, create drawer, meeting and to-do details, Today panel |
| `/menu/<item>` | Notice page for every sidebar item except Schedule (Dashboard, Leads, ...) with a link to the main GlobalWings site |
| `/schedule/reports` | Schedule reports with filters and CSV export |
| `/email` | Invite email, "Updated time" email and cancellation email |
| `/respond?a=accept` | Public response page for invitees (accept, reject, cancelled, expired) |

## Things to try in a demo

- Click an empty slot on the calendar for quick add, or use **New** for the full form.
- In the meeting form, set the time first. The staff dropdown lists only staff who are free at that time.
- Open **Marketing plan review** (Thu 4 PM) and accept it to see the clash warning.
- Open **University partnership call** (Wed 2 PM) to add notes, follow-ups and attendance.
- Wait about 9 seconds on the calendar: a live "Rahim Uddin accepted" toast arrives.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Push this folder to a Git repository and import it in Vercel, or run `npx vercel` in this folder. No environment variables are needed.
