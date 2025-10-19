# LumaWell MVP (Next.js 14 + Supabase)

This repository implements the LumaWell MVP defined in `project.md`: a daily planner that combines workouts, meals, and micro-habits with energy-aware scheduling.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**  
   Duplicate `.env.example` to `.env.local` and supply your Supabase keys plus Stripe secrets when available.

3. **Run database migrations**

   - Open the Supabase SQL editor and execute `supabase/schema.sql`.
   - Seed baseline content:

     ```bash
     npm run seed
     ```

4. **Start the app**

   ```bash
   npm run dev
   ```

   The site lives at `http://localhost:3000`.

## Core features

- **Email OTP signup** with Supabase Auth helpers (`/signup`).
- **Onboarding calibration** collects goals, constraints, and energy preferences, then generates the first plan (`/onboarding`).
- **Today dashboard** shows the energy forecast, daily tasks, status toggles, and a 2-minute check-in (`/today`).
- **Weekly planner** renders a 7-day grid with auto-slot heuristics and manual slot overrides (`/planner`).
- **Meals hub** lists presets and compiles grocery lists from selected meals (`/meals`).
- **Reports** visualize streaks and completion rates (`/reports`).
- **Account** summarizes profile data and subscription state with Stripe entry points (`/account`).

## Project structure

- `app/` - Next.js App Router pages and route handlers.
- `components/` - Client components (forms, planners, controls).
- `lib/` - Supabase clients, domain types, and planning heuristics.
- `supabase/` - SQL schema + JSON seeds for programs, workouts, and meals.
- `scripts/seed.ts` - Seeds Supabase tables via the service role key.

## Stripe & nudges

Stripe checkout/portal routes (`app/api/stripe/*`) currently return 501 responses as placeholders. Replace them with real session creation when Stripe keys are ready. Push/email nudges share the data model (`tasks`, `nudges`, `task_events`) and await integration with a service worker and messaging provider.

## Testing ideas

- Supabase row-level security: verify that authenticated users can only read/write their own rows.
- Daily plan generation: seed multiple energy profiles and confirm micro fallback kicks in under low energy.
- Planner auto-slot: run against varied `energy_windows` to ensure workouts land in high-energy windows.

## Next steps

1. Connect Stripe checkout session/portal handlers using the server-side SDK.
2. Implement push registration (`profiles.push_token`) plus a Supabase Edge Function for dispatch.
3. Replace manual slot selector with drag-and-drop reordering (e.g., using `@dnd-kit`).
4. Add integration tests for server actions (e.g., with Playwright or Vitest + MSW).
