import { differenceInCalendarDays, format, formatISO, startOfWeek, subDays } from "date-fns";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server-client";

interface Stats {
  streak: number;
  completionRate: number;
  doneThisWeek: number;
  plannedThisWeek: number;
}

function computeStats(tasks: any[]): Stats {
  const today = formatISO(new Date(), { representation: "date" });
  const sortedDates = Array.from(
    new Set(tasks.map((task) => task.date).sort((a, b) => (a > b ? 1 : -1)))
  );

  let streak = 0;
  for (let i = sortedDates.length - 1; i >= 0; i -= 1) {
    const date = sortedDates[i];
    const diff = differenceInCalendarDays(new Date(today), new Date(date));
    const dayTasks = tasks.filter((task) => task.date === date);
    const anyDone = dayTasks.some((task) => task.status === "done");
    if (diff === streak && anyDone) {
      streak += 1;
    } else if (diff > streak || !anyDone) {
      break;
    }
  }

  const currentWeekStartIso = formatISO(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    { representation: "date" }
  );
  const currentWeekTasks = tasks.filter((task) => task.date >= currentWeekStartIso);
  const doneThisWeek = currentWeekTasks.filter((task) => task.status === "done").length;
  const plannedThisWeek = currentWeekTasks.length;

  return {
    streak,
    completionRate: plannedThisWeek ? doneThisWeek / plannedThisWeek : 0,
    doneThisWeek,
    plannedThisWeek
  };
}

export default async function ReportsPage() {
  const supabase = createServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/signup");
  }

  const since = subDays(new Date(), 28);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, date, status, type")
    .gte("date", formatISO(since, { representation: "date" }))
    .order("date", { ascending: true });

  const stats = computeStats(tasks ?? []);

  const grouped = (tasks ?? []).reduce<Record<string, { planned: number; done: number }>>(
    (acc, task) => {
      if (!acc[task.date]) {
        acc[task.date] = { planned: 0, done: 0 };
      }
      acc[task.date].planned += 1;
      if (task.status === "done") {
        acc[task.date].done += 1;
      }
      return acc;
    },
    {}
  );

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h1>Progress reports</h1>
        <p>Track streaks and weekly scorecards based on completed tasks.</p>
      </div>

      <section className="grid two">
        <article className="card">
          <h2>Streak</h2>
          <p style={{ fontSize: "2.5rem", fontWeight: 700 }}>{stats.streak} days</p>
          <p style={{ color: "#6b7280" }}>Streak increments whenever any planned task is done.</p>
        </article>
        <article className="card">
          <h2>Weekly score</h2>
          <p style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            {(stats.completionRate * 100).toFixed(0)}%
          </p>
          <p style={{ color: "#6b7280" }}>
            {stats.doneThisWeek} done / {stats.plannedThisWeek} planned this week.
          </p>
        </article>
      </section>

      <section className="card">
        <h2>Recent days</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Planned</th>
              <th>Done</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([date, summary]) => (
              <tr key={date}>
                <td>{format(new Date(date), "EEE MMM d")}</td>
                <td>{summary.planned}</td>
                <td>{summary.done}</td>
                <td>
                  {summary.planned
                    ? `${Math.round((summary.done / summary.planned) * 100)}%`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
