# Cyclotron Physics — NEET Physics Online Assessment Portal

A proctored online examination platform custom-built for **Cyclotron Physics** to conduct **NEET-UG Physics mock tests** for **Intermediate students (Class 11 & 12)**. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL)**, ready for deployment on **Vercel**.

---

## Architecture & Features

### 1. Student Registration & Single Attempt Enforcement
- Fields: **Student Name**, **Mobile Number**, and **Email Address**.
- Simplified, mobile-friendly interface designed for intermediate students.
- **Strict 1-Attempt Policy**: Candidates can take the test only once with their registered mobile number and email. Duplicate attempts are blocked and redirect directly to the submission receipt. Unfinished in-progress tests resume smoothly.

### 2. NEET Multiple Choice Question (MCQ) Interface
- Authentic NEET Physics questions covering mechanics, electromagnetism, cyclotron principles, optics, modern physics, and thermodynamics.
- **Interactive MCQ Cards**: 4 clear options (A, B, C, D) per question with instant visual selection and active highlighting.
- **Clear Response**: Allows students to unselect an option if they choose to leave a question unattempted.
- **Question Navigator (Palette)**: Shows live attempted vs. unattempted question tallies with jump-to-question navigation.

### 3. Server-Authoritative Timer
- Time is **never calculated on the browser clock**.
- When the student clicks "Start", the server records `started_at` and computes `expires_at = started_at + duration_minutes`.
- Page refreshes recalculate remaining seconds from the server clock: `Math.max(0, expires_at - now())`.
- When the countdown reaches `00:00`, the test auto-submits. Server endpoints enforce a 30-second network latency grace period.

### 4. Continuous Autosave & Offline Safety
- Answers are automatically saved on option selection, on question navigation, and every **20 seconds**.
- Top bar displays live sync status: **"Saved"** (green checkmark), **"Saving..."**, or **"Local Backup"**.
- Maintains a mirror backup in browser `localStorage` (`exam_backup_<submission_id>`) in case of internet interruptions.

### 5. Tab-Switch Proctoring & Anti-Cheating
- Monitors `visibilitychange` (minimizing or switching tabs) and `window.blur`.
- On return, displays a full-screen alert:
  > *"Warning X of 3. Tab switching is recorded."*
- **Auto-Submission on 3rd violation**: Exceeding 3 switch violations automatically terminates and submits the test with status `auto_submitted_tabs`.
- All violations are logged with timestamps in `tab_events`.
- Right-click (`contextmenu`), text copy (`Ctrl+C`), cut (`Ctrl+X`), and paste (`Ctrl+V`) are disabled.

### 6. Faculty Evaluation & Admin Dashboard (`/admin`)
- Protected via `ADMIN_PASSWORD` (default in `.env.local`: `admin123`).
- KPI stat cards: Total Candidates, Tests Finalized, and Proctoring Violations.
- Searchable candidate table: Name, Mobile, Email, Attempted MCQs, Score, Warnings, and Submission Time.
- **MCQ Response Evaluator**: Click any student to view their question paper, chosen options vs. correct answer keys, and automatic score calculation (+1 per correct answer, Total: 45 Marks).
- **Export to CSV**: Downloads a formatted grading spreadsheet with candidate details, scores out of 45, and individual MCQ answers.

---

## Project Structure

```
├── app/
│   ├── layout.tsx                     # Global layout & Cyclotron Physics branding
│   ├── page.tsx                       # Student registration (Name, Mobile, Email)
│   ├── instructions/page.tsx          # NEET test instructions & Start button
│   ├── exam/page.tsx                  # Interactive MCQ test interface with palette
│   ├── thank-you/page.tsx             # Submission receipt & score summary
│   ├── admin/page.tsx                 # Faculty dashboard, evaluation & CSV export
│   └── api/
│       ├── exam/
│       │   ├── register/route.ts      # Validates candidate, starts/resumes test
│       │   ├── session/route.ts       # Server timer sync, MCQs & saved answers
│       │   ├── save-answer/route.ts   # Server-authoritative MCQ option autosave
│       │   ├── log-tab-event/route.ts # Logs tab switch & enforces 3-strike rule
│       │   └── submit/route.ts        # Finalizes test submission
│       └── admin/
│           ├── auth/route.ts          # Faculty password verification & cookie
│           ├── submissions/route.ts   # Submissions summary list & scores
│           ├── submissions/[id]/route.ts # Detailed student answer sheet
│           └── export-csv/route.ts    # Generates downloadable CSV
├── lib/
│   ├── types.ts                       # TypeScript interfaces
│   ├── exam-service.ts                # Server timer validation & exam operations
│   ├── admin-service.ts               # Scoring, evaluation & CSV export
│   ├── mock-db.ts                     # Local fallback database for instant testing
│   └── supabase/
│       ├── server.ts                  # Supabase service role client
│       └── client.ts                  # Public Supabase client
├── scripts/
│   └── seed.mjs                       # Database seed script for NEET MCQs
├── questions.json                     # NEET Physics MCQs (order, text, options, correct_option, marks)
├── schema.sql                         # Complete PostgreSQL database DDL
├── .env.example                       # Example environment variables
└── README.md
```

---

## Database Setup (Supabase)

1. Open your project on [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Open [`schema.sql`](file:///c:/Users/ksrre/Desktop/Hacathon/Assist/schema.sql), copy its contents, paste them into the SQL Editor, and click **Run**.

This creates:
- `exams` (Test title, description, duration in minutes)
- `questions` (Exam ID, order, text, options JSONB array, correct_option, marks)
- `students` (Name, mobile phone, email)
- `submissions` (Exam ID, student ID, status, started_at, expires_at, tab_switch_count, score)
- `answers` (Submission ID, question ID, selected option e.g. "A", "B", "C", "D")
- `tab_events` (Proctoring logs with timestamps)
- Row Level Security (RLS) enabled on all tables.

---

## Environment Variables

Configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hjhzbsgnasuaeeaxnvhp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bd6L1X0MZnN2aOcAyieSOQ_aPjPW3NK
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bd6L1X0MZnN2aOcAyieSOQ_aPjPW3NK
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_bd6L1X0MZnN2aOcAyieSOQ_aPjPW3NK

ADMIN_PASSWORD=admin123

EXAM_TITLE="Cyclotron Physics — NEET Physics Mock Test Series"
EXAM_DURATION_MINUTES=45
```

---

## Customizing & Seeding Questions

You can edit or add new NEET Physics MCQs in [`questions.json`](file:///c:/Users/ksrre/Desktop/Hacathon/Assist/questions.json):

```json
[
  {
    "order": 1,
    "text": "In a cyclotron, a charged particle of mass m and charge q accelerates inside dees under a perpendicular uniform magnetic field B...",
    "options": [
      "A) Magnetic flux density (B)",
      "B) Charge of the particle (q)",
      "C) Speed and orbital radius (v and r)",
      "D) Mass of the particle (m)"
    ],
    "correct_option": "C",
    "marks": 1
  }
]
```

To seed questions into Supabase, run:
```bash
npm run seed
```

---

## Local Development

```bash
npm install
npm run dev
```

- **Student Portal**: [http://localhost:3000](http://localhost:3000)
- **Faculty Evaluation Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin) *(Passcode: `admin123`)*

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), select **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `EXAM_TITLE`
   - `EXAM_DURATION_MINUTES`
4. Click **Deploy**.
