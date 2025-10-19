# LumaWell — MVP PRD (Next.js 14 + Supabase)

## 1) Goal
Ship a web app that gives busy moms a single daily plan across fitness, meals, and micro-habits. Personalization is basic but real: cycle/condition toggles, 2-min daily check-in, simple energy forecast, micro-nudges, and a weekly planner.

## 2) Primary user
Busy mom, 25–45, limited time, wants small consistent wins. New to structured training. No coaching budget.

## 3) Scope (v1)
- Onboarding calibration + condition/cycle toggles
- Daily 2-min check-in
- Heuristic energy forecast (morning/afternoon/evening)
- Auto-generated **Daily Plan** (workout or walk, one meal preset, one micro-habit, wind-down)
- Weekly **Planner** with drag-and-drop and auto-slotting into favorable windows
- Meal presets + grocery list
- Micro-nudges via web push + email
- Three program templates (Fat Loss Home, Recomp Gym, Glute Home)
- Simple reports: streak, week scorecard
- Stripe checkout (monthly, yearly)

## 4) Out of scope (v1)
Wearable/HealthKit live sync, native apps, community chat, CGM integration, advanced macros, video hosting beyond links, AI meal generation, coaching marketplace.

---

## 5) User stories
1. As a new user, I complete calibration in <3 min and get a plan for today.  
2. As a user, I set postpartum/IR/Hashimoto/PCOS toggles and get safe templates.  
3. As a user, I do a 2-min check-in and see today auto-adjust.  
4. As a user, I drag items on a weekly calendar; app auto-slots to high-energy windows.  
5. As a user, I get a small nudge when a window opens; I can snooze or complete.  
6. As a user, I export a grocery list for the week.  
7. As a user, I see my streak and a simple weekly score.

Acceptance for each story listed in section 14.

---

## 6) Core flows (UX)
- **Onboarding**: email auth → calibration (sleep schedule, known highs/lows, household constraints, available equipment) → condition/cycle toggles → pick goal/program → generate week plan → land on Today.
- **Daily check-in**: energy (1–5), mood (1–5), sleep hrs, wake time. Submit → recompute energy windows → re-order today.
- **Planner**: week grid with three windows/day. Drag workouts, meal-prep blocks, and wellness slots. “Auto-slot” button fills empty windows. Micro-fallback toggles on conflict.
- **Nudges**: service worker push. Buttons: Done, Snooze 30m, Dismiss. Log response.

---

## 7) Data model (Supabase Postgres)

```sql
-- Users handled by auth.users
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  tz text not null default 'UTC',
  goal text check (goal in ('fat_loss','recomp','glute')),
  equipment text[],                 -- ['bands','dumbbells','gym']
  sleep_wake jsonb,                 -- {weekdays:{bed: "22:30", wake:"06:30"}, weekends:{...}}
  energy_pref jsonb,                -- {morning:2, afternoon:5, evening:3} user belief
  conditions jsonb,                 -- {postpartum: true, ir:true, hashimoto:false, pcos:false}
  cycle_phase text,                 -- 'follicular','ovulatory','luteal','menstrual', null
  created_at timestamptz default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  key text unique,                  -- 'fat_loss_home', 'recomp_gym', 'glute_home'
  title text, description text,
  level text,                       -- 'beginner','intermediate'
  meta jsonb                        -- {equipment:['bands'], condition_safe:{postpartum:true,...}}
);

create table program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  week_number int,
  plan jsonb                        -- list of workouts + optional meal-prep and walks
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  title text, focus text, duration_min int,
  equipment text[], video_url text,
  steps jsonb                       -- [{name:'Goblet Squat', sets:3, reps:'8-10'}]
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  title text, preset_key text,      -- 'deficit_basic','bulk_basic','ir_friendly','hashimoto_friendly'
  kcal int, macros jsonb, recipe_url text, grocery jsonb -- [{item:'oats',qty:'100g'}]
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  sleep_hours numeric, wake_time time,
  energy int check (energy between 1 and 5),
  mood int check (mood between 1 and 5),
  notes text,
  unique(user_id, date)
);

create table energy_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  morning int, afternoon int, evening int,   -- 1..5
  source text,                                -- 'heuristic_v1'
  unique(user_id, date)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  slot text check (slot in ('morning','afternoon','evening')),
  type text check (type in ('workout','walk','meal_prep','meal','micro','wind_down')),
  ref_id uuid,                                  -- link to workouts/meals or null
  title text, duration_min int,
  intensity text,                                -- 'high','low','micro'
  status text default 'planned',                 -- 'planned','done','skipped'
  created_at timestamptz default now()
);

create table task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  event text, -- 'nudge_sent','done','skipped','snoozed'
  meta jsonb,
  created_at timestamptz default now()
);

create table grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  items jsonb                           -- [{item:'oats',qty:'500g',checked:false}]
);

create table subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text, status text, renews_at timestamptz, stripe_customer text, stripe_sub text
);
```

**RLS**  
Enable RLS on all user tables. Policies: user can `select/insert/update/delete` where `user_id = auth.uid()`. Non-user tables read-only to all; writes restricted to service role.

Indexes: `(user_id, date)` for `checkins`, `energy_windows`, `tasks`.

---

## 8) Algorithms (v1 heuristics)

**Energy forecast**
```
Inputs: checkin.energy (1–5), sleep_hours, wake_time variance, profile.energy_pref.
Base per slot = energy_pref[slot].
Adjust:
  +1 to morning if wake_time variance < 45m and sleep_hours >=7.
  -1 to evening if sleep_hours <6.
  +1 to afternoon if checkin.energy >=4.
Clamp 1..5.
Output: scores for morning/afternoon/evening.
```

**Scheduler**
```
For each day:
  Required: 1 primary workout or 20–30m walk, 1 meal preset, 1 micro-habit, 1 wind-down.
  Sort slots by energy desc.
  Place workout in highest slot with energy>=4; else place a 15m micro-workout.
  Place walk/NEAT in next available slot.
  Place meal_prep on Sunday afternoon if no block exists; else keep current.
  Place micro (stand/breathe/sunlight) in lowest slot.
Create tasks accordingly.
```

**Adaptive nudges**
```
Nudge when slot start - 10m.
If snoozed twice in a week for same slot → shift 30m later next time.
If dismissed rate >60% for slot in last 7 days → downgrade to micro version.
If done rate >70% → upgrade duration/intensity one step next week.
```

---

## 9) API contracts (Next.js Route Handlers)

- `POST /api/onboarding/complete`  
  Body: `{profile, conditions, cycle_phase, goal, energy_pref, sleep_wake}`  
  Effect: upsert `profiles`, create first `grocery_list`, seed week plan.

- `POST /api/checkins`  
  Body: `{date, sleep_hours, wake_time, energy, mood, notes}`  
  Effect: upsert `checkins`, recompute `energy_windows`, adjust today tasks.

- `GET /api/plan/today` → `{date, tasks:[...]}`

- `POST /api/plan/autoslot`  
  Body: `{week_start}` → fills empty slots using Scheduler.

- `PATCH /api/tasks/:id`  
  Body: `{status}` → logs `task_events`.

- `POST /api/nudges/ack`  
  Body: `{task_id, action:'done'|'snooze'|'dismiss'}`

- `GET /api/grocery?week_start=YYYY-MM-DD` → `{items:[...]}`

- `POST /api/stripe/webhook`  
  Effect: update `subscriptions`.

---

## 10) Tech stack
- **Next.js 14** App Router, TypeScript, Tailwind, shadcn/ui.
- **Supabase** Auth, Postgres, RLS, Storage (static JSON for programs/meals), Edge Functions.
- **Stripe** Checkout + Customer Portal.
- **Push**: OneSignal or Web Push + service worker.  
- **Email**: Resend for nudges + weekly summary.
- **Analytics**: PostHog (events: onboarding_completed, checkin_submitted, nudge_sent, nudge_action, task_done, plan_autoslot, checkout_started, subscribe_success).

---

## 11) Pages (MVP)
- `/` Marketing + CTA.
- `/signup` Email OTP.
- `/onboarding` Multi-step calibration.
- `/today` Daily Plan.
- `/planner` Week grid with auto-slot.
- `/meals` Presets + grocery export.
- `/reports` Streak + weekly score.
- `/account` Subscription + settings.

---

## 12) Content seeds
- **Programs**: `fat_loss_home`, `recomp_gym`, `glute_home` (12 weeks each).  
- **Workouts**: 36 total. Host videos on unlisted YouTube/Vimeo links.  
- **Meals**: 60 presets. Tags: `deficit`, `bulk`, `ir_friendly`, `hashimoto_friendly`.

---

## 13) Notifications
- Rules: one nudge per planned slot. Respect user local TZ and quiet hours 21:00–07:00.  
- Templates: “Stand & stretch (2m)?”, “5-min sunlight now?”, “Time for today’s 20-min walk.”  
- Weekly email Sunday 17:00: next week plan + grocery list.

---

## 14) Acceptance criteria

**Onboarding**
- User completes in ≤10 steps.  
- After submit, `/today` shows 4 tasks for the day.  
- RLS prevents cross-user access (tested).

**Check-in**
- Submitting updates `energy_windows` and reorders tasks within 1s p95.  
- If energy <3, workout auto-downshifts to micro version.

**Planner**
- Drag-drop persists. Auto-slot fills all missing items.  
- Micro-fallback if conflicting tasks in same slot.

**Nudges**
- Push arrives within 1 min of slot start.  
- Snooze shifts by 30m and updates `task_events`.

**Meals**
- Grocery list aggregates ingredients by week, quantities merged.  
- Meal preset swap updates grocery list.

**Reports**
- Streak increments on any “done” task.  
- Weekly score = normalized sum of done tasks / planned tasks.

**Payments**
- Stripe success sets `subscriptions.status='active'` and gates paywalled pages.

---

## 15) Security & privacy
- RLS on all user-owned tables.  
- JWT auth via Supabase.  
- PII minimal: email, name optional.  
- Error logs exclude health data.  
- Data deletion endpoint on account page.

---

## 16) Performance/NFR
- p95 page TTFB < 300ms (Edge-cached static + server actions).  
- Core writes < 100ms p95.  
- 99.9% task integrity under RLS tests.  
- Basic a11y: keyboard navigation, contrast, semantic headings.

---

## 17) Admin
- Simple admin page behind service-role for seeding programs/meals and editing content JSON.  
- Feature flags table for rolling out nudges and scheduler.

---

## 18) Rollout plan
- Closed beta for 50 users.  
- Observability dashboards: funnel, nudge acceptance, task completion.  
- Fix critical issues. Open to paid.

---

## 19) Milestones

**Week 1–2**  
Auth, schema + RLS, onboarding UI, seed content.

**Week 3–4**  
Check-in, energy forecast, daily plan, tasks CRUD.

**Week 5**  
Planner grid + auto-slot, grocery list.

**Week 6**  
Nudges (push/email) + adaptive rules v1.

**Week 7**  
Stripe, gating, basic reports, analytics.

**Week 8**  
QA, a11y, perf, docs.

---

## 20) Handoff notes for coding agent
- Create DB from provided SQL. Enable RLS.  
- Seed programs/workouts/meals from JSON in Supabase Storage; import to tables on boot.  
- Implement scheduler and energy heuristics as server actions in `/app/(core)/lib/plan.ts`.  
- Use server components for data fetch. Client components for drag-drop and check-in.  
- Set up service worker for push. Store push tokens in `profiles`.  
- Supabase Edge Function `dailyPlanner` runs 04:30 user TZ to prebuild plans for next day.  
- Wrap all writes in `user_id = session.user.id`.

---

## 21) Backlog (post-MVP)
Wearables import, cycle auto-detection, mobile wrapper, community pods, AI meal swaps, form-video capture, A/B of nudge timing, coach marketplace.
