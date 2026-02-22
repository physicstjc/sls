# Live Quiz Setup Guide

## Overview
This is a realtime live quiz platform using Supabase + vanilla JS.
- **Host** (`host.html`): Manages quiz, shows live response aggregation.
- **Student** (`student.html`): Joins with code, answers questions.
- **Shared**: Supabase DB + Realtime subscriptions.

## Prerequisites
1. **Supabase account** (free at supabase.com)
2. **GitHub repo** pushed to your account
3. **Vercel account** (free at vercel.com)

---

## Step 1: Supabase Setup

### 1a. Create Database
1. Go to [supabase.com](https://supabase.com) → Sign in → Create Project
2. Name it `live-quiz`, region = closest to you, password = strong
3. Wait for provisioning (~1 min)

### 1b. Run SQL Schema
1. In Supabase dashboard → SQL Editor → New Query
2. Copy-paste contents of `supabase-schema.sql`
3. Click "Run"
4. Verify tables appear in Database → Tables

### 1c. Get Your Keys
1. In Supabase: Dashboard → Left sidebar **Settings** → **API** tab
2. Under "Project API keys" section:
   - Find "Project URL" field (looks like `https://xxxxx.supabase.co`)
   - **Copy** it → save somewhere safe as `SUPABASE_URL`
3. Below that, find "anon public" row with a long key (starts with `eyJh...`)
   - **Copy** that token → save as `SUPABASE_ANON_KEY`
4. **Never commit these to git** — add to `.env` or Vercel env vars only

---

## Step 2: Local Testing

### 2a. Start Local Server
```bash
cd /path/to/sls-main/forces/live
python3 -m http.server 8000
```
Visit:
- Host: `http://localhost:8000/host.html`
- Student (tab 2): `http://localhost:8000/student.html`

### 2b. Run Quiz
1. **Host page**: 
   - Click "Create Session"
   - Paste `SUPABASE_URL` + `SUPABASE_ANON_KEY` when prompted
   - Copy session code
2. **Student page (new tab)**:
   - Paste session code
   - Enter name (e.g., "Alice")
   - Click Join
3. **Host dashboard**: Should show Alice joined
4. **Host**: Click "Next Question" → student sees first question
5. **Student**: Select answer → Click Submit
6. **Host**: See bar chart update live

---

## Step 3: Deploy to Vercel

### 3a. Prepare Git
```bash
cd /path/to/sls-main
git add forces/live/
git commit -m "Add live quiz module"
git push origin main
```

### 3b. Deploy Frontend
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project" → Paste your GitHub repo URL
3. Select `Root Directory: ./forces/live` (or import whole repo)
4. **Environment Variables**:
   - Add `SUPABASE_URL` = your URL
   - Add `SUPABASE_ANON_KEY` = your key
5. Click "Deploy"
6. Vercel generates URL like `https://live-quiz-xxx.vercel.app`

### 3c. Access in Production
- Host: `https://live-quiz-xxx.vercel.app/host.html`
- Student: `https://live-quiz-xxx.vercel.app/student.html`

---

## Usage

### Host Workflow
1. Enter Teacher ID
2. "Create Session" → get code (e.g., ABC123)
3. Share code with students
4. Watch response chart update live
5. "Next Question" after each one
6. "End Session" when done

### Student Workflow
1. Enter session code from teacher
2. Enter name
3. "Join" → wait for questions
4. Select answer → "Submit"
5. Auto-advances when teacher pushes next

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Missing Supabase credentials" | Paste URL/key on first page load or into sessionStorage in DevTools |
| No responses showing | Check Realtime is enabled in Supabase (SQL schema includes `alter publication`) |
| Students can't submit | Verify RLS policies allow `anon` inserts on `responses` table |
| Slow updates | Use browser DevTools Network tab; check Supabase API latency |

---

## Architecture

```
Host Dashboard
    ↓
  [Create Session] → Supabase DB
    ↓
Student Client
    ↓
  [Join Code] → Participants table
    ↓
  [Select Answer] → Responses table (realtime)
    ↓
Host sees live chart update via subscription
```

**DB Schema**:
- `sessions` — active quiz sessions
- `participants` — students in session
- `responses` — (session, question, participant, option, timestamp)

**Realtime**:
- Host listens to `responses` changes → refresh chart
- Students listen to `sessions.current_question_index` → auto-advance

---

## Next Steps

1. **Add more questions** to `../questions.json`
2. **Customize** question types (true/false, multiple select, etc.)
3. **Scale test** with k6 or Artillery before large class
4. **Export results** CSV from Supabase for grading
5. **Gamification**: leaderboards, streak bonuses, etc.

---

## Files

| File | Purpose |
|------|---------|
| `host.html` | Teacher dashboard UI |
| `host.js` | Host session & chart logic |
| `student.html` | Student join & answer UI |
| `student.js` | Student answer submission logic |
| `supabase-helper.js` | Shared DB & Realtime helpers |
| `style.css` | Unified styles |
| `supabase-schema.sql` | DB create statements |

---

**Happy quizzing!**
