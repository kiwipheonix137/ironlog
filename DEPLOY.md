# IRONLOG — Deployment Guide
## Complete step-by-step to get your app live for free

---

## STEP 1 — Set up Supabase (your database + login system)

1. Go to https://supabase.com and click "Start your project"
2. Sign up with GitHub or email
3. Click "New project"
4. Name it: ironlog
5. Set a database password (save this somewhere safe)
6. Choose region: closest to you (e.g. Australia Southeast)
7. Click "Create new project" — wait ~2 minutes

8. Once ready, go to the SQL Editor (left sidebar, looks like a terminal icon)
9. Click "New query"
10. Open the file supabase_schema.sql from this folder
11. Copy ALL the SQL and paste it into the editor
12. Click "Run" — you should see "Success" messages

13. Now go to Project Settings → API (left sidebar)
14. Copy your "Project URL" — looks like: https://xxxxx.supabase.co
15. Copy your "anon public" key — a long string starting with eyJ...

---

## STEP 2 — Set up the app code

1. Make sure you have Node.js installed — download from https://nodejs.org (LTS version)
2. Download or copy this entire gymtracker folder to your computer
3. Open Terminal (Mac) or Command Prompt (Windows) in that folder
4. Run: npm install
5. Create a file called .env in the folder (copy from .env.example)
6. Fill in your two Supabase values:
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your key...

7. Run: npm run dev
8. Open http://localhost:5173 in your browser
9. You should see the IRONLOG login page!

---

## STEP 3 — Deploy to Vercel (make it live online, free)

1. Go to https://github.com and create a free account if you don't have one
2. Create a new repository called "ironlog"
3. Upload all the files from your gymtracker folder to that repository

4. Go to https://vercel.com and sign up with your GitHub account
5. Click "Add New Project"
6. Import your ironlog repository
7. Before clicking Deploy, click "Environment Variables"
8. Add both variables:
   - VITE_SUPABASE_URL = your supabase project url
   - VITE_SUPABASE_ANON_KEY = your supabase anon key
9. Click "Deploy"
10. Wait ~1 minute — Vercel gives you a URL like: https://ironlog-abc123.vercel.app

That's your live app! Share that URL with whoever you want to use it.

---

## STEP 4 — Add users

Users sign up themselves on your app — just share the URL.
To invite specific people, they go to your URL and click Sign Up.

---

## Features in the app

- Login / signup system (each user sees only their own data)
- Home screen: today's workout summary + quick log button
- Log page: log sets with exercise, set type, weight, reps. Add custom exercises. Session notes.
- History: pick any date and see the full session replay
- PRs: personal records per exercise, filterable by muscle group
- Progress: line charts for max weight, max volume, total volume per session. Muscle group bar chart.
- Bodyweight: log daily weight, date range filter, line chart with auto min/max axis

---

## Customising exercises and muscle groups

Open src/pages/LogPage.jsx and edit the MUSCLE_GROUPS object at the top
to add your own exercises and assign them to muscle groups.

---

## Troubleshooting

- "Invalid API key" error: double check your .env values match exactly from Supabase
- Blank screen: open browser console (F12) and check for errors
- Data not saving: check Supabase → Table Editor to see if rows are appearing

For help: the Supabase docs are at https://supabase.com/docs
