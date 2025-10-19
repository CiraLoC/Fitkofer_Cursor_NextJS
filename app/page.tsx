import Link from "next/link";

const highlights = [
  {
    title: "Personalized daily plan",
    description:
      "Auto-built workouts, meals, and micro-habits tuned to your energy windows and constraints."
  },
  {
    title: "2-minute check-ins",
    description:
      "Log energy, mood, and sleep to re-order your day with realistic adjustments in seconds."
  },
  {
    title: "Weekly planner",
    description:
      "Drag and drop blocks into your best windows while LumaWell fills gaps with smart defaults."
  }
];

export default function MarketingPage() {
  return (
    <div className="grid">
      <section className="card">
        <h1>LumaWell beta</h1>
        <p>
          One dashboard that keeps busy moms on track across movement, meals, and micro-habits.
          Grounded in cycle-aware programming and evidence-based nutrition playbooks.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
          <Link href="/signup" className="button">
            Start free trial
          </Link>
          <Link href="/today" className="button secondary">
            Preview product
          </Link>
        </div>
      </section>

      <section className="grid two">
        {highlights.map((highlight) => (
          <article key={highlight.title} className="card">
            <h3>{highlight.title}</h3>
            <p>{highlight.description}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>What&apos;s inside the MVP</h2>
        <ul>
          <li>Onboarding calibration with condition toggles</li>
          <li>Energy-aware daily plan with fallback micro-habits</li>
          <li>Weekly planner with auto-slotting heuristics</li>
          <li>Meal presets, grocery exports, and nudges (email/push)</li>
          <li>Stripe-powered subscriptions and progress reporting</li>
        </ul>
      </section>
    </div>
  );
}
