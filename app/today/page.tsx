import { format, formatISO } from "date-fns";
import { redirect } from "next/navigation";
import { CheckInForm } from "@/components/checkin-form";
import { TaskStatusControls } from "@/components/task-status-controls";
import { createServerClient } from "@/lib/supabase/server-client";

type TaskRow = {
  id: string;
  date: string;
  slot: string;
  type: string;
  title: string;
  duration_min: number | null;
  intensity: string | null;
  status: string;
};

const SLOT_ORDER = ["morning", "afternoon", "evening"];

function sortTasks(tasks: TaskRow[]) {
  return [...tasks].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
}

export default async function TodayPage() {
  const supabase = createServerClient();
  const [{ data: sessionData }, profileRes] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("profiles").select("name, goal").maybeSingle()
  ]);

  if (!sessionData.session) {
    redirect("/signup");
  }

  const today = formatISO(new Date(), { representation: "date" });

  const [{ data: tasks }, { data: energy }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("date", today)
      .order("slot", { ascending: true }),
    supabase
      .from("energy_windows")
      .select("morning, afternoon, evening")
      .eq("date", today)
      .maybeSingle()
  ]);

  const sorted = sortTasks(tasks ?? []);
  const energySummary = energy ?? { morning: 3, afternoon: 4, evening: 2 };

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h1>
          Welcome back{profileRes.data?.name ? `, ${profileRes.data.name}` : ""}.
        </h1>
        <p>
          {format(new Date(), "EEEE, MMMM d")} - Goal:{" "}
          {profileRes.data?.goal ? profileRes.data.goal.replace("_", " ") : "not set"}
        </p>
      </div>

      <section className="grid two">
        <div className="card">
          <h2>Today&apos;s energy forecast</h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            {SLOT_ORDER.map((slot) => (
              <div key={slot} style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, textTransform: "capitalize" }}>{slot}</p>
                <p style={{ fontSize: "2rem", fontWeight: 700 }}>{energySummary[slot]}</p>
                <small style={{ color: "#6b7280" }}>1 low - 5 high</small>
              </div>
            ))}
          </div>
        </div>

        <CheckInForm date={today} />
      </section>

      <section className="card">
        <h2>Your day at a glance</h2>
        <div className="grid" style={{ gap: "1rem" }}>
          {sorted.map((task) => (
            <article
              key={task.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{task.slot}</span>
                <span style={{ color: "#7c3aed", fontWeight: 600 }}>{task.type}</span>
              </div>
              <p style={{ fontSize: "1.05rem", fontWeight: 600, marginTop: "0.5rem" }}>
                {task.title}
              </p>
              <small style={{ color: "#6b7280" }}>
                {task.duration_min ? `${task.duration_min} min - ` : ""}
                {task.intensity ? `${task.intensity} intensity - ` : ""}
                Status: {task.status}
              </small>
              <TaskStatusControls taskId={task.id} status={task.status} />
            </article>
          ))}
          {!sorted.length && <p>No plan yet. Complete onboarding to generate your day.</p>}
        </div>
      </section>
    </div>
  );
}
